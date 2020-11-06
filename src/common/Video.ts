import { Channel } from './Channel'
import { VideoCommon } from './RecfluenceApi'

const thumbs = {
  default: 'default',
  high: 'hqdefault'
}

export const videoThumb = (videoId: string, size?: keyof typeof thumbs) =>
  `https://img.youtube.com/vi/${videoId}/${thumbs[size ?? 'default']}.jpg`
export const videoUrl = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`

export const videoWithEx = <T extends VideoCommon>(v: T, channels: Record<string, Channel>) => {
  const c = channels[v.channelId]
  return ({ ...v, tags: c?.tags, lr: c?.lr }) // de-normalize from channel for generic filter functionality
}
