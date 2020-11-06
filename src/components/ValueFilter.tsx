import React from "react"
import { uniq, flatMap, indexBy, pipe, map, groupBy } from 'remeda'
import styled from 'styled-components'
import { colMd, ColumnValueMd, Opt, tableMdForCol, TablesMetadata } from '../common/Metadata'
import { entries, keys, orderBy, values } from '../common/Pipe'
import { numFormat } from '../common/Utils'
import { Tag } from './Channel'
import { InlineForm } from './InlineForm'
import { OptionList } from './InlineSelect'
export type FilterState = Record<string, string[]>



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
  filter: TFilter
  onFilter: (f: TFilter) => void
  rows?: TRow[]
  //filterValues?: FilterValues
}
export const InlineValueFilter = <TRow, TFilter extends FilterState>(p: FilterFormProps<TRow, TFilter>) => <InlineForm<TFilter>
  inlineRender={f => inlineFilterElement(p.md, f)} value={p.filter} onChange={f => p.onFilter(f)} keepOpenOnChange>
  <FilterForm {...p} />
</InlineForm>

const tableColOptions = <TRow, TFilter extends FilterState>(md: TablesMetadata, table: string, col: string, filter: TFilter, rows?: TRow[]) => {
  const c = colMd(md, table, col)
  const allOption: FilterColOption = { value: { value: '_all', num: rows?.length }, label: `All - ${c.label}`, color: '#444', selected: isSelected(filter, col, '_all') }

  const mdByVal = indexBy(c.values, v => v.value)

  if (!rows) rows = []

  // values from data
  const rawColValues = flatMap(rows, r => {
    const v = r[col]
    return Array.isArray(v) ? v as string[] : [v as string]
  })

  const filterValues = entries(groupBy(rawColValues, v => v)).map(([value, g]) => ({ value, num: g.length } as FilterColValue))
  const mdValues = (c.values.filter(v => !filterValues.find(f => f.value == v.value)).map(v => ({ value: v.value } as FilterColValue)).concat(filterValues))
  const filterOptions = pipe(mdValues,
    map(v => {
      const m = mdByVal[v.value]
      return ({ value: v, label: m?.label ?? v.value, color: m?.color, desc: m?.desc, selected: isSelected(filter, col, v.value) })
    }), // get metadata for all values
    orderBy(v => v.value.num ?? 0, 'desc')
  )
  return [allOption].concat(filterOptions)
}

const inlineFilterElement = (md: TablesMetadata, f: FilterState) => {
  if (!Object.values(f).some(f => f)) return <Tag label="All" color="#444" />
  //if (f.tags?.length == 0 || f.lr?.length == 0) return <Tag label="None" color="#444" />
  const filterOptions = getFilterOptions(md, f)
  const inlineOps = flatMap(keys(f),
    (c: keyof FilterState) => f[c] == null ? [] : filterOptions[c].options.filter(t => t.selected))
  return <span >{inlineOps.map(t => <Tag key={t.value.value} label={t.label} color={t.color} style={{ margin: '0.2em' }} />)}</span>
}

const getFilterOptions = <TRow, TFilter extends FilterState>(md: TablesMetadata, filter: TFilter, rows?: TRow[])
  : Record<string, FilterOption> => {
  const res = pipe(
    keys(filter),
    map(f => {
      const table = tableMdForCol(md, f)
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

const FilterForm = <TRow, TFilter extends FilterState>({ filter, onFilter, rows, md }: FilterFormProps<TRow, TFilter>) => {
  const filterOptions = getFilterOptions(md, filter, rows)
  const tagRender = (o: FilterColOption) => <div className='item'>
    <Tag label={o.label} color={o.color} />{o.value.num && <span className='num'>{numFormat(o.value.num)}</span>}
  </div>
  const onSelect = (o: FilterColOption, col: keyof TFilter) => onFilter(filterWithSelect(filter, col, o.value.value, o.selected))
  return < FilterFormStyle >
    {values(filterOptions).map(f => <OptionList key={f.col} options={f.options} itemRender={tagRender} onChange={o => onSelect(o, f.col)} />)}
  </FilterFormStyle >
}

const isSelected = <T extends FilterState,>(filter: T, col: string, v: string) => {
  const c = filter[col]
  if (v == '_all') return !c
  return !c || c.includes(v)
}

const filterWithSelect = <T extends FilterState,>(f: T, col: keyof T, val: string, select: boolean): T => {
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