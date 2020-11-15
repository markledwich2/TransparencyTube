import React from "react"
import rem, { uniq, flatMap, indexBy, pipe, map, groupBy, mapValues, mapKeys, compact } from 'remeda'
import styled from 'styled-components'
import { colMd, ColumnValueMd, Opt, tableMdForCol, TablesMetadata } from '../common/Metadata'
import { entries, keys, orderBy, values } from '../common/Pipe'
import { mapToObj } from '../common/remeda/mapToObj'
import { numFormat } from '../common/Utils'
import { Tag } from './Channel'
import { InlineForm } from './InlineForm'
import { OptionList } from './InlineSelect'
import { StyleProps } from './Layout'


export type FilterState<T> = { [P in Extract<keyof T, string>]?: string[] }

interface FilterColValue {
  value: string,
  num?: number
}

type FilterColOption = Opt<FilterColValue> & ColumnValueMd<FilterColValue> & { selected?: boolean }

interface FilterOption {
  table: string,
  col: string,
  options: FilterColOption[]
}

interface FilterFormProps<TRow, TFilter> {
  md: TablesMetadata
  filter: FilterState<TFilter>
  onFilter: (f: FilterState<TFilter>) => void
  rows?: TRow[]
}

export const filterIncludes = <T,>(filter: FilterState<T>, row: T) => {
  if (!filter || !row) return true
  const colTest = (c: Extract<keyof T, string>): boolean => {
    var filterValues = filter[c]
    if (!filterValues) return true
    const rv = row?.[c]
    if (rv === undefined) {
      console.error(`filtering by col '${c}' which is undefined on row:`, row)
      return false
    }
    if (Array.isArray(rv)) return filterValues.every(fv => rv.includes(fv))
    if (typeof rv == 'string') return filterValues.includes(rv)
    throw 'not implemented. Only support string[] | string'
  }
  return keys(filter).every(colTest)
}

export const InlineValueFilter = <TRow, TFilter>(p: FilterFormProps<TRow, TFilter> & StyleProps) => <InlineForm
  style={p.style}
  inlineRender={f => inlineFilterElement(p.md, f)}
  value={p.filter}
  onChange={f => p.onFilter(f)}
  keepOpenOnChange>
  <FilterForm {...p} />
</InlineForm>

const tableColOptions = <TRow, TFilter>(md: TablesMetadata, table: string, col: string, filter: FilterState<TFilter>, rows?: TRow[]) => {
  const c = colMd(md, col, table)
  const allOption: FilterColOption = { value: { value: '_all', num: rows?.length }, label: `All - ${c.label}`, color: '#444', selected: isSelected(filter, col, '_all') }

  const mdByVal = indexBy(c.values ?? [], v => v.value)

  if (!rows) rows = []

  // values from data
  const rawColValues = compact(flatMap(rows, r => {
    const v = r[col]
    return Array.isArray(v) ? v as string[] : [v as string]
  }))

  var filterValues = entries(groupBy(rawColValues, v => v)).map(([value, g]) => ({ value, num: g.length } as FilterColValue))
  filterValues = c.values?.filter(v => !filterValues.find(f => f.value == v.value)).map(v => ({ value: v.value })).concat(filterValues) ?? filterValues
  filterValues = (filter?.[col] ?? []).filter(v => !filterValues.find(f => f.value == v)).map(v => ({ value: v })).concat(filterValues)
  const filterOptions = pipe(filterValues,
    map(v => {
      const m = mdByVal[v.value]
      return ({ value: v, label: m?.label ?? v.value, color: m?.color, desc: m?.desc, selected: isSelected(filter, col, v.value) })
    }), // get metadata for all values
    orderBy(v => v.value.num ?? 0, 'desc')
  )
  return [allOption].concat(filterOptions)
}

const inlineFilterElement = <TFilter,>(md: TablesMetadata, f: FilterState<TFilter>) => {
  if (!Object.values(f).some(f => f)) return <Tag label="All" color="#444" />
  //if (f.tags?.length == 0 || f.lr?.length == 0) return <Tag label="None" color="#444" />
  const filterOptions = getFilterOptions(md, f)
  const inlineOps = flatMap(keys(f), (c) => f[c] == null ? [] : filterOptions[c as string].options.filter(t => t.selected))
  return <span >{inlineOps.map(t => <Tag key={t.value.value} label={t.label} color={t.color} style={{ margin: '0.2em' }} />)}</span>
}

const getFilterOptions = <TRow, TFilter>(md: TablesMetadata, filter: FilterState<TFilter>, rows?: TRow[])
  : Record<string, FilterOption> => {
  const res = pipe(
    keys(filter),
    map(f => {
      const table = tableMdForCol(md, f as string)
      return { table, col: f, options: tableColOptions(md, table, f, filter, rows) } as FilterOption
    }),
    indexBy(o => o.col)
  )
  return res
}

const FilterFormStyle = styled.div`
  display:flex;
  flex-direction:row;
  font-size:1rem;
  font-weight:normal;
  background-color: var(--bg);

  .item {
    filter:opacity(0.5);
    white-space: nowrap;
    &:hover {
      filter:none;
    }

    .num {
      font-weight: bold;
      margin-left: 1em;
    }
  }

  .selected .item {
    filter:none;
  }
`

const FilterForm = <TRow, TFilter>({ filter, onFilter, rows, md }: FilterFormProps<TRow, TFilter>) => {
  const filterOptions = getFilterOptions(md, filter, rows)
  const tagRender = (o: FilterColOption) => <div className='item'>
    <Tag label={o.label} color={o.color} style={{}} />
    {o.value.num > 0 && <span className='num'>{numFormat(o.value.num)}</span>}
  </div>
  const onSelect = (o: FilterColOption, col: Extract<keyof TFilter, string>) => onFilter(filterWithSelect(filter, col, o.value.value, o.selected))
  return < FilterFormStyle >
    {values(filterOptions).map(f => <OptionList key={f.col} options={f.options} itemRender={tagRender} onChange={o => onSelect(o, f.col as any)} />)}
  </FilterFormStyle >
}

const isSelected = <TFilter,>(filter: FilterState<TFilter>, col: string, v: string) => {
  const filterValues = filter[col]
  if (v == '_all') return !filterValues // all selected when filter null
  return filterValues?.includes(v) == true
}

const filterWithSelect = <TFilter,>(f: FilterState<TFilter>, col: Extract<keyof TFilter, string>, val: string, select: boolean): FilterState<TFilter> => {
  if (val == '_all') return { ...f, [col]: select ? null : [] } // if toggling all: null means no filter, [] means filter everything away
  const c = f[col]
  if (!c) return { ...f, [col]: [val] } // when previous value was null (all), then deselecting is selecting...
  return {
    ...f, ...{
      [col]: select ?
        uniq((c ?? []).concat(val)) :
        (f[col] ?? []).filter(v => v != val)
    }
  }
}

export const filterToQuery = (f: FilterState<any>) => mapValues(f, v => v?.join('|'))
export const filterFromQuery = <T,>(q: T, filterProps: (keyof T)[]) =>
  mapToObj(filterProps, p => {
    const filterValues = (q[p] as unknown as string)?.split('|').filter(s => s?.length > 0)
    return [p, filterValues?.length <= 0 ? null : filterValues] // treat an empty array as no filter
  })

export const filterFromState = <T,>(state: T): FilterState<T> => mapToObj(
  entries(state).filter(([k, v]) => v != null)
  , ([k, v]) => [k, [v]])