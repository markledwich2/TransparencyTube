import React, { useEffect, useState } from "react"
import { indexBy } from 'remeda'
import { BlobIndex } from '../common/BlobIndex'
import { Channel, getChannels, md } from '../common/Channel'
import { useQuery } from '../common/QueryString'
import { ChannelViewIndexes, indexChannelViews, indexTopVideos, VideoRemoved, VideoViews } from '../common/RecfluenceApi'
import { FilterHeader } from '../components/FilterCommon'
import Layout, { MinimalPage } from "../components/Layout"
import { parsePeriod, PeriodSelect, periodString, StatsPeriod } from '../components/Period'
import { Spinner } from '../components/Spinner'
import { Videos } from '../components/Video'
import { VideoFilter, videoFilterIncludes } from '../components/VideoFilter'
import { useLocation } from '@reach/router'
import { delay, navigateNoHistory } from '../common/Utils'
import { Popup } from '../components/Popup'
import { ChannelDetails } from '../components/Channel'
import { Footer } from '../components/Footer'
import { filterFromQuery, filterToQuery, InlineValueFilter } from '../components/ValueFilter'
import { videoWithEx } from '../common/Video'
import PurposeBanner from '../components/PurposeBanner'
import ReactTooltip from 'react-tooltip'

interface QueryState extends Record<string, string> {
  period?: string
  openChannelId?: string
  tags?: string,
  lr?: string,
}

const TopVideosPage = () => {
  const [channels, setChannels] = useState<Record<string, Channel>>()
  const [idx, setIdx] = useState<{
    topVideos: BlobIndex<VideoViews, StatsPeriod>
    periods: StatsPeriod[]
  }>(null)
  const [channelIndexes, setChannelIndexes] = useState<ChannelViewIndexes>(null)
  const [q, setQuery] = useQuery<QueryState>(useLocation(), navigateNoHistory)
  const [videos, setVideos] = useState<VideoViews[]>(null)
  const [loading, setLoading] = useState(false)
  const period = q.period ? parsePeriod(q.period) : idx?.periods.find(p => p.periodType == 'd7')

  const videoFilter: VideoFilter = filterFromQuery(q, ['tags', 'lr'])
  const setVideoFilter = (f: VideoFilter) => setQuery(filterToQuery(f))

  useEffect(() => {
    getChannels().then(channels => setChannels(indexBy(channels, c => c.channelId)))
    indexTopVideos().then(setIdx)
    indexChannelViews().then(setChannelIndexes)
  }, [])

  useEffect(() => {
    delay(200).then(() => ReactTooltip.rebuild())
  }, [JSON.stringify(q)])

  useEffect(() => {
    if (!idx || !channels) return
    setLoading(true)
    idx.topVideos.getRows(period).then(vids => {
      const vidsEx = vids.map(v => videoWithEx(v, channels))
        .filter(v => videoFilterIncludes(videoFilter, v))
      setVideos(vidsEx)
      setLoading(false)
    })
  }, [idx, channels, period ? periodString(period) : null, q.lr, JSON.stringify(q.tags)])

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
    <PeriodSelect periods={idx?.periods} period={period} onPeriod={(p) => {
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