import { getJsonl } from './Utils'
import { BlobIndex, blobIndex, noCacheReq } from './BlobIndex'
import { Channel, PlatformName } from './Channel'
import { HasPeriod, parsePeriod, Period } from '../components/Period'
import { blobCfg } from './Cfg'

export interface videoViewsQuery {
  channelId?: string
  from?: Date
  to?: Date
  top?: number
}

export interface VideoCommon {
  channelId: string
  channelTitle: string
  channelLogo?: string
  videoId: string
  videoTitle: string
  videoViews?: number
  durationSecs?: number
  uploadDate?: string
  captions?: VideoCaption[]
  rank?: number
  thumb?: string
}

export interface VideoCaption {
  caption: string
  offsetSeconds: number
  heuristic?: boolean
  part?: string
  tags?: string[]
}

export interface VideoChannelExtra {
  lr: string
  tags: string[]
  media?: string
  platform?: PlatformName
}

export const isVideoViews = (c: VideoCommon): c is VideoViews => (c as VideoViews)?.periodViews != undefined
export interface VideoViews extends HasPeriod, VideoCommon {
  periodViews: number
  watchHours: number
}

export const isVideoError = (c: VideoCommon): c is VideoRemoved => (c as VideoRemoved).errorType != undefined && (c as VideoRemoved).lastSeen != undefined
export interface VideoRemoved extends VideoCommon {
  errorType: string
  copyrightHolder?: string
  lastSeen: string
  errorUpdated: string
  hasCaptions?: boolean
}


export type NarrativeName = 'Vaccine Personal' | 'Vaccine DNA' | '2020 Election Fraud' | 'QAnon'
  | 'comcast' | 'Jews Control Media' | '5g' | 'netneutrality' | 'Comcast Exec' | 'Brian Roberts'
  | `maccas` | 'maccas-ceo' | 'maccas-veg' | 'maccas-union' | 'maccas-unhealthy' | string

export type NarrativeChannel = Channel & ChannelStats & NarrativeKey & { bubbleKey: string, support: string, viewsAdjusted: number }
export type NarrativeKey = { narrative?: string, uploadDate?: string }
export type NarrativeIdx = {
  videos: BlobIndex<NarrativeVideo, NarrativeKey>,
  channels: BlobIndex<NarrativeChannel, NarrativeKey>,
  captions: BlobIndex<NarrativeCaption, Narrative2CaptionKey>,
}

export const isVideoNarrative = (c: VideoCommon): c is NarrativeVideo => (c as NarrativeVideo).narrative != undefined
export interface NarrativeVideo extends VideoCommon, Partial<VideoChannelExtra> {
  narrative: string
  support: string
  supplement: string
  bubbleKey: string
  errorType: string
  mentions?: [{ keywords: string[], mentions: number }]
  keywords?: string[]
  tags?: string[]
  channelTags?: string[]
  /**
   * views adjusted for precision/recall ratios
   */
  videoViewsAdjusted: number
}

export interface NarrativeCaptionKey {
  narrative: string,
  channelId: string,
  videoId: string
}

export interface Narrative2CaptionKey {
  narrative: string,
  uploadDate: string
}

export interface NarrativeCaption extends Narrative2CaptionKey {
  videoId: string,
  channelId: string
  captions?: VideoCaption[]
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
    blobIndex<VideoViews, ChannelAndPeriodKey>('top_channel_videos', false),
    blobIndex<ChannelStats, HasPeriod>('channel_stats_by_period'),
    blobIndex<ChannelStats, ChannelKey>('channel_stats_by_id', false),
  ])
  const indexes: ChannelViewIndexes = {
    channelVideo,
    channelStatsByPeriod,
    channelStatsById
  }
  return indexes
}

export const indexPeriods = (index: BlobIndex<any, HasPeriod>) => index.cols?.period.distinct.map(d => parsePeriod(d))

export const indexRemovedVideos = () => blobIndex<VideoRemoved, { lastSeen: string }>('video_removed')

export const getJsonlResult = <T,>(name: string): Promise<T[]> => getJsonl<T>(blobCfg.resultsUri.addPath(`${name}.jsonl.gz`).url,
  { headers: { pragma: "no-cache", 'cache-control': 'no-cache' } })


