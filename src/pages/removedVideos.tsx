import React, { useEffect, useState } from "react"
import { filter, indexBy, map, pipe, pick } from 'remeda'
import { blobIndex, BlobIndex } from '../common/BlobIndex'
import { Channel, getChannels, md } from '../common/Channel'
import { useQuery } from '../common/QueryString'
import { ChannelViewIndexes, indexChannelViews, indexPeriods, indexRemovedVideos, VideoChannelExtra, VideoRemoved } from '../common/RecfluenceApi'
import { FilterHeader, FilterPart } from '../components/FilterCommon'
import Layout from '../components/Layout'
import { FlexRow, MinimalPage, StyleProps } from "../components/Style"
import { VideoId, Videos } from '../components/Video'
import { useLocation } from '@reach/router'
import { navigateNoHistory } from '../common/Utils'
import { Popup } from '../components/Popup'
import { ChannelDetails, Tag } from '../components/Channel'
import { orderBy } from '../common/Pipe'
import { DateRangeQueryState, InlineDateRange, rangeFromQuery } from '../components/DateRange'
import SearchText from '../components/SearchText'
import { Period } from '../components/Period'
import { filterFromQuery, filterIncludes, FilterState, filterToQuery, InlineValueFilter } from '../components/ValueFilter'
import { videoWithEx } from '../common/Video'
import PurposeBanner from '../components/PurposeBanner'
import { ColumnMdVal } from '../common/Metadata'
import ReactMarkdown from 'react-markdown'
import { odyseeVideoUrl, OdyseeYtVideo, odyseeYtVideos } from '../common/Odysee'


interface QueryState extends DateRangeQueryState {
  openChannelId?: string
  start?: string
  end?: string
  search?: string
  tags?: string,
  lr?: string,
  errorType?: string,
  copyrightHolder?: string
}

interface CaptionData {
  videoId: string,
  caption: string,
  offsetSeconds: number
}

const searchIncludes = (search: string, v: VideoRemoved) => {
  if (!search) return true
  const re = new RegExp(`${search}`, 'i')
  return v.videoTitle?.search(re) >= 0 || v.channelTitle?.search(re) >= 0
}

type VideoExtra = { odyseePath?: string } & VideoId
type VideoRow = VideoRemoved & VideoChannelExtra & VideoExtra

