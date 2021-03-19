import { StringKeyOf } from 'elastic-ts/dist/elasticBuilder/utils'
import React from "react"
import rem, { uniq, flatMap, indexBy, pipe, map, groupBy, mapValues, mapKeys, compact, uniqBy, concat } from 'remeda'
import styled from 'styled-components'
import { colMd, ColumnMd, ColumnMdRun, ColumnMdVal, Opt, TableMd, TablesMetadata } from '../common/Metadata'
import { asArray, entries, keys, orderBy, values } from '../common/Pipe'
import { mapToObj } from '../common/remeda/mapToObj'
import { numFormat } from '../common/Utils'
import { Tag } from './Channel'
import { InlineForm } from './InlineForm'
import { OptionList } from './InlineSelect'
import { StyleProps } from './Style'

/**
 * Currently selected values that will filter a row. Only supply values for cols that are presented in the filter.
 * The filter can be single or multi select. This will be based on the values of this filter
 */
export type FilterState<T> = { [P in Extract<keyof T, string>]?: string[] | string }

interface FilterColValue {
  value: string,
  num?: number
}

type FilterColOption = Opt<FilterColValue> & ColumnMdVal<FilterColValue> & { selected?: boolean }

interface FilterOption {
  col: string,
  options: FilterColOption[]
}

export type FilterColMd = ColumnMdRun & { singleSelect?: boolean, sort?: { getVal?: (v: FilterColOption) => any, dir: 'asc' | 'desc' } }
export type FilterTableMd = Record<string, FilterColMd>

interface FilterFormProps<TRow, TFilter extends FilterState<Partial<TRow>>> {
  metadata: FilterTableMd
  filter: TFilter
  onFilter: (f: TFilter) => void
  rows?: TRow[]
  showCount?: boolean
}

export const filterIncludes = <T,>(filter: FilterState<T>, row: T) => {
  if (!filter || !row) return true
  const colTest = (c: Extract<keyof T, string>): boolean => {
    var filterValues: string | string[] = filter[c]
    if (!filterValues) return true
    const rv = row?.[c]
    if (rv === undefined) {
      //console.error(`filtering by col '${c}' which is undefined on row:`, row)

      return false
    }
    if (Array.isArray(rv)) return Array.isArray(filterValues) ? filterValues.every(fv => rv.includes(fv)) : rv.includes(filterValues)
    if (typeof rv == 'string' || rv == null) return filterValues.includes(rv as any as string | null)
    throw 'not implemented. Only support string[] | string'
  }
  return keys(filter).every(colTest)
}

export const InlineValueFilter = <TRow extends object, TFilter>(p: FilterFormProps<TRow, TFilter> & StyleProps) => <InlineForm
  style={p.style}
  inlineRender={f => inlineFilterElement(p.metadata, f)}
  value={p.filter}
  onChange={f => p.onFilter(f)}
  keepOpenOnChange>
  <FilterForm {...p} />
</InlineForm>

const tableColOptions = <TRow extends object, TFilter>(md: FilterTableMd, col: string, filter: TFilter, rows?: TRow[], showCount?: boolean) => {
  if (!rows) rows = []
  if (!md[col]) throw `No metadata found for '${col}'`
  const c = colMd(md[col], rows)
  const allOption: FilterColOption = { value: { value: '_all', num: rows?.length }, label: `All - ${c.label}`, color: '#444', selected: isSelected(filter, col, '_all') }
  const mdByVal = indexBy(c.values ?? [], v => v.value)
  const rawColValues = compact(flatMap(rows, r => asArray(r[col])))

  var filterValues = pipe(
    entries(groupBy(rawColValues, v => v)).map(([value, g]) => ({ value, num: g.length } as FilterColValue))
      .concat((c.values ?? []).map(v => ({ value: v.value })))
      .concat(asArray(filter?.[col]).map(v => ({ value: v }))),
    uniqBy(v => v.value)
  )

  const sort = c.sort ?? (showCount ? { getVal: (v) => v.value.num, dir: 'desc' } : { getVal: (v) => v.label, dir: 'desc' })

  const filterOptions = pipe(filterValues,
    map(v => {
      const m = mdByVal[v.value]
      return ({ value: v, label: m?.label ?? v.value, color: m?.color, desc: m?.desc, selected: isSelected(filter, col, v.value) })
    }), // get metadata for all values
    orderBy(v => sort.getVal(v), sort.dir)
  )
  return [allOption].concat(filterOptions)
}

