import base64 from 'base-64'
import camelKeys from 'camelcase-keys'
import { Channel } from './Channel'
import { Uri } from './Uri'
import { SearchBody, QueryData } from 'elastic-ts'
import { snakeCase } from 'change-case'
import { nullFormat } from 'numeral'
import { esCfg } from './Cfg'

export interface EsCfg {
  url: string
  creds: string
  prefix: string
  indexes: EsIndexes
}

export interface EsChannel extends Channel {
  description?: string
}

export interface EsIndexes {
  caption: string
  video: string
  channel: string
  channelTitle: string
}

export interface EsSearchRes<T> {
  hits: { hits: EsDocRes<T>[] }
}

export interface EsDocRes<T> {
  found: boolean
  _source: T
}

export interface EsDocsRes<T> {
  docs: EsDocRes<T>[]
}

export interface EsVideo {
  videoId: string
  videoTitle: string
  channelId: string
  channelTitle: string
  uploadDate?: string
  updated?: string
  views?: number,
  description?: string
  durationSecs?: number
}

export async function getChannel(channelId: string, props?: (keyof EsChannel)[]) {
  const res = await esDoc(esCfg.indexes.channel, channelId, props?.map(p => snakeCase(p)))
  return camelKeys(res._source) as EsChannel
}

export const getChannels = async (ids: string[]) =>
  mapEsRes<EsChannel>(await esDocs(esCfg.indexes.channel, ids))

export const getVideos = async (ids: string[], props?: (keyof EsVideo)[]) =>
  mapEsRes<EsVideo>(await esDocs(esCfg.indexes.video, ids, props?.map(p => snakeCase(p))))

const mapEsRes = <T>(res: EsDocsRes<any>) => res.docs?.filter(d => d.found).map(d => camelKeys(d._source) as T) ?? []

export async function getChannelVideos(channelId?: string, from?: Date, props?: (keyof EsVideo)[], size?: number) {
  const q: SearchBody = {
    query: {
      bool: {
        must: channelId ? {
          term: {
            channel_id: channelId
          }
        } : null,
        filter: from ? {
          range: {
            upload_date: {
              gte: from.toISOString()
            }
          }
        } : null
      }
    },
    sort: [
      {
        views: {
          order: 'desc'
        }
      }
    ],
    size,
    _source: props.map(p => snakeCase(p))
  }

  const res = await esSearch(esCfg.indexes.video, q)
  return res.map(r => camelKeys(r) as EsVideo)
}


export const esHeaders = {
  "Authorization": `Basic ${base64.encode(esCfg.creds)}`
}

export async function esDoc(index: string, id: string, props?: string[]) {
  {
    let uri = new Uri(esCfg.url).addPath(index, '_doc', id)
    if (props) uri = uri.addQuery({ _source_includes: props.join(',') })
    var res = await fetch(uri.url, { headers: new Headers(esHeaders) })
    var j = await res.json() as EsDocRes<any>
    return j
  }
}

export async function esDocs(index: string, ids: string[], props?: string[]) {
  {
    let uri = new Uri(esCfg.url).addPath(index, '_mget')
    if (props) uri = uri.addQuery({ _source_includes: props.join(',') })
    var res = await fetch(uri.url,
      {
        method: 'POST',
        body: JSON.stringify({ ids }),
        headers: new Headers({ ...esHeaders, 'Content-Type': 'application/json' })
      })
    var j = await res.json() as EsDocsRes<any>
    return j
  }
}

export async function esSearch(index: string, search: SearchBody): Promise<any[]> {
  {
    let res = await fetch(
      new Uri(esCfg.url).addPath(index, '_search').url,
      {
        method: 'POST',
        headers: new Headers({ ...esHeaders, 'Content-Type': 'application/json' }),
        body: JSON.stringify(search)
      })

    if (!res.ok) {
      console.log('error with esSearch', res)
      return []
    }

    let j = (await res.json()) as EsSearchRes<any>
    let sources = j.hits.hits.map(h => h._source)
    return sources
  }
}