const RemovedVideosPage = () => {
  const [channels, setChannels] = useState<Record<string, Channel>>()
  const [removedIdx, setRemovedIdx] = useState<BlobIndex<VideoRemoved, { lastSeen?: string }>>(null)
  const [captionIdx, setCaptionIdx] = useState<BlobIndex<CaptionData, { videoId?: string }>>(null)
  const [channelIndexes, setChannelIndexes] = useState<ChannelViewIndexes>(null)
  const [q, setQuery] = useQuery<QueryState>()
  const [videos, setVideos] = useState<VideoRemoved[]>(null)
  const [loading, setLoading] = useState(false)
  const [defaultPeriod, setDefaultPeriod] = useState<Period>(null)

  const videoFilter: FilterState<VideoRow> = filterFromQuery(q, ['errorType', 'copyrightHolder', 'tags', 'lr'])
  const setVideoFilter = (f: FilterState<VideoRow>) => setQuery(filterToQuery(f))

  const dateRange = rangeFromQuery(q)

  useEffect(() => {
    getChannels().then(channels => setChannels(indexBy(channels, c => c.channelId)))
    indexChannelViews().then(ci => {
      setChannelIndexes(ci)
      setDefaultPeriod(indexPeriods(ci.channelStatsByPeriod).find(p => p.type == 'd7'))
    })
    indexRemovedVideos().then(setRemovedIdx)
    blobIndex<CaptionData, { videoId: string }>('video_removed_caption', false).then(i => {
      setCaptionIdx(i)
    })
  }, [])

  useEffect(() => {
    if (!removedIdx || !channels) return
    setLoading(true)
    removedIdx.rows(
      {
        from: { lastSeen: dateRange.startDate.toISOString() },
        to: { lastSeen: dateRange.endDate.toISOString() }
      }).then(async vids => {
        setVideos(vids)
        setLoading(false)
      })
  }, [removedIdx, channels, q.start, q.end])

  const openChannel = q.openChannelId ? channels?.[q.openChannelId] : null
  const onOpenChannel = (c: Channel) => setQuery({ openChannelId: c.channelId })

  const vidsFiltered = videos ? pipe(videos,
    map(v => ({ ...videoWithEx(v, channels), copyrightHolder: v.copyrightHolder?.substring(0, 15) })), //TODO: use css. This is a shortcut for now
    filter(v => filterIncludes(videoFilter, v) && searchIncludes(q.search, v)),
    orderBy(v => v.videoViews, 'desc')
  ) : null

  return <Layout>
    <PurposeBanner>
      <p>YouTube  <a href='https://transparencyreport.google.com/youtube-policy/removals'>removes millions</a> of videos each month to enforce their community guidelines without providing information about what is removed or why. We fill the gap: here you'll find transparency on what videos are removed. While we don't know all of YouTube's moderation process, we hope this transparency will enable anyone and everyone to try to understand and/or scrutinize it with higher fidelity.</p>
      <p className="subtle">We show videos removed by both the creator or by YouTube. Here are the reason's that you can filter by:</p>
      <FlexRow style={{ margin: 'auto', flexWrap: 'wrap', lineHeight: '1.1em' }}>
        {md.video.errorType.values.map(v => <ErrorTag key={v.value} v={v} onErrorType={e => setVideoFilter({ ...videoFilter, errorType: [e] })} />)}
      </FlexRow>
    </PurposeBanner>
    <MinimalPage>
      <FilterHeader>
        <FilterPart>
          Removed videos last seen
          <InlineDateRange
            range={dateRange}
            onChange={r => setQuery({ start: r.startDate?.toISOString(), end: r.endDate?.toISOString() })}
          />
        </FilterPart>
        <FilterPart>
          filtered by removal type
          <InlineValueFilter
            filter={pick(videoFilter, ['errorType', 'copyrightHolder'])}
            onFilter={setVideoFilter}
            metadata={md.video}
            rows={vidsFiltered}
            showCount
          />
        </FilterPart>
        <FilterPart>
          channel tags
          <InlineValueFilter
            filter={pick(videoFilter, ['lr', 'tags'])}
            onFilter={setVideoFilter}
            metadata={md.channel}
            rows={vidsFiltered}
            showCount
          />
        </FilterPart>
        <FilterPart>
          <span>search</span><SearchText search={q.search} onSearch={s => setQuery({ search: s })} style={{ width: '15em' }} placeholder={'channel/video title'} />
        </FilterPart>
      </FilterHeader>

      <Videos<VideoRemoved, OdyseeYtVideo>
        channels={channels}
        onOpenChannel={onOpenChannel}
        loadCaptions={videoId => captionIdx?.rows({ videoId })}
        videos={vidsFiltered}
        showChannels
        groupChannels
        loading={loading}
        defaultLimit={30}
        highlightWords={q.search ? [q.search] : null}
        loadExtraOnVisible={async (vids) => {
          const res = await odyseeYtVideos(vids.map(v => v.videoId))
          return res
        }}
        contentBottom={(v) => v.odyseePath && <span>
          <span style={{ position: 'relative', top: '-7px', paddingRight: '0.5em' }}>available on:</span>
          <a href={odyseeVideoUrl(v.odyseePath)} target='_odysee' style={{ paddingTop: '0.2em' }}>
            <OdyseeLogo style={{ height: '25px' }} />
          </a>
        </span>}
      />
    </MinimalPage>
    <Popup isOpen={openChannel != null} onRequestClose={() => setQuery({ openChannelId: null })}>
      {channelIndexes && <ChannelDetails channel={openChannel} mode='max' indexes={channelIndexes} defaultPeriod={defaultPeriod} />}
    </Popup>
    <OdyseeLogoDef />
  </Layout>
}