const inlineFilterElement = <TFilter,>(md: FilterTableMd, f: FilterState<TFilter>) => {
  if (!Object.values(f).some(f => f)) return <Tag label="All" color="#444" />
  //if (f.tags?.length == 0 || f.lr?.length == 0) return <Tag label="None" color="#444" />
  const filterOptions = getFilterOptions(md, f)
  const inlineOps = flatMap(keys(f), (c) => f[c] == null ? [] : filterOptions[c as string].options.filter(t => t.selected))
  return <span >{inlineOps.map(t => <Tag key={t.value.value} label={t.label} color={t.color} style={{ margin: '0.2em' }} />)}</span>
}

const getFilterOptions = <TRow extends object, TFilter extends FilterState<Partial<TRow>>>(md: FilterTableMd, filter: TFilter, rows?: TRow[], showCount?: boolean)
  : Record<string, FilterOption> => {
  const res = pipe(
    keys(filter),
    map(f => {
      return { col: f, options: tableColOptions(md, f as string, filter, rows, showCount) } as FilterOption
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

const FilterForm = <TRow extends object, TFilter>({ filter, onFilter, rows, metadata: md, showCount }: FilterFormProps<TRow, TFilter>) => {
  const filterOptions = getFilterOptions(md, filter, rows, showCount)
  const tagRender = (o: FilterColOption) => <div className='item'>
    <Tag label={o.label} color={o.color} style={{}} />
    {showCount && o.value.num > 0 && <span className='num'>{numFormat(o.value.num)}</span>}
  </div>
  const onSelect = (o: FilterColOption, col: Extract<keyof TFilter, string>) =>
    onFilter(filterWithSelect(filter, col, md[col], o.value.value, o.selected))
  return < FilterFormStyle >
    {values(filterOptions).map(f => <OptionList key={f.col} options={f.options} itemRender={tagRender} onChange={o => onSelect(o, f.col as any)} />)}
  </FilterFormStyle >
}

const isSelected = <TFilter,>(filter: TFilter, col: string, v: string) => {
  const filterValues = filter[col]
  if (v == '_all') return !filterValues // all selected when filter null
  return Array.isArray(filterValues) ? filterValues?.includes(v) : filterValues == v
}

const filterWithSelect = <TFilter,>(f: TFilter, col: string, colMd: FilterColMd, val: string, select: boolean): TFilter => {
  // if toggling all: undefined means no filter, null means null values, []/'' means filter to no results
  if (val == '_all') return { ...f, [col]: select ? null : colMd.singleSelect ? '' : [] }
  if (colMd.singleSelect) return { ...f, [col]: val }
  const filterVal = colMd.singleSelect ? f[col] as string : f[col] as string[]
  if (!filterVal) return { ...f, [col]: [val] } // when previous value was null (all), then deselecting is selecting...
  const selection = select ? uniq((f[col] as string[] ?? []).concat(val)) : (f[col] as string[] ?? []).filter(v => v != val)
  return {
    ...f,
    ...{ [col]: selection }
  }
}

export const filterToQuery = (f: FilterState<any>) => mapValues(f, v => Array.isArray(v) ? v?.join('|') : v)
export const filterFromQuery = <T,>(q: T, filterProps: (keyof T)[]) =>
  mapToObj(filterProps, p => {
    const filterValues = (q[p] as unknown as string)?.split('|').filter(s => s?.length > 0)
    return [p, filterValues?.length <= 0 ? null : filterValues] // treat an empty array as no filter
  })

export const filterFromState = <T,>(state: T): FilterState<T> => mapToObj(
  entries(state).filter(([k, v]) => v != null)
  , ([k, v]) => [k, [v]])