import base64 from 'base-64'
import camelKeys from 'camelcase-keys'
import { ChannelCommon } from './Channel'
import { Uri } from './Uri'

export interface EsCfg {
  url: string
  creds: string
  prefix: string
  indexes: EsIndexes
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

export interface EsChannel extends ChannelCommon {
  description?: string
}

export async function getChannel(channelId: string) {
  const res = await esDoc(esCfg.indexes.channel, channelId)
  return camelKeys(res._source) as EsChannel
}

export const esHeaders = {
  "Authorization": `Basic ${base64.encode(esCfg.creds)}`
}

export async function esDoc(index: string, id: string) {
  {
    var res = await fetch(
      new Uri(esCfg.url).addPath(index, '_doc', id).url, {
      headers: new Headers(esHeaders)
    })
    var j = await res.json() as EsDocRes<any>
    return j
  }
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

