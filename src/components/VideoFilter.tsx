import React, { useState } from "react"
import { uniq, flatMap, indexBy, pipe, map } from 'remeda'
import styled from 'styled-components'
import { Channel, ColumnValueMd, md, ColumnMd, colMd } from '../common/Channel'
import { entries, keys, values } from '../common/Pipe'
import { VideoCommon, VideoViews } from '../common/RecfluenceApi'
import { PartialRecord } from '../common/Utils'
import { Tag } from './Channel'
import { InlineForm } from './InlineForm'
import { Opt, OptionList } from './InlineSelect'


export interface VideoFilter {
  tags?: string[],
  lr?: string[],
  errorType?: string[]
}

export const videoFilterIncludes = (filter: VideoFilter, video: VideoCommon, channels: Record<string, Channel>) => {
  if (!filter || !channels || !video) return true
  const colTest = (c: keyof VideoFilter) => {
    var filterValues = filter[c]
    if (!filterValues) return true
    const tableMd = tableMdForCol(c)
    const record = tableMd == 'removedVideo' ? video : channels[video.channelId]
    const recordValue = record?.[c] as string | string[]
    return Array.isArray(recordValue) ? filterValues.every(fv => recordValue.includes(fv)) : filterValues.includes(recordValue)
  }
  return keys(filter).every(colTest)
}

const isSelected = (filter: VideoFilter, col: string, v: string) => {
  const c = filter[col]
  if (v == '_all') return !c
  return !c || c.includes(v)
}

const filterWithSelect = (f: VideoFilter, col: keyof VideoFilter, val: string, select: boolean): VideoFilter => {
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

type FilterColOption = Opt<string> & ColumnValueMd<string> & { selected?: boolean }

const tableColOptions = (table: keyof typeof md, col: string, filter: VideoFilter, filterValues?: string[]) => {
  const c = colMd(table, col)
  const allOption: FilterColOption = { value: '_all', label: `All - ${c.label}`, color: '#444', selected: isSelected(filter, col, '_all') }
  const additionRunOptions = filterValues?.filter(v => !c.values.find(cv => cv.value == v)).map(value => ({ value })) ?? []
  const options: FilterColOption[] = c.values
    .concat(additionRunOptions)
    .map(t => ({ ...t, label: t.label ?? t.value, selected: isSelected(filter, col, t.value) }))
  return [allOption].concat(options)
}

const inlineFilterElement = (f: VideoFilter, showFilters: (keyof VideoFilter)[], filterValues?: FilterValues) => {
  if (!Object.values(f).some(f => f)) return <Tag label="All" color="#444" />
  //if (f.tags?.length == 0 || f.lr?.length == 0) return <Tag label="None" color="#444" />
  const filterOptions = getFilterOptions(f, showFilters, filterValues)
  const inlineOps = flatMap(keys(f),
    (c: keyof VideoFilter) => f[c] == null ? [] : filterOptions[c].options.filter(t => t.selected))
  return <span >{inlineOps.map(t => <Tag key={t.value} label={t.label} color={t.color} style={{ margin: '0.2em' }} />)}</span>
}

export const InlineVideoFilter = (p: FilterFormProps) => <InlineForm<VideoFilter>
  inlineRender={f => inlineFilterElement(f, p.showFilters, p.filterValues)} value={p.filter} onChange={f => p.onFilter(f)} keepOpenOnChange>
  <FilterForm {...p} />
</InlineForm>

const FilterFormStyle = styled.div`
  display:flex;
  flex-direction:row;
  font-size:1rem;
  font-weight:normal;
  background-color: var(--bg);

  .item {
    filter:opacity(0.5);
    
    &:hover {
      filter:none;
    }
  }

  .selected .item {
    filter:none;
  }
`

const tableMdForCol = (col: keyof VideoFilter) => entries(md).find(e => e[1][col])[0]


type FilterColNames = keyof VideoFilter

interface FilterOption {
  table: keyof typeof md,
  col: FilterColNames,
  options: FilterColOption[]
}
const getFilterOptions = (filter: VideoFilter, showFilters: (keyof VideoFilter)[], filterValues?: FilterValues): Record<keyof typeof md, FilterOption> => {
  const res = pipe(
    showFilters,
    map(f => {
      const table = tableMdForCol(f)
      return { table, col: f, options: tableColOptions(table, f, filter, filterValues?.[f]) } as FilterOption
    }),
    indexBy(o => o.col)
  )
  return res
}

export type FilterValues = PartialRecord<FilterColNames, string[]>

interface FilterFormProps {
  filter: VideoFilter
  onFilter: (f: VideoFilter) => void
  showFilters: (keyof VideoFilter)[]
  filterValues?: FilterValues
}

const FilterForm = ({ filter, onFilter, showFilters, filterValues }: FilterFormProps) => {
  const filterOptions = getFilterOptions(filter, showFilters, filterValues)
  const tagRender = o => <div className='item'><Tag label={o.label} color={o.color} /></div>
  const onSelect = (o: FilterColOption, col: keyof VideoFilter) => onFilter(filterWithSelect(filter, col, o.value, o.selected))
  return < FilterFormStyle >
    {values(filterOptions).map(f => <OptionList key={f.col} options={f.options} itemRender={tagRender} onChange={o => onSelect(o, f.col)} />)}
  </FilterFormStyle >
}
