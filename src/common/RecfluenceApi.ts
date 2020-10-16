import { first, indexBy } from 'remeda'
import { EsVideo, getVideos } from './EsApi'
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

export interface VideoViews extends StatsPeriod {
  channelId: string
  videoId: string,
  views: number,
  watchHours: number
}

export type ChannelKey = { channelId: string }
export type ChannelAndPeriodKey = ChannelKey & StatsPeriod
export type VideoViewsIndex<TKey> = BlobIndex<VideoViews, TKey>
export type VideoWithStats = EsVideo & { periodViews: number, watchHours: number, rank: number }

export interface ChannelStats extends StatsPeriod {
  channelId: string,
  views?: number,
  watchHours?: number
  latestRefresh?: string
  videos?: number
}

export type ChannelWithStats = ChannelStats & Channel

export const isChannelWithStats = (c: any): c is ChannelWithStats => c.views

export interface ViewsIndexes {
  periods: StatsPeriod[]
  video: VideoViewsIndex<StatsPeriod>
  channelVideo: VideoViewsIndex<ChannelAndPeriodKey>
  channelStatsByPeriod: BlobIndex<ChannelStats, StatsPeriod>
  channelStatsById: BlobIndex<ChannelStats, ChannelKey>
}

export const getViewsIndexes: () => Promise<ViewsIndexes> = async () => {
  const [video, channelVideo, channelStatsById, channelStatsByPeriod] = await Promise.all([
    blobIndex<VideoViews, StatsPeriod>('top_videos'),
    blobIndex<VideoViews, ChannelAndPeriodKey>('top_channel_videos'),
    blobIndex<VideoViews, ChannelKey>('channel_stats_by_id'),
    blobIndex<VideoViews, StatsPeriod>('channel_stats_by_period')
  ])
  const [videoPeriods] = await Promise.all([video, channelVideo]
    .map(i => getJsonl<StatsPeriod>(i.baseUri.addPath('periods.jsonl.gz').url, noCacheReq)))
  const indexes: ViewsIndexes = {
    periods: videoPeriods,
    video,
    channelVideo,
    channelStatsByPeriod,
    channelStatsById
  }
  return indexes
}

export const getVideoViews = async (index: VideoViewsIndex<StatsPeriod>, periodFilter: StatsPeriod, videoFilter: VideoFilter, channels: Record<string, Channel>,
  props?: (keyof EsVideo)[], limit?: number): Promise<VideoWithStats[]> => {
  try {
    const vidViews = (await index.getRows(periodFilter))
      .map((v, i) => ({ ...v, rank: i + 1 }))
      .filter(v => videoFilterIncludes(videoFilter, v, channels))
      .slice(0, limit ?? 20)
    const esVids = indexBy(await getVideos(vidViews.map(v => v.videoId), props), v => v.videoId)
    const vids = vidViews.map(v => ({
      videoId: v.videoId,
      channelId: v.channelId,
      ...esVids[v.videoId],
      periodViews: v.views,
      watchHours: v.watchHours,
      rank: v.rank
    }))
    return vids
  }
  catch (e) {
    console.log('error getting videos', e)
  }
}


