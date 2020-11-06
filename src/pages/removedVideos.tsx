import React, { useEffect, useState } from "react"
import { filter, groupBy, indexBy, map, pipe, uniq } from 'remeda'
import { BlobIndex } from '../common/BlobIndex'
import { Channel, getChannels, md } from '../common/Channel'
import { useQuery } from '../common/QueryString'
import { ChannelViewIndexes, indexChannelViews, indexRemovedVideos, VideoRemoved } from '../common/RecfluenceApi'
import { FilterHeader } from '../components/FilterCommon'
import Layout, { FlexRow } from "../components/Layout"
import { Videos } from '../components/Video'
import { VideoFilter, videoFilterIncludes } from '../components/VideoFilter'
import { useLocation } from '@reach/router'
import { navigateNoHistory } from '../common/Utils'
import { Popup } from '../components/Popup'
import { ChannelDetails } from '../components/Channel'
import { entries, orderBy } from '../common/Pipe'
import { addDays, endOfToday, parseISO, startOfToday } from 'date-fns'
import { DateRangeValue, InlineDateRange } from '../components/DateRange'
import SearchText from '../components/SearchText'
import { StatsPeriod } from '../components/Period'
import { Footer } from '../components/Footer'
import ReactTooltip from 'react-tooltip'
import { InlineValueFilter } from '../components/ValueFilter'
import { videoWithEx } from '../common/Video'

interface QueryState extends Record<string, string> {
  openChannelId?: string
  start?: string
  end?: string
  search?: string
}

const searchIncludes = (search: string, v: VideoRemoved) => {
  if (!search) return true
  const re = new RegExp(`${search}`, 'i')
  return v.videoTitle?.search(re) > 0 || v.channelTitle?.search(re) > 0
}

const RemovedVideosPage = () => {
  const [channels, setChannels] = useState<Record<string, Channel>>()
  const [idx, setIdx] = useState<BlobIndex<VideoRemoved, { lastSeen?: string }>>(null)
  const [channelIndexes, setChannelIndexes] = useState<ChannelViewIndexes>(null)
  const [q, setQuery] = useQuery<QueryState>(useLocation(), navigateNoHistory)
  const [videos, setVideos] = useState<VideoRemoved[]>(null)
  const [videoFilter, setVideoFilter] = useState<VideoFilter>({ tags: null, lr: null, errorType: null })
  const [loading, setLoading] = useState(false)
  const [defaultPeriod, setDefaultPeriod] = useState<StatsPeriod>(null)

  const dateRange = {
    startDate: q.start ? parseISO(q.start) : addDays(startOfToday(), -7),
    endDate: q.end ? parseISO(q.end) : endOfToday()
  }

  useEffect(() => {
    getChannels().then(channels => setChannels(indexBy(channels, c => c.channelId)))
    indexChannelViews().then(ci => {
      setChannelIndexes(ci)
      setDefaultPeriod(ci?.periods.find(p => p.periodType == 'd7'))
    })
    indexRemovedVideos().then(setIdx)
  }, [])

  useEffect(() => {
    if (!idx || !channels) return
    setLoading(true)
    idx.getRows(
      {
        from: { lastSeen: dateRange.startDate.toISOString() },
        to: { lastSeen: dateRange.endDate.toISOString() }
      }).then(vids => {
        setVideos(vids)
        ReactTooltip.rebuild()
        setLoading(false)
      })
  }, [idx, channels, q.start, q.end])

  const openChannel = q.openChannelId ? channels?.[q.openChannelId] : null
  const onOpenChannel = (c: Channel) => setQuery({ openChannelId: c.channelId, openGroup: null })

  const vidsFiltered = videos ? pipe(videos,
    map(v => videoWithEx(v, channels)),
    filter(v => videoFilterIncludes(videoFilter, v) && searchIncludes(q.search, v)),
    orderBy(v => v.videoViews, 'desc')
  ) : null

  return <Layout>
    <FlexRow style={{ justifyContent: 'space-between', margin: '1em 0 2em' }}>
      <FilterHeader>
        Removed videos on
        <InlineDateRange
          range={dateRange}
          onChange={r => setQuery({ start: r.startDate?.toISOString(), end: r.endDate?.toISOString() })}
        />
        filtered to
        <InlineValueFilter
          filter={videoFilter}
          onFilter={setVideoFilter}
          md={md}
          rows={vidsFiltered}
        />
      </FilterHeader>
      <SearchText search={q.search} onSearch={s => setQuery({ search: s })} style={{ width: '15em' }} placeholder={'channel/video title'} />
    </FlexRow>
    <Videos channels={channels} onOpenChannel={onOpenChannel} videos={vidsFiltered} showChannels loading={loading} defaultLimit={100} groupChannels />

    <Footer />

    <Popup isOpen={openChannel != null} onRequestClose={() => setQuery({ openChannelId: null })}>
      {channelIndexes && <ChannelDetails channel={openChannel} mode='max' indexes={channelIndexes} defaultPeriod={defaultPeriod} />}
    </Popup>
  </Layout>
}

export default RemovedVideosPage