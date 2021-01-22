import { chunk, flatMap, mergeAll } from 'remeda'
import { mapEntries } from './Pipe'
import { Uri } from './Uri'
import { getJson } from './Utils'

interface OdyseeRes<T> {
  success: boolean
  error: string
  data: T
}

interface OdyseeVideos {
  videos: Record<string, string>
}

export interface OdyseeYtVideo {
  videoId: string
  odyseePath: string
}

export const odyseeYtVideos = async (ytVideoIds: string[]): Promise<OdyseeYtVideo[]> => {
  const url = (ids: string[]) => new Uri('https://api.lbry.com/yt/resolve').addQuery({ video_ids: ids.join(',') }).url
  const rows = await Promise.all(chunk(ytVideoIds, 50).map(ids => getJson<OdyseeRes<OdyseeVideos>>(url(ids))))
  const res = flatMap(rows, r => mapEntries(r.data?.videos ?? {}, (odyseePath, videoId) => ({ videoId, odyseePath }))
    .filter(e => e.odyseePath))
  return res
}

export const odyseeVideoUrl = (path: string) => `https://odysee.com/${path}`