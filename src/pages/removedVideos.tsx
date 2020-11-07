import React, { useEffect, useState } from "react"
import { filter, indexBy, map, pipe } from 'remeda'
import { BlobIndex } from '../common/BlobIndex'
import { Channel, getChannels, md } from '../common/Channel'
import { useQuery } from '../common/QueryString'
import { ChannelViewIndexes, indexChannelViews, indexRemovedVideos, VideoRemoved } from '../common/RecfluenceApi'
import { FilterHeader } from '../components/FilterCommon'
import Layout, { FlexRow, MinimalPage } from "../components/Layout"
import { Videos } from '../components/Video'
import { VideoFilter, videoFilterIncludes } from '../components/VideoFilter'
import { useLocation } from '@reach/router'
import { delay, navigateNoHistory } from '../common/Utils'
import { Popup } from '../components/Popup'
import { ChannelDetails, Tag } from '../components/Channel'
import { orderBy } from '../common/Pipe'
import { addDays, endOfToday, parseISO, startOfToday } from 'date-fns'
import { InlineDateRange } from '../components/DateRange'
import SearchText from '../components/SearchText'
import { StatsPeriod } from '../components/Period'
import ReactTooltip from 'react-tooltip'
import { filterFromQuery, filterToQuery, InlineValueFilter } from '../components/ValueFilter'
import { videoWithEx } from '../common/Video'
import PurposeBanner from '../components/PurposeBanner'
import { colMd, ColumnValueMd } from '../common/Metadata'
import ReactMarkdown from 'react-markdown'


interface QueryState {
  openChannelId?: string
  start?: string
  end?: string
  search?: string
  tags?: string,
  lr?: string,
  errorType?: string,
  copyrightHolder?: string
}

const searchIncludes = (search: string, v: VideoRemoved) => {
  if (!search) return true
  const re = new RegExp(`${search}`, 'i')
  return v.videoTitle?.search(re) >= 0 || v.channelTitle?.search(re) >= 0
}

const RemovedVideosPage = () => {
  const [channels, setChannels] = useState<Record<string, Channel>>()
  const [idx, setIdx] = useState<BlobIndex<VideoRemoved, { lastSeen?: string }>>(null)
  const [channelIndexes, setChannelIndexes] = useState<ChannelViewIndexes>(null)
  const [q, setQuery] = useQuery<QueryState>(useLocation(), navigateNoHistory)
  const [videos, setVideos] = useState<VideoRemoved[]>(null)
  const [loading, setLoading] = useState(false)
  const [defaultPeriod, setDefaultPeriod] = useState<StatsPeriod>(null)

  const videoFilter: VideoFilter = filterFromQuery(q, ['errorType', 'copyrightHolder', 'tags', 'lr'])
  const setVideoFilter = (f: VideoFilter) => setQuery(filterToQuery(f))

  const dateRange = {
    startDate: q.start ? parseISO(q.start) : addDays(startOfToday(), -30),
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
        setLoading(false)
      })
  }, [idx, channels, q.start, q.end])


  useEffect(() => {
    delay(200).then(() => ReactTooltip.rebuild())
  }, [JSON.stringify(q)])

  const openChannel = q.openChannelId ? channels?.[q.openChannelId] : null
  const onOpenChannel = (c: Channel) => setQuery({ openChannelId: c.channelId })

  const vidsFiltered = videos ? pipe(videos,
    map(v => videoWithEx(v, channels)),
    filter(v => videoFilterIncludes(videoFilter, v) && searchIncludes(q.search, v)),
    orderBy(v => v.videoViews, 'desc')
  ) : null

  return <Layout>
    <PurposeBanner>
      <p>YouTube  <a href='https://transparencyreport.google.com/youtube-policy/removals'>removes millions</a> of videos each month to enforce their community guidelines without providing information about what is removed or why. We fill the gap: here you'll find transparency on what videos are removed. While we don't know all of YouTube's moderation process, we hope this transparency will enable anyone and everyone to try to understand and/or scrutinize it with higher fidelity.</p>
      <p className="subtle">We show videos removed by both the creator or by YouTube. Here are the reason's that you can filter by:</p>
      <FlexRow wrap style={{ margin: 'auto' }}>
        {colMd(md, 'video', 'errorType').values.map(v => <ErrorTag v={v} onErrorType={e => setVideoFilter({ ...videoFilter, errorType: [e] })} />)}</FlexRow>
    </PurposeBanner>
    <MinimalPage>
      <FlexRow wrap style={{ justifyContent: 'space-between', margin: '1em 0 2em' }}>
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
      <Videos channels={channels} onOpenChannel={onOpenChannel} videos={vidsFiltered}
        showChannels loading={loading} defaultLimit={100} groupChannels highlightWords={q.search ? [q.search] : null} />
    </MinimalPage>
    <Popup isOpen={openChannel != null} onRequestClose={() => setQuery({ openChannelId: null })}>
      {channelIndexes && <ChannelDetails channel={openChannel} mode='max' indexes={channelIndexes} defaultPeriod={defaultPeriod} />}
    </Popup>
  </Layout>
}

const ErrorTag = ({ v, onErrorType }: { v: ColumnValueMd<string>, onErrorType: (error: string) => void }) =>
  <div key={v.value} style={{ width: '20em', fontSize: '0.8em' }}>
    <a onClick={() => onErrorType(v.value)}><Tag label={v.label ?? v.value} color={v.color} /></a>
    <ReactMarkdown>{v.desc}</ReactMarkdown>
  </div>

export default RemovedVideosPage