const ErrorTag = ({ v, onErrorType }: { v: ColumnMdVal<string>, onErrorType: (error: string) => void }) =>
  <div key={v.value} style={{ width: '20em', fontSize: '0.8em' }}>
    <a onClick={() => onErrorType(v.value)}><Tag label={v.label ?? v.value} color={v.color} style={{ marginBottom: '0.3em' }} /></a>
    <ReactMarkdown>{v.desc}</ReactMarkdown>
  </div>

const OdyseeLogoDef = ({ style }: StyleProps) => <svg style={{ display: 'none', ...style }}>
  <symbol id="odysee_svg">
    <circle className="st0" cx="60.7" cy={60} r="51.7" />
    <path className="st1" d="M20.9,46.6c-0.3-0.4-0.9-0.6-1.3-0.3c-0.4,0.3-0.6,0.9-0.3,1.3c0.3,0.4,0.9,0.6,1.3,0.3
C21.1,47.6,21.2,47,20.9,46.6" />
    <path className="st1" d="M76.4,21.7c-0.3-0.4-0.9-0.6-1.3-0.3c-0.4,0.3-0.6,0.9-0.3,1.3c0.3,0.4,0.9,0.6,1.3,0.3
C76.6,22.7,76.7,22.2,76.4,21.7" />
    <path className="st1" d="M87.9,59c-0.1,0.6,0.2,1.2,0.8,1.3c0.6,0.1,1.2-0.2,1.3-0.8c0.1-0.6-0.2-1.2-0.8-1.3
C88.6,58.1,88.1,58.4,87.9,59" />
    <path className="st1" d="M71.3,96c-0.1,0.5,0.2,0.9,0.6,1c0.5,0.1,0.9-0.2,1-0.6c0.1-0.5-0.2-0.9-0.6-1C71.9,95.2,71.5,95.5,71.3,96" />
    <path className="st1" d="M28.2,29.5c-0.1,0.3,0.1,0.6,0.4,0.6c0.3,0.1,0.6-0.1,0.6-0.4c0.1-0.3-0.1-0.6-0.4-0.6
C28.5,29.1,28.2,29.2,28.2,29.5" />
    <path className="st1" d="M30.9,78.3c-0.1-0.4-0.4-0.7-0.8-0.6c-0.4,0.1-0.7,0.4-0.6,0.8c0.1,0.4,0.4,0.7,0.8,0.6
C30.7,79.1,30.9,78.7,30.9,78.3" />
    <path className="st2" d="M52.7,18.5c0,0-8.2,2.2-7.5,10.9c0.6,7.7,4.6,11.9,13.1,8.7c8.5-3.2,9.9-5.4,7.8-11.9S61.7,15.4,52.7,18.5z" />
    <path className="st1" d="M100.5,92c-0.3-0.6-6.4-10.1-7.2-17.9c-0.6-5.5-7.7-11.5-12-14.7c-1.6-1.2-1.7-3.4-0.3-4.8
