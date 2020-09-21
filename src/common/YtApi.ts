import base64 from 'base-64'
import camelKeys from 'camelcase-keys'
import { ChannelCommon } from './Channel'
import { Uri } from './Uri'
import { SearchBody, QueryData } from 'elastic-ts'
import { snakeCase } from 'change-case'
import { nullFormat } from 'numeral'

export interface EsCfg {
  url: string
  creds: string
  prefix: string
  indexes: EsIndexes
}

export interface EsChannel extends ChannelCommon {
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

export const esCfg = {
  url: 'https://8999c551b92b4fb09a4df602eca47fbc.westus2.azure.elastic-cloud.com:9243',
  creds: 'public:5&54ZPnh!hCg',
  indexes: {
    caption: `caption`,
    channel: `channel`,
    channelTitle: `channel_title`,
    video: `video`
  }
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
}


export async function getChannel(channelId: string, props?: (keyof EsChannel)[]) {
  const res = await esDoc(esCfg.indexes.channel, channelId, props?.map(p => snakeCase(p)))
  return camelKeys(res._source) as EsChannel
}

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


