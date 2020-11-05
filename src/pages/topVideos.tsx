import React, { useEffect, useState } from "react"
import { indexBy } from 'remeda'
import { BlobIndex } from '../common/BlobIndex'
import { Channel, getChannels } from '../common/Channel'
import { useQuery } from '../common/QueryString'
import { ChannelViewIndexes, getVideoViews, indexChannelViews, indexTopVideos, VideoRemoved, VideoViews } from '../common/RecfluenceApi'
import { FilterHeader } from '../components/FilterCommon'
import Layout from "../components/Layout"
import { parsePeriod, PeriodSelect, periodString, StatsPeriod } from '../components/Period'
import { Spinner } from '../components/Spinner'
import { Videos } from '../components/Video'
import { InlineVideoFilter, VideoFilter } from '../components/VideoFilter'
import { useLocation } from '@reach/router'
import { navigateNoHistory } from '../common/Utils'
import { Popup } from '../components/Popup'
import { ChannelDetails } from '../components/Channel'
import { Footer } from '../components/Footer'

interface QueryState extends Record<string, string> {
  period?: string
  openChannelId?: string
}

const TopVideosPage = () => {
  const [channels, setChannels] = useState<Record<string, Channel>>()
  const [idx, setIdx] = useState<{
    topVideos: BlobIndex<VideoViews, StatsPeriod>
    periods: StatsPeriod[]
  }>(null)
  const [channelIndexes, setChannelIndexes] = useState<ChannelViewIndexes>(null)
  const [q, setQuery] = useQuery<QueryState>(useLocation(), navigateNoHistory)
  const [videoFilter, setVideoFilter] = useState<VideoFilter>({ tags: null, lr: null })
  const [videos, setVideos] = useState<VideoViews[]>(null)
  const [loading, setLoading] = useState(false)
  const period = q.period ? parsePeriod(q.period) : idx?.periods.find(p => p.periodType == 'd7')

  useEffect(() => {
    getChannels().then(channels => setChannels(indexBy(channels, c => c.channelId)))
    indexTopVideos().then(setIdx)
    indexChannelViews().then(setChannelIndexes)
  }, [])

  useEffect(() => {
    if (!idx || !channels) return
    setLoading(true)
    getVideoViews(idx.topVideos, period, videoFilter, channels).then(vids => {
      setVideos(vids)
      setLoading(false)
    })
  }, [idx, channels, period ? periodString(period) : null, videoFilter])

  const openChannel = q.openChannelId ? channels?.[q.openChannelId] : null
  const onOpenChannel = (c: Channel) => setQuery({ openChannelId: c.channelId, openGroup: null })
  const onCloseChannel = () => setQuery({ openChannelId: null })

  return <Layout>
    <FilterHeader style={{ marginBottom: '2em' }}>Top viewed videos in
    <PeriodSelect periods={idx?.periods} period={period} onPeriod={(p) => {
        setQuery({ period: periodString(p) })
      }} />

  filtered to <InlineVideoFilter filter={videoFilter} onFilter={setVideoFilter} showFilters={['tags', 'lr']} />
    </FilterHeader>
    <Videos channels={channels} onOpenChannel={onOpenChannel} videos={videos} showChannels loading={loading} />
    <Popup isOpen={openChannel != null} onRequestClose={onCloseChannel}>
      {channelIndexes && <ChannelDetails channel={openChannel} mode='max' indexes={channelIndexes} defaultPeriod={period} />}
    </Popup>
    <Footer />
  </Layout>
}

export default TopVideosPage