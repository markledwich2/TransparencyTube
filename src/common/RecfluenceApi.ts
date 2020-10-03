import { indexBy } from 'remeda'
import { EsVideo, getVideos } from './EsApi'
import { getJsonl } from './Utils'
import { BlobIndex, blobIndex, noCacheReq } from './BlobIndex'
import { Channel } from './Channel'

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


export const parsePeriod = (s: string) => {
  if (!s) return null
  const p = s.split('|')
  return { periodType: p[0], periodValue: p[1] }
}
export const periodString = (p: StatsPeriod) => `${p.periodType}|${p.periodValue}`
export type StatsPeriod = { periodType: string, periodValue: string }

export type ChannelVideoIndexKeys = { channelId: string } & StatsPeriod
export type VideoViewsIndex<TKey> = BlobIndex<VideoViews, TKey>
export type VideoWithStats = EsVideo & { periodViews: number, watchHours: number }

export interface ChannelStats extends StatsPeriod {
  channelId: string,
  views?: number,
  watchHours?: number
}

export type ChannelWithStats = ChannelStats & Channel

export interface ViewsIndexes {
  periods: StatsPeriod[]
  video: VideoViewsIndex<StatsPeriod>
  channelVideo: VideoViewsIndex<ChannelVideoIndexKeys>
  channelStats: BlobIndex<ChannelStats, StatsPeriod>
}

export const getViewsIndexes: () => Promise<ViewsIndexes> = async () => {
  const [video, channelVideo, channelStats] = await Promise.all([
    blobIndex<VideoViews, StatsPeriod>('top_videos'),
    blobIndex<VideoViews, ChannelVideoIndexKeys>('top_channel_videos'),
    blobIndex<VideoViews, StatsPeriod>('channel_stats')])
  const [videoPeriods] = await Promise.all([video, channelVideo]
    .map(i => getJsonl<StatsPeriod>(i.baseUri.addPath('periods.jsonl.gz').url, noCacheReq)))
  const indexes: ViewsIndexes = {
    periods: videoPeriods,
    video,
    channelVideo,
    channelStats
  }
  return indexes
}

export const getChannelStats = async (index: BlobIndex<ChannelStats, StatsPeriod>, filter: StatsPeriod, channelId: string) =>
  (await index.getRows(filter)).find(c => c.channelId == channelId)

export const getVideoViews = async (index: VideoViewsIndex<StatsPeriod>, filter: StatsPeriod, props?: (keyof EsVideo)[], limit?: number): Promise<VideoWithStats[]> => {
  try {
    const vidViews = (await index.getRows(filter)).slice(0, limit ?? 20)
    const esVids = indexBy(await getVideos(vidViews.map(v => v.videoId), props), v => v.videoId)
    const vids = vidViews.map(v => ({
      videoId: v.videoId,
      channelId: v.channelId,
      ...esVids[v.videoId],
      periodViews: v.views,
      watchHours: v.watchHours
    }))
    return vids
  }
  catch (e) {
    console.log('error getting videos', e)
  }
}


