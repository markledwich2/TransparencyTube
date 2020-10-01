
import { parseISO, format, isToday } from "date-fns"
import { dateFormat } from './Utils'

const thumbs = {
  default: 'default',
  high: 'hqdefault'
}

export const videoThumb = (videoId: string, size?: keyof typeof thumbs) =>
  `https://img.youtube.com/vi/${videoId}/${thumbs[size ?? 'default']}.jpg`
export const videoUrl = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`


export const daysTillLabel = (p: string, days: number) => {
  return `${days > 1 ? `${days} days till ` : ''}${dateFormat(p)}`
}

export const labelFuncs = {
  d: daysTillLabel,
  m: (p: string) => `${format(parseISO(p), 'yyyy MMM')}`,
  y: (p: string) => `${format(parseISO(p), 'yyyy')}`
}

export const periodLabel = (type: string, period: string) => {
  const dReg = /d([\d]+)/.exec(type)
  if (dReg?.length) return labelFuncs.d(period, parseInt(dReg[1]))
  const labelF: (p: string) => string = labelFuncs[type]
  if (labelF) return labelF(period)
  return `${type} - ${period}`
}