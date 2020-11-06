import { Channel, md } from '../common/Channel'
import { tableMdForCol } from '../common/Metadata'
import { keys } from '../common/Pipe'
import { VideoCommon } from '../common/RecfluenceApi'
import { FilterState } from './ValueFilter'


export interface VideoFilter extends FilterState {
  tags?: string[],
  lr?: string[],
  errorType?: string[]
}

export interface VideoChannelExtra { tags: string[], lr: string }

export const videoFilterIncludes = (filter: VideoFilter, video: VideoCommon & VideoChannelExtra) => {
  if (!filter || !video) return true
  const colTest = (c: keyof VideoFilter) => {
    var filterValues = filter[c]
    if (!filterValues) return true
    const recordValue = video?.[c] as string | string[]
    return Array.isArray(recordValue) ? filterValues.every(fv => recordValue.includes(fv)) : filterValues.includes(recordValue)
  }
  return keys(filter).every(colTest)
}