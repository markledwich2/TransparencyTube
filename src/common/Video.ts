import { Channel, PlatformName } from './Channel'
import { VideoCommon } from './RecfluenceApi'
import { Uri } from './Uri'

const thumbs = {
  default: 'default',
  high: 'hqdefault'
}

export const videoThumb = (v: VideoThumb, size?: keyof typeof thumbs) =>
  videoThumbSwitch[v.platform ?? 'YouTube'](v, size)

interface VideoThumb { videoId: string, platform?: PlatformName, thumb?: string }
const videoThumbSwitch = {
  'YouTube': (v: VideoThumb, size?: keyof typeof thumbs) =>
    v.thumb ?? `https://img.youtube.com/vi/${v.videoId}/${thumbs[size ?? 'default']}.jpg`,
  'Rumble': (v: VideoThumb) => v.thumb,
  'BitChute': (v: VideoThumb) => v.thumb
}

const videoUrlSwitch = {
  'YouTube': (videoId: string, offset: number | null = null) => {
    let uri = new Uri(`https://www.youtube.com/watch?v=${videoId}`)
    if (offset) uri = uri.addQuery({ t: offset })
    return uri.url
  },
  'Rumble': (videoId: string) => videoId,
  'BitChute': (videoId: string) => `https://www.bitchute.com/video/${videoId.split('|')[1]}/`
}

export const videoUrl = (videoId: string, offset: number | null = null, platform: PlatformName = 'YouTube') =>
  videoUrlSwitch[platform](videoId, offset)

export const videoWithEx = <T extends VideoCommon>(v: T, channels: Record<string, Channel>) => {
  const c = channels[v.channelId]
  return ({ ...v, tags: c?.tags ?? null, lr: c?.lr ?? null }) // de-normalize from channel for generic filter functionality
}