c4.2-4,11.7-11.8,14.1-15.9c1.7-3.1,3.5-8.9,3.4-13.9c-2.9-3.1-6.2-5.9-9.8-8.2c-3.5,1.7-4.4,7.1-5.9,13.3c-2.1,8.5-7,7.5-9,7.5
c-1.9,0-0.8-3-5.4-16.3c-4.6-13.3-16.7-10-25.9-4.5c-11.7,7-6.5,21.9-3.6,31.5c-1.6,1.6-7.8,2.8-13.4,5.8
c-6.9,3.7-14.1,9.7-15.9,12.5c0.5,3.8,1.4,7.5,2.6,11c0.4,0.4,0.9,0.7,1.4,0.9c3.3,1.5,8.1-1.1,12.7-5.8c1.2-1.3,1.9-1.8,4.6-3.5
c5.4-3.7,11.8-5.5,11.8-5.5s4.5,6.9,8.7,15.1c4.2,8.2-4.5,10.9-5.4,10.9c-1,0-14.6-1.3-11.5,10.3c3,11.5,19.7,7.4,28.2,1.8
c8.5-5.6,6.4-23.9,6.4-23.9c8.3-1.3,10.9,7.5,11.7,12c0.8,4.5-1,12.3,7.4,12.5c1.2,0,2.4-0.2,3.5-0.5c3.2-2.4,6.2-5.1,8.8-8.2
C100.4,92.7,100.5,92.2,100.5,92z M58.4,38c-8.5,3.2-12.6-1-13.1-8.7c-0.6-8.7,7.5-10.9,7.5-10.9c9-3,11.4,1.3,13.5,7.7
S66.8,34.8,58.4,38z" />
    <polygon className="st1" points="100.3,46.7 98,47.8 97.4,50.4 96.3,48.1 93.7,47.5 96,46.4 96.6,43.8 97.7,46.1 " />
    <g>
      <g>
        <path className="st1" d="M218.5,37c-0.7-7.2-0.9-8.5-1.5-11.6c-0.2-1.1-0.4-2.5-0.8-4.4c-0.3-2-0.6-3.5-0.8-4.5
    c-0.2-1.1-0.5-2-0.7-2.9c-0.3-1.1-0.7-1.9-1.3-2.4c-0.5-0.4-1-0.8-1.6-1c-0.6-0.2-1.2-0.3-2-0.3c-0.8,0-3.2,0-4.2,1.7
    c-0.4,0.7-0.7,1.8-0.7,5.6c0,1.4,0,1.5,0.1,2.5l0.1,1.1c0.2,2.1,0.5,3.8,0.9,5.2c0,0.1,0.1,0.2,0.1,0.4c0,0.4,0.1,0.9,0.2,1.4
    c0.2,1.4,0.4,2,0.6,2.5c0.1,0.4,0.2,0.7,0.3,1.8c0.5,5.4,0.3,6.9,0.3,7.3c0,0-0.1,0.1-0.5,0.1c-1.4,0-15.1,4-18.6,6.4
    c-3.7,2.4-6.3,5.1-7.8,8c-1.6,3.2-2.1,21.6-2.1,21.8c-0.1,4.2,0.6,6.8,2.3,8.1c0.1,0.1,0.2,0.2,0.3,0.3c1.3,1.4,4.7,5.1,11.9,6.2
    c5.4,0.8,10.2,0.8,14.5,0.7c1.8,0,3.5,0,5.1,0l0.3,0l7.4-2.4l-0.2-14C219.9,68,219.4,47,218.5,37z M209.7,74.6
    c-0.1,0.9-0.2,1.6-0.3,2c-0.1,0.3-0.1,0.7-0.3,1c-0.1,0.2-0.1,0.3-0.1,0.3c-0.1,0-0.1,0.1-0.2,0.1c-0.3,0.1-0.5,0.1-0.8,0.2
    c-0.4,0-1,0-1.8,0c-2.5,0-5.9-0.5-9.9-1.4c-4.7-1.1-5.8-1.8-5.9-1.8c0,0,0,0,0,0c-0.8-1.9,1.2-16,6.7-20.1
    c5.5-4.2,8.3-4.5,9.7-4.1c0.4,0.1,1.5,0.5,2.3,3c0.2,1,0.4,7.6,0.5,11.2c0.1,2.5,0.1,4.5,0.2,5.1
    C209.9,71.8,209.9,73.3,209.7,74.6z" />
        <path className="st1" d="M253.7,34.9c-1,0.8-1.8,1.9-2.5,3.5l0,0.1c-0.9,2.4-1.7,4.3-2.6,5.9c-0.9,1.9-1.4,3.4-1.4,4.8
    c0,0.2-0.1,0.6-0.3,1.3c-0.2,0.4-0.3,0.8-0.6,1.2c-0.1-0.1-0.3-0.2-0.4-0.3c-0.7-0.5-1.5-1.2-2.5-2.1c-1-1-2.4-2.3-4-4
    c-7.1-7.2-11.3-9.8-14.1-8.6c-1.6,0.7-2.4,2.3-2.4,4.9c0,1.6,0.9,3.7,2.6,6.3c1.6,2.3,4.2,5.5,7.6,9.4c5.2,5.9,8.7,7.5,10.4,8.2
    c0,1.2-0.1,3.5-0.4,4.4c-0.4,1.5-1.1,3.2-1.9,5.1c-1,2-1.8,4.1-2.5,6.4c-0.7,2.3-1.1,4.1-1.1,5.5c0,2.1,0.3,3.4,1,4.2
    c0.6,0.7,1.5,1.1,2.6,1.1c0.4,0,0.8,0,1.2-0.1c1-0.1,2-0.5,3-1.1c1-0.6,1.8-1.4,2.1-2.1c0.2-0.3,0.6-1.1,1.2-2.4
    c0.6-1.2,1-2.1,1.2-2.6c0.6-1,1.2-2.7,1.9-5.4c0.7-2.6,1.3-5.3,1.9-8.1c0.6-2.8,1.4-6,2.5-9.7c1-3.7,2-6.7,2.8-9.1
    c1.2-3.1,2-5.5,2.6-7.5c0.6-2.1,0.9-3.8,0.9-5.2c0-1.7-0.5-3-1.4-3.8C259.5,33.3,255.8,33.3,253.7,34.9z" />
        <path className="st1" d="M299.2,35.5c-0.3-0.3-0.7-0.6-1.3-0.9c-0.5-0.2-1-0.3-1.4-0.4c-0.3,0-0.9-0.1-1.6-0.1c-0.7,0-1.4-0.1-2-0.1
    c-0.7,0-1.6,0-2.8,0c-6,0-10.2,0.8-12.8,2.6c-3.3,2-5.7,4.7-7.2,8.2c-1.4,3.3-2.1,7.7-2.1,13.2l-0.1,10.7l11,3.6
    c3.5,1.1,5.4,1.9,6.3,2.3c-0.5,0.2-1.3,0.5-2.6,0.7c-1.7,0.4-3.5,0.6-5.2,0.6c-2.2,0-3.8,0.1-4.9,0.2c-1.3,0.2-2.3,0.6-2.9,1.2
    c-0.7,0.7-1,1.7-1,2.9c0,1.2,0.4,2.9,2.3,4.3c1.3,1,2.9,1.7,4.9,2c1.5,0.3,3.1,0.4,4.7,0.4c0.4,0,0.8,0,1.2,0
    c2.1-0.1,4.3-0.5,6.5-1.1c2.2-0.7,4.2-1.6,5.8-2.8c1.8-1.4,3.1-2.7,3.8-3.9c0.7-1.3,1.1-2.9,1.1-5c0-3.2-1.1-5.7-3.1-7.4
    c-1.9-1.5-5.3-3-10.6-4.4c-5.5-1.7-6.5-2.5-6.7-2.7c-0.2-0.2-0.7-1.3,0.7-4.7c1.1-2.8,2.9-5.4,5.1-7.6c2.5-2.5,3.8-3.3,4.3-3.5
    c0.5-0.2,1.7-0.5,4.3-0.1c1,0.1,1.8,0.3,2.3,0.3c0.6,0.1,1.2,0.1,1.8,0c0.7-0.1,1.2-0.2,1.6-0.4c0.5-0.3,0.9-0.7,1.2-1.3
    c0.2-0.5,0.4-1,0.4-1.6c0-0.3,0-0.9,0-1.6v-1.1c0-0.4-0.1-0.9-0.3-1.4C299.7,36.2,299.5,35.8,299.2,35.5z" />
        <path className="st1" d="M344.3,42.2c-0.2-0.6-0.5-1.2-1-1.9c-0.4-0.7-0.9-1.3-1.6-2l-1.6-1.7c-2.2-2.2-4-3.5-5.5-4.2
    c-1.5-0.7-3.6-1-6.5-1c-4.3,0-8.1,1.1-11.3,3.2l0,0c-2.8,1.9-5,3.9-6.5,5.7c-1.6,1.9-2.7,4.2-3.4,6.7c-0.7,2.4-1.1,5.7-1.3,9.6
    c-0.6,10.4,1.2,18.1,5.3,22.9c3.8,4.4,9.7,6.7,17.7,6.7c0.8,0,1.6,0,2.5-0.1l3.4-0.2c0.8-0.1,1.6-0.2,2.4-0.3
    c0.9-0.2,1.6-0.4,2-0.6c0.5-0.2,0.9-0.6,1.3-1.1c0.4-0.5,0.7-1.1,0.7-1.8c0-0.4,0.1-0.9,0.1-1.6c0-1.4-0.2-3.3-1.6-4.2
    c-0.7-0.4-1.8-0.7-5.3-0.2c-2.9,0.4-5.9-0.2-9-1.7c-3.1-1.5-5.2-3.4-6.4-5.7l-0.8-1.6l5.8-0.6c3.1-0.3,5.8-0.8,8-1.6
    c2.3-0.8,4.5-1.9,6.6-3.3c1.4-1,2.4-1.8,3.1-2.3c0.8-0.7,1.5-1.5,2-2.6c0.5-1,0.9-2.1,1.1-3.1c0.1-0.9,0.3-2.2,0.4-4.1
    c0.1-1.2,0.1-2.2,0.1-3c0-0.8-0.1-1.6-0.2-2.4C344.6,43.4,344.4,42.7,344.3,42.2z M318.8,53.6l-1.7-1.7l4.2-4.1
    c1.4-1.4,2.8-2.6,4.2-3.6c1.5-1.1,2-1.2,2-1.3c0.1,0,0.5,0.2,1.5,0.9c1,0.8,2,1.7,2.9,2.8l2.5,3l-2.3,2c-0.8,0.7-2,1.4-3.5,2.1
    c-1.5,0.7-2.9,1.2-4,1.4c-2.2,0.4-3.3,0.3-3.7,0.1C320.6,55.1,319.9,54.7,318.8,53.6z" />
        <path className="st1" d="M389.9,47.4c-0.1-0.8-0.3-1.5-0.4-2c-0.2-0.6-0.5-1.2-1-1.9c-0.4-0.7-0.9-1.3-1.4-1.8l-1.8-1.9
    c-2.2-2.2-4-3.5-5.5-4.2c-1.5-0.7-3.6-1-6.5-1c-4.3,0-8.1,1.1-11.3,3.2l0,0c-2.8,1.9-5,3.9-6.5,5.7c-1.6,1.9-2.7,4.2-3.4,6.7
    c-0.7,2.4-1.1,5.7-1.3,9.6c-0.6,10.4,1.2,18.1,5.3,22.9c3.8,4.4,9.7,6.7,17.7,6.7c0.8,0,1.6,0,2.5-0.1l3.4-0.2
    c0.8-0.1,1.6-0.2,2.4-0.3c1-0.2,1.6-0.4,2-0.6c0.5-0.2,0.9-0.6,1.3-1.1c0.4-0.5,0.7-1.1,0.7-1.8c0-0.4,0.1-0.9,0.1-1.6
    c0-1.4-0.2-3.3-1.6-4.2c-0.7-0.4-1.8-0.7-5.3-0.2c-2.9,0.4-5.9-0.2-9-1.7c-3.1-1.5-5.2-3.4-6.4-5.7l-0.8-1.6l5.8-0.6
    c3.1-0.3,5.8-0.8,8-1.6c2.3-0.8,4.5-1.9,6.6-3.3c1.4-1,2.4-1.8,3.1-2.3c0.8-0.7,1.5-1.5,2-2.6c0.5-1,0.9-2.1,1.1-3.1
    c0.1-0.9,0.3-2.2,0.4-4.1c0.1-1.2,0.1-2.2,0.1-3C390,48.9,390,48.1,389.9,47.4z M364,56.7l-1.7-1.7l4.2-4.1
    c1.4-1.4,2.8-2.6,4.1-3.6c1.5-1.1,2-1.2,2-1.3c0.1,0,0.5,0.2,1.5,0.9c1,0.8,2,1.7,2.9,2.8l2.5,3l-2.3,2c-0.8,0.7-2,1.4-3.5,2.1
    c-1.5,0.7-2.9,1.2-4,1.4c-2.2,0.4-3.2,0.3-3.7,0.1C365.8,58.2,365.1,57.9,364,56.7z" />
        <path className="st1" d="M138.2,41.7c1-0.4,2.8-0.8,5.4-1c2.7-0.3,5.4-0.4,8.2-0.4c4.6,0,7.7,0.2,9.3,0.6c1.6,0.5,3.5,1.6,5.5,3.5
    c1.7,1.7,2.9,3.5,3.7,5.3c0.8,1.9,1.3,4.6,1.7,8.1c0.7,5.3,0.5,10.4-0.5,15.3c-1,4.9-2.4,7.9-4.3,9c-1.4,0.7-3.9,2.5-7.4,5.2
    c-1.9,1.5-3.6,2.4-5,2.7c-1.4,0.3-3.7,0.3-6.7-0.1c-2.9-0.5-5.2-1.2-7.1-2.3c-1.9-1-4.1-2.8-6.5-5.2c-1.3-1.2-2.2-2.1-2.7-2.7
    c-0.5-0.6-1.1-1.3-1.7-2.2c-0.6-0.9-1-1.6-1.2-2.1c-0.2-0.5-0.4-1.3-0.6-2.6c-0.2-1.3-0.3-2.4-0.3-3.4c0-1,0-2.6,0-4.9
    C128,51.9,131.4,44.3,138.2,41.7z M158.2,50.5c-3-2.9-4.9-4.3-5.7-4.3c-1.6,0-3.7,1-6.2,2.8c-2.5,1.8-4.5,3.9-6.1,6.2
    c-2.5,3.7-3.7,7-3.4,10.1c0.2,3,1.9,6.2,5.1,9.6l5.2,5.7l6.4-2.9c3.8-1.7,6.6-4.1,8.4-7.2c1.8-3.1,2.4-6.4,1.7-10
    C163.1,56.9,161.2,53.6,158.2,50.5z" />
      </g>
    </g>
    <g>
      <g>
        <path className="st3" d="M63.2,27.7c0.6,1.4,0.6,2.2,0.4,3.6" />
        <path className="st1" d="M63.6,32.4c-0.1,0-0.1,0-0.2,0c-0.6-0.1-1-0.7-0.9-1.3c0.2-1.2,0.2-1.8-0.3-3c-0.2-0.6,0-1.2,0.6-1.4
    c0.6-0.2,1.2,0,1.4,0.6c0.6,1.5,0.8,2.6,0.4,4.2C64.6,32,64.1,32.4,63.6,32.4z" />
      </g>
      <g>
        <path className="st3" d="M60.6,21.7c0,0,0.2,0.2,0.8,1.2" />
        <path className="st1" d="M61.4,24c-0.4,0-0.8-0.2-1-0.6c-0.4-0.8-0.6-1-0.6-1c-0.4-0.4-0.4-1.1,0-1.5c0.4-0.4,1.1-0.4,1.5,0
    c0.1,0.1,0.5,0.5,1,1.5c0.3,0.5,0.1,1.2-0.4,1.5C61.7,24,61.5,24,61.4,24z" />
      </g>
    </g>
  </symbol>
</svg>

// go from raw svg to component with this https://magic.reactjs.net/htmltojsx.htm
const OdyseeLogo = ({ style }: StyleProps) => <svg style={style} viewBox="0 0 400 120">
  <style type="text/css" dangerouslySetInnerHTML={{ __html: "\n\t.st0{fill:url(#SVGID_1_);}\n\t.st1{fill:var(--fg);}\n\t.st2{fill:none;}\n\t.st3{fill:style(--fg1);}\n" }} />
  <linearGradient id="SVGID_1_" gradientUnits="userSpaceOnUse" x1="37.8999" y1="5.5384" x2="110.8449" y2="180.1506">
    <stop offset={0} style={{ stopColor: '#EF1970' }} />
    <stop offset="0.1438" style={{ stopColor: '#F23B5C' }} />
    <stop offset="0.445" style={{ stopColor: '#F77D35' }} />
    <stop offset="0.6983" style={{ stopColor: '#FCAD18' }} />
    <stop offset="0.8909" style={{ stopColor: '#FECB07' }} />
    <stop offset={1} style={{ stopColor: '#FFD600' }} />
  </linearGradient>
  <use href="#odysee_svg"></use>
</svg>

export default RemovedVideosPage