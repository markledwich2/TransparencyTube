import React, { useState } from "react"
import { uniq, flatMap } from 'remeda'
import styled from 'styled-components'
import { Channel, ColumnValueMd, channelMd, channelColLabel } from '../common/Channel'
import { VideoViews, VideoWithStats } from '../common/RecfluenceApi'
import { Tag } from './Channel'
import { InlineForm } from './InlineForm'
import { Opt, OptionList } from './InlineSelect'

export interface VideoFilter {
  tags?: string[],
  lr?: string[]
}

export const videoFilterIncludes = (filter: VideoFilter, video: VideoViews, channels: Record<string, Channel>) => {
  if (!filter || !channels || !video) return true
  const colTest = (c: keyof Channel) => {
    var filterValues = filter[c] as string[]
    if (!filterValues) return true
    const cv = channels[video.channelId][c] as string | string[]
    return Array.isArray(cv) ? cv.some(v => filterValues.includes(v)) : filterValues.includes(cv)
  }
  return ['tags', 'lr'].every(colTest)
}

const isSelected = (filter: VideoFilter, col: keyof Channel, v: string) => {
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


const channelColOptions = (col: keyof Channel, filter: VideoFilter) => {
  var md = channelMd[col].values
  var allOption: FilterColOption = { value: '_all', label: `All - ${channelColLabel(col)}`, color: '#444', selected: isSelected(filter, col, '_all') }
  var options: FilterColOption[] = md.map(t => ({ ...t, label: t.label ?? t.value, selected: isSelected(filter, col, t.value) }))
  return [allOption].concat(options)
}

const InlineFilterElement = (f: VideoFilter) => {
  if (!f.tags && !f.lr) return <Tag label="All" color="#444" />
  if (f.tags?.length == 0 || f.lr?.length == 0) return <Tag label="None" color="#444" />
  const inlineOps = flatMap(['tags', 'lr'],
    (c: 'tags' | 'lr') => f[c] == null ? [] : channelColOptions(c, f).filter(t => t.selected))
  return <span >{inlineOps.map(t => <Tag key={t.value} label={t.label} color={t.color} style={{ margin: '0.2em' }} />)}</span>
}

export const InlineVideoFilter = (p: FilterFormProps) => <InlineForm<VideoFilter>
  inlineRender={InlineFilterElement} value={p.filter} onChange={f => p.onFilter(f)} keepOpenOnChange>
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

interface FilterFormProps { filter: VideoFilter, onFilter: (f: VideoFilter) => void }

const FilterForm = ({ filter, onFilter }: FilterFormProps) => {
  const tags = channelColOptions('tags', filter)
  const lr = channelColOptions('lr', filter)

  const tagRender = o => <div className='item'><Tag label={o.label} color={o.color} /></div>
  const onSelect = (o: FilterColOption, col: keyof VideoFilter) => onFilter(filterWithSelect(filter, col, o.value, o.selected))

  return < FilterFormStyle >
    <OptionList options={tags} itemRender={tagRender} onChange={o => onSelect(o, 'tags')} />
    <OptionList options={lr} itemRender={tagRender} onChange={o => onSelect(o, 'lr')} />
  </FilterFormStyle >
}
