import React, { useEffect, useState } from "react"
import { first, indexBy, uniq } from 'remeda'
import { BlobIndex } from '../common/BlobIndex'
import { Channel, getChannels } from '../common/Channel'
import { useQuery } from '../common/QueryString'
import { ChannelViewIndexes, getVideoViews, indexChannelViews, indexRemovedVideos, indexTopVideos, VideoRemoved, VideoViews } from '../common/RecfluenceApi'
import { FilterHeader } from '../components/FilterCommon'
import Layout from "../components/Layout"
import { Spinner } from '../components/Spinner'
import { Videos } from '../components/Video'
import { FilterValues, InlineVideoFilter, VideoFilter, videoFilterIncludes } from '../components/VideoFilter'
import { useLocation } from '@reach/router'
import { dateFormat, navigateNoHistory } from '../common/Utils'
import { Popup } from '../components/Popup'
import { ChannelDetails } from '../components/Channel'
import { orderBy } from '../common/Pipe'
import { DateRangePicker, DateRangeProps } from 'react-date-range'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { addDays, endOfToday, parseISO, startOfToday } from 'date-fns'
import { InlineForm } from '../components/InlineForm'
import { utcDays } from 'd3'
import styled from 'styled-components'

interface QueryState extends Record<string, string> {
  openChannelId?: string
  start?: string
  end?: string
}

const RemovedVideosPage = () => {
  const [channels, setChannels] = useState<Record<string, Channel>>()
  const [idx, setIdx] = useState<BlobIndex<VideoRemoved, { lastSeen?: string }>>(null)
  const [channelIndexes, setChannelIndexes] = useState<ChannelViewIndexes>(null)
  const [q, setQuery] = useQuery<QueryState>(useLocation(), navigateNoHistory)
  const [videos, setVideos] = useState<VideoRemoved[]>(null)
  const [videoFilter, setVideoFilter] = useState<VideoFilter>({ tags: null, lr: null })
  const [filterValues, setFilterValues] = useState<FilterValues>(null)
  const [loading, setLoading] = useState(false)

  const dateRange = {
    startDate: q.start ? parseISO(q.start) : addDays(startOfToday(), -7),
    endDate: q.end ? parseISO(q.end) : endOfToday()
  }

  useEffect(() => {
    getChannels().then(channels => setChannels(indexBy(channels, c => c.channelId)))
    indexChannelViews().then(setChannelIndexes)
    indexRemovedVideos().then(setIdx)
  }, [JSON.stringify(dateRange)])

  useEffect(() => {
    if (!idx || !channels) return
    setLoading(true)
    idx.getRows(
      {
        from: { lastSeen: dateRange.startDate.toISOString() },
        to: { lastSeen: dateRange.endDate.toISOString() }
      }).then(vids => {
        setFilterValues(videos ? { errorType: uniq(vids.map(v => v.errorType)) } : null)
        setVideos(orderBy(vids.filter(v => videoFilterIncludes(videoFilter, v, channels)), v => v.lastSeen, 'desc'))
        setLoading(false)
      })
  }, [idx, channels, videoFilter])

  const openChannel = q.openChannelId ? channels?.[q.openChannelId] : null
  const onOpenChannel = (c: Channel) => setQuery({ openChannelId: c.channelId, openGroup: null })

  return <Layout>
    <FilterHeader style={{ marginBottom: '2em' }}>
      Removed videos filtered to
      <InlineVideoFilter
        filter={videoFilter}
        onFilter={(f) => {
          console.log('filter', f)
          setVideoFilter(f)
        }}
        showFilters={['tags', 'lr', 'errorType']}
        filterValues={filterValues}
      />
      within period
      <InlineDateRange
        ranges={[dateRange]}
        onChange={(v: any) => {
          const r = (v as { range1: DateRange }).range1 // in practice this is different to the types 💢
          console.log('range', r)
          return setQuery({ start: r.startDate?.toISOString(), end: r.endDate?.toISOString() })
        }}
      />
    </FilterHeader>
    <Videos channels={channels} onOpenChannel={onOpenChannel} videos={videos} showChannels loading={loading} defaultLimit={100} groupChannels />
    <Popup isOpen={openChannel != null} onRequestClose={() => setQuery({ openChannelId: null })}>
      {channelIndexes && <ChannelDetails channel={openChannel} mode='max' indexes={channelIndexes} />}
    </Popup>
  </Layout>
}

interface DateRange {
  startDate: Date
  endDate: Date
}


const DateRangeStyle = styled.div`
  .rdrDateRangePickerWrapper, .rdrDateDisplayWrapper, .rdrDefinedRangesWrapper, .rdrStaticRange, .rdrMonths, .rdrMonthAndYearWrapper {
    background-color: var(--bg1);
    color: var(--fg1);
  }

  .rdrDateDisplayItem, .rdrDateDisplayItemActive {
    background-color: var(--bg1);
    input {
      color: var(--fg1);
    }
  }

  .rdrNextPrevButton {
    background: var(--bg3);
    &:hover {
      background: var(--bg4);
    }
  }

  .rdrPprevButton i {
      border-color: transparent var(--fg3) transparent transparent !important;
  }

  .rdrNextButton i {
      border-color: transparent transparent transparent var(--fg3) !important;
  }

  .rdrDayToday .rdrDayNumber span:after {
    background: var(--bg-feature);
  }

  button.rdrDay .rdrDayNumber span {
    color: var(--fg);
  }

  button.rdrDayPassive .rdrDayNumber span {
    color: var(--fg3);
  }

  .rdrStaticRange {
    border-bottom: 1px solid var(--bg2);
    background: var(--bg1);


    &:hover, &:focus{
      .rdrStaticRangeLabel{
        background: var(--bg2);
      }
    }
  }

  .rdrStaticRange.rdrStaticRangeSelected span {
      color:var(--fg-feature);
    }

  .rdrDefinedRangesWrapper {
    border-right: solid 1px var(--bg2);
  }

  .rdrSelected, .rdrInRange, .rdrStartEdge, .rdrEndEdge{
    background: var(--bg-feature);
  }

`

const InlineDateRange = (p: DateRangeProps) => <InlineForm
  value={first(p.ranges as any) as DateRange}
  inlineRender={r => r ? <span>{dateFormat(r.startDate)} - {dateFormat(r.endDate)}</span> : <></>}>
  <DateRangeStyle><DateRangePicker {...p} /></DateRangeStyle>
</InlineForm>

export default RemovedVideosPage