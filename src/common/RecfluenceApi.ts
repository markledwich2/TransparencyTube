import { getJsonl } from './Utils'
import { BlobIndex, blobIndex, noCacheReq } from './BlobIndex'
import { Channel } from './Channel'
import { HasPeriod, parsePeriod, Period } from '../components/Period'

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

export interface VideoChannelExtra {
  lr: string
  tags: string[]
  media?: string
}

export const isVideoViews = (c: VideoCommon): c is VideoViews => (c as VideoViews).periodViews != undefined
export interface VideoViews extends HasPeriod, VideoCommon {
  periodViews: number
  watchHours: number
  rank: number
}

export const isVideoError = (c: VideoCommon): c is VideoRemoved => (c as VideoRemoved).errorType != undefined
export interface VideoRemoved extends VideoCommon {
  errorType: string
  copyrightHolder?: string
  lastSeen: string
  errorUpdated: string
}

export const isVideoNarrative = (c: VideoCommon): c is VideoNarrative => (c as VideoNarrative).narrative != undefined
export interface VideoNarrative extends VideoCommon, VideoChannelExtra {
  narrative: string
  captions: { offset: number, caption: string }[]
  support: string
  supplement: string
  bubbleKey: string
  errorType: string
}

export type ChannelKey = { channelId: string }
export type ChannelAndPeriodKey = ChannelKey & HasPeriod

export interface ChannelStats extends HasPeriod {
  channelId: string,
  views?: number,
  watchHours?: number
  latestRefresh?: string
  videos?: number
}
export type ChannelWithStats = ChannelStats & Channel
export const isChannelWithStats = (c: any): c is ChannelWithStats => c.views


export interface ChannelViewIndexes {
  channelVideo: BlobIndex<VideoViews, ChannelAndPeriodKey>
  channelStatsByPeriod: BlobIndex<ChannelStats, HasPeriod>
  channelStatsById: BlobIndex<ChannelStats, ChannelKey>
}

export const indexChannelViews: () => Promise<ChannelViewIndexes> = async () => {
  const [channelVideo, channelStatsByPeriod, channelStatsById] = await Promise.all([
    blobIndex<VideoViews, ChannelAndPeriodKey>('top_channel_videos'),
    blobIndex<ChannelStats, HasPeriod>('channel_stats_by_period'),
    blobIndex<ChannelStats, ChannelKey>('channel_stats_by_id'),
  ])
  const indexes: ChannelViewIndexes = {
    channelVideo,
    channelStatsByPeriod,
    channelStatsById
  }
  return indexes
}

export const indexPeriods = (index: BlobIndex<any, HasPeriod>) => index.cols?.find(c => c.name == 'period')?.distinct.map(d => parsePeriod(d))

export const indexRemovedVideos = () => blobIndex<VideoRemoved, { lastSeen: string }>('video_removed')



