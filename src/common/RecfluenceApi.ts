import { getJsonl } from './Utils'
import { BlobIndex, blobIndex, noCacheReq } from './BlobIndex'
import { Channel } from './Channel'
import { StatsPeriod } from '../components/Period'
import { VideoFilter, videoFilterIncludes } from '../components/VideoFilter'

export interface videoViewsQuery {
  channelId?: string
  from?: Date
  to?: Date
  top?: number
}

export interface VideoCommon {
  channelId: string
  channelTitle: string
  videoId: string
  videoTitle: string
  videoViews: number
  durationSecs: number
  uploadDate: string
}

export const isVideoViews = (c: VideoCommon): c is VideoViews => (c as VideoViews).periodViews != undefined
export interface VideoViews extends StatsPeriod, VideoCommon {
  periodViews: number
  watchHours: number
  rank: number
}

export const isVideoRemoved = (c: VideoCommon): c is VideoRemoved => (c as VideoRemoved).errorType != undefined
export interface VideoRemoved extends VideoCommon {
  errorType: string
  copyrightHolder?: string
  lastSeen: string
  errorUpdated: string
}

export type ChannelKey = { channelId: string }
export type ChannelAndPeriodKey = ChannelKey & StatsPeriod
export type VideoViewsIndex<TKey> = BlobIndex<VideoViews, TKey>

export interface ChannelStats extends StatsPeriod {
  channelId: string,
  views?: number,
  watchHours?: number
  latestRefresh?: string
  videos?: number
}
export type ChannelWithStats = ChannelStats & Channel
export const isChannelWithStats = (c: any): c is ChannelWithStats => c.views


export interface ChannelViewIndexes {
  periods: StatsPeriod[]
  channelVideo: VideoViewsIndex<ChannelAndPeriodKey>
  channelStatsByPeriod: BlobIndex<ChannelStats, StatsPeriod>
  channelStatsById: BlobIndex<ChannelStats, ChannelKey>
}

export const indexChannelViews: () => Promise<ChannelViewIndexes> = async () => {
  const [channelVideo, channelStatsById, channelStatsByPeriod] = await Promise.all([
    blobIndex<VideoViews, ChannelAndPeriodKey>('top_channel_videos'),
    blobIndex<VideoViews, ChannelKey>('channel_stats_by_id'),
    blobIndex<VideoViews, StatsPeriod>('channel_stats_by_period')
  ])
  const indexes: ChannelViewIndexes = {
    periods: await getJsonl<StatsPeriod>(channelVideo.baseUri.addPath('periods.jsonl.gz').url, noCacheReq),
    channelVideo,
    channelStatsByPeriod,
    channelStatsById
  }
  return indexes
}

export const indexTopVideos = async () => {
  const topVideos = await blobIndex<VideoViews, StatsPeriod>('top_videos')
  const periods = await getJsonl<StatsPeriod>(topVideos.baseUri.addPath('periods.jsonl.gz').url, noCacheReq)
  return { topVideos, periods }
}

export const indexRemovedVideos = () => blobIndex<VideoRemoved, { lastSeen: string }>('video_removed')


