
const thumbs = {
  default: 'default',
  high: 'hqdefault'
}

export const videoThumb = (videoId: string, size?: keyof typeof thumbs) =>
  `https://img.youtube.com/vi/${videoId}/${thumbs[size ?? 'default']}.jpg`
export const videoUrl = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`