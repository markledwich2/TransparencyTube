import React, { useEffect, useState } from "react"
import { indexBy } from 'remeda'
import { blobIndex, BlobIndex } from '../common/BlobIndex'
import { Channel, getChannels, md } from '../common/Channel'
import { useQuery } from '../common/QueryString'
import { ChannelViewIndexes, indexChannelViews, indexPeriods, VideoChannelExtra, VideoViews } from '../common/RecfluenceApi'
import { FilterHeader } from '../components/FilterCommon'
import Layout, { MinimalPage } from "../components/Layout"
import { parsePeriod, PeriodSelect, periodString, HasPeriod } from '../components/Period'
import { Videos } from '../components/Video'
import { useLocation } from '@reach/router'
import { delay, navigateNoHistory } from '../common/Utils'
import { Popup } from '../components/Popup'
import { ChannelDetails } from '../components/Channel'
import { filterFromQuery, filterIncludes, FilterState, filterToQuery, InlineValueFilter } from '../components/ValueFilter'
import { videoWithEx } from '../common/Video'
import PurposeBanner from '../components/PurposeBanner'
import ReactTooltip from 'react-tooltip'
import { orderBy } from '../common/Pipe'

interface QueryState extends Record<string, string> {
  period?: string
  openChannelId?: string
  tags?: string,
  lr?: string,
}

type VideoRow = VideoViews & VideoChannelExtra

const TopVideosPage = () => {
  const [channels, setChannels] = useState<Record<string, Channel>>()
  const [videoIdx, setVideoIdx] = useState<BlobIndex<VideoViews, HasPeriod>>(null)
  const [channelIndexes, setChannelIndexes] = useState<ChannelViewIndexes>(null)
  const [q, setQuery] = useQuery<QueryState>(useLocation(), navigateNoHistory)
  const [videos, setVideos] = useState<VideoViews[]>(null)
  const [loading, setLoading] = useState(false)
  const periods = videoIdx ? indexPeriods(videoIdx) : []
  const period = q.period ?
    parsePeriod(q.period) :
    channelIndexes ? periods.find(p => p.type == 'd7') : null
  const videoFilter = filterFromQuery(q, ['tags', 'lr']) as FilterState<VideoRow>
  const setVideoFilter = (f: FilterState<VideoRow>) => setQuery(filterToQuery(f))

  useEffect(() => {
    getChannels().then(channels => setChannels(indexBy(channels, c => c.channelId)))
    blobIndex<VideoViews, HasPeriod>('top_videos').then(setVideoIdx)
    indexChannelViews().then(setChannelIndexes)
  }, [])

  useEffect(() => {
    delay(200).then(() => ReactTooltip.rebuild())
  }, [JSON.stringify(q)])

  useEffect(() => {
    if (!videoIdx || !channels) return
    setLoading(true)
    videoIdx.getRows({ period: periodString(period) }).then(vids => {
      const vidsEx = orderBy(
        vids.map(v => videoWithEx(v, channels)).filter(v => filterIncludes(videoFilter, v)),
        v => v.rank, 'asc')
      setVideos(vidsEx)
      setLoading(false)
    })
  }, [videoIdx, channels, period ? periodString(period) : null, q.lr, JSON.stringify(q.tags)])

  const openChannel = q.openChannelId ? channels?.[q.openChannelId] : null
  const onOpenChannel = (c: Channel) => setQuery({ openChannelId: c.channelId, openGroup: null })
  const onCloseChannel = () => setQuery({ openChannelId: null })

  return <Layout>
    <PurposeBanner>
      <p>Here you can find the most viewed videos for a given period of time, or withing a particular category, by selecting each from the drop down menus below.</p>
      <p className="subtle">Note: Results are limited to the top 20k videos</p>
    </PurposeBanner>
    <MinimalPage>
      <FilterHeader style={{ marginBottom: '2em' }}>Top viewed videos in
    <PeriodSelect periods={periods} period={period} onPeriod={(p) => {
          setQuery({ period: periodString(p) })
        }} />
  filtered to <InlineValueFilter md={md} filter={videoFilter} onFilter={setVideoFilter} rows={videos} />
      </FilterHeader>
      <Videos channels={channels} onOpenChannel={onOpenChannel} videos={videos} showChannels showThumb loading={loading} />
      <Popup isOpen={openChannel != null} onRequestClose={onCloseChannel}>
        {channelIndexes && <ChannelDetails channel={openChannel} mode='max' indexes={channelIndexes} defaultPeriod={period} />}
      </Popup>
    </MinimalPage>
  </Layout>
}

export default TopVideosPage