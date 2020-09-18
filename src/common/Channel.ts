
import { Uri } from './Uri'
import { getJsonl } from './Utils'
import { filter, flatMap, indexBy, map, pipe } from 'remeda'
import { sortBy, sumBy } from './Pipe'



export interface ChannelCommon {
  channelId: string
  channelTitle: string
  tags: string[]
  logoUrl: string
  date_to: string
  lr: string
}

export interface ChannelMeasures {
  subs: number
  channelViews: number
  views7: number
  viewsP7: number
  views30: number
  viewsP30: number
  views365: number
  viewsP365: number
}

export interface ChannelStats extends ChannelMeasures, ChannelCommon {
  date_to: string
}

export interface ColumnMd { value: string, label?: string, color?: string }

export const channelMd = {
  tag: [
    { value: 'AntiSJW', label: 'Anti-SJW', color: '#8a8acb' },
    { value: 'AntiTheist', label: 'Anti-theist', color: '#96cbb3' },
    { value: 'Conspiracy', color: '#e0990b' },
    { value: 'LateNightTalkShow', label: 'Late night talk show', color: '#00b1b8' },
    { value: 'Libertarian', color: '#ccc' },
    { value: 'MRA', color: '#003e78' },
    { value: 'Mainstream News', label: 'MSM', color: '#aa557f' },
    { value: 'PartisanLeft', label: 'Partisan Left', color: '#3887be' },
    { value: 'PartisanRight', label: 'Partisan Right', color: '#e0393e' },
    { value: 'QAnon', color: '#e55e5e' },
    { value: 'ReligiousConservative', label: 'Religious Con.', color: '#41afa5' },
    { value: 'SocialJustice', label: 'Social Justice', color: '#56b881' },
    { value: 'Socialist', color: '#6ec9e0' },
    { value: 'WhiteIdentitarian', label: 'White Identitarian', color: '#b8b500' },
    { value: 'OrganizedReligion', label: 'Organized Religion' },
  ] as ColumnMd[],
  lr: [
    { value: 'L', label: 'Left', color: '#3887be' },
    { value: 'C', label: 'Center', color: '#8a8acb' },
    { value: 'R', label: 'Right', color: '#e0393e' },
    { value: '', label: 'Unclassified', color: '#555' }
  ] as ColumnMd[],
  measures: [
    { value: 'channelViews', label: 'total views' },
    { value: 'views7', label: 'daily views (last 7 days)' },
    { value: 'views30', label: 'daily views (last 30 days)' },
    { value: 'views365', label: 'daily views (last 365 days)' },
    { value: 'subs', label: 'subscribers' }
  ] as { value: keyof ChannelMeasures, label: string }[]
}

export interface ChannelNode {
  type: 'root' | 'tag' | 'channel'
  title: string
  children?: ChannelNode[]
  channel?: ChannelStats
  color?: string
  key?: string
  val?: number
  img?: string
}

export async function getChannels(): Promise<ChannelStats[]> {
  const path = new Uri('https://pyt.blob.core.windows.net/data/results')
  const channels = await getJsonl<ChannelStats>(path.addPath('vis_channel_stats2.jsonl.gz').url, { headers: { cache: "no-store" } })
  return channels
}

export interface TagNodes {
  tag: ColumnMd
  nodes: d3.HierarchyCircularNode<ChannelNode>[]
  dim: {
    x: NodeMinMax
    y: NodeMinMax
    size: number
  }
}

export interface NodeMinMax {
  min: d3.HierarchyCircularNode<ChannelNode>
  max: d3.HierarchyCircularNode<ChannelNode>
}

export const imagesToLoad = (tagNodes: TagNodes[]) => pipe(tagNodes,
  flatMap(t => t.nodes),
  map(n => n.data.img),
  filter(i => i != null))

export const getTagData = (channels: ChannelStats[], val: (c: ChannelStats) => number) => {
  const lr = indexBy(channelMd.lr, i => i.value)
  return pipe(channelMd.tag,
    map(t => ({
      tag: t,
      channels: channels.filter(c => c.tags.includes(t.value) && val(c) != null)
        .map(c => ({
          type: 'channel',
          title: c.channelTitle,
          channel: c,
          color: lr[c.lr]?.color,
          val: val(c),
          key: `${t.value}|${c.channelId}`
        } as ChannelNode))
    })),
    sortBy(n => sumBy(n.channels, c => c.val), 'desc')
  )
}

export const videoThumbHigh = (videoId: string) => `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`