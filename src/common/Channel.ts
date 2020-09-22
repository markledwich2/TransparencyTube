
import { Uri } from './Uri'
import { getJsonl } from './Utils'
import { filter, first, flatMap, indexBy, map, mapValues, pipe } from 'remeda'
import { max, maxBy, minBy, sortBy, sumBy, values } from './Pipe'
import { Opt } from '../components/InlineSelect'
import { hierarchy, pack } from 'd3'
import { StringLiteralLike } from 'typescript'

export interface ChannelCommon {
  channelId: string
  channelTitle: string
  tags: string[]
  logoUrl: string
  date_to: string
  lr: string
}

export interface ChannelDerived {
  media: string
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

export interface ChannelStats extends ChannelMeasures, ChannelCommon, ChannelDerived {
  date_to: string
}

export interface ColumnMd<T> extends Opt<T> { color?: string }


export const channelMd: { [key: string]: ColumnMd<string>[] } = {
  tags: [
    { value: 'AntiSJW', label: 'Anti-SJW', color: '#8a8acb' },
    { value: 'AntiTheist', label: 'Anti-theist', color: '#96cbb3' },
    { value: 'Conspiracy', color: '#e0990b' },
    { value: 'LateNightTalkShow', label: 'Late night talk show', color: '#00b1b8' },
    { value: 'Libertarian', color: '#ccc' },
    { value: 'MRA', color: '#003e78' },
    { value: 'Mainstream News', label: 'Mainstream News', color: '#aa557f' },
    { value: 'PartisanLeft', label: 'Partisan Left', color: '#3887be' },
    { value: 'PartisanRight', label: 'Partisan Right', color: '#e0393e' },
    { value: 'QAnon', color: '#e55e5e' },
    { value: 'ReligiousConservative', label: 'Religious Con.', color: '#41afa5' },
    { value: 'SocialJustice', label: 'Social Justice', color: '#56b881' },
    { value: 'Socialist', color: '#6ec9e0' },
    { value: 'WhiteIdentitarian', label: 'White Identitarian', color: '#b8b500' },
    // { value: 'OrganizedReligion', label: 'Organized Religion' },
  ],
  lr: [
    { value: 'L', label: 'Left', color: '#3887be' },
    { value: 'C', label: 'Center', color: '#c060a1' },
    { value: 'R', label: 'Right', color: '#da2d2d' }
  ],
  media: [
    { value: 'Mainstream Media', label: 'Mainstream Media', color: '#aa557f' },
    { value: 'YouTube', label: 'YouTube', color: '#56b881' }
  ],
  measures: [
    { value: 'channelViews', label: 'total views' },
    { value: 'views7', label: 'daily views (last 7 days)' },
    { value: 'views30', label: 'daily views (last 30 days)' },
    { value: 'views365', label: 'daily views (last 365 days)' },
    { value: 'subs', label: 'subscribers' }
  ]
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

  let tagViews: { [key: string]: { tag: string, sum: number } } = pipe(channelMd.tags,
    map(t => ({ tag: t.value, channels: channels.filter(c => c.tags.includes(t.value)) })),
    map(t => ({ tag: t.tag, sum: sumBy(t.channels, c => c.views365 ?? 0) })),
    indexBy(t => t.tag)
  )

  channels.forEach(c => {
    c.tags = sortBy(c.tags, t => tagViews[t]?.sum ?? 0, 'asc') // rarer tags go first so colors are more meaningful
    c.media = c.tags.find(t => ['Mainstream News', 'MissingLinkMedia', 'LateNightTalkShow'].includes(t)) ? 'Mainstream Media' : 'YouTube'
  })
  return channels
}

export interface GroupedNodes {
  group: ColumnMd<string>
  nodes: d3.HierarchyCircularNode<ChannelNode>[]
  dim: {
    x: NodeMinMax
    y: NodeMinMax
    w: number
    h: number
  }
}

export interface NodeMinMax {
  min: d3.HierarchyCircularNode<ChannelNode>
  max: d3.HierarchyCircularNode<ChannelNode>
}

export const imagesToLoad = (tagNodes: GroupedNodes[], loaded: Set<string>) => pipe(tagNodes,
  flatMap(t => t.nodes),
  map(n => n.data.img),
  filter(i => i != null && !loaded.has(i)))

export interface DisplayCfg {
  measure: keyof ChannelMeasures
  groupBy: keyof ChannelStats
  colorBy: keyof ChannelStats
}

export const getGroupData = (channels: ChannelStats[], display: DisplayCfg) => {
  const { measure, groupBy, colorBy } = display
  const val = (c: ChannelStats) => c[measure] ?? 0
  const groupMd = indexBy(channelMd[groupBy], o => o.value)
  const colorMd = indexBy(channelMd[colorBy], o => o.value)

  const groups = values(groupMd).map(g => {
    const nodes: ChannelNode[] = channels
      .filter(c => {
        const gVal = c[groupBy]
        return Array.isArray(gVal)
          ? gVal.includes(g.value) && val(c) != null
          : gVal == g.value && val(c) != null
      })
      .map(c => {
        const colorVals = c[colorBy]
        const colorVal = Array.isArray(colorVals) ? first(colorVals.filter(cv => colorMd[cv])) : colorVals
        return {
          type: 'channel',
          title: c.channelTitle,
          channel: c,
          color: colorMd[colorVal]?.color,
          val: val(c),
          key: `${g.value}|${c.channelId}`
        }
      })
    return { group: g, nodes }
  })

  return sortBy(groups, n => sumBy(n.nodes, c => c.val), 'desc')
}

export const buildTagNodes = (channels: Record<string, ChannelStats>, display: DisplayCfg, width: number) => {
  const groupData = getGroupData(values(channels), display)
  const packSize = Math.min(width - 20, 800)
  const groupedNodes: GroupedNodes[] = groupData.map(t => {

    if (t.nodes.length == 0)
      return null

    const root: ChannelNode = {
      type: 'root',
      title: 'root',
      children: t.nodes
    }

    const nodes = pack<ChannelNode>()
      .padding(0)
      .size([packSize, packSize])
      .radius(d => Math.sqrt(d.data.val) * 0.015)(hierarchy(root, n => n.children))
      .descendants()

    let { x, y } = {
      x: {
        min: minBy(nodes, n => n.x - n.r),
        max: maxBy(nodes, n => n.x + n.r)
      },
      y: {
        min: minBy(nodes, n => n.y - n.r),
        max: maxBy(nodes, n => n.y + n.r)
      },
    }

    let dim = {
      x, y,
      w: (x.max.x + x.max.r) - (x.min.x - x.min.r),
      h: (y.max.y + y.max.r) - (y.min.y - y.min.r)
    }

    return { group: t.group, nodes: nodes, dim }
  }).filter(t => t != null)

  const maxSize = max(groupedNodes.map(t => Math.max(t.dim.w, t.dim.h))) // max size for all charts
  const zoom = packSize / maxSize

  flatMap(groupedNodes, t => t.nodes).forEach(n => {
    if (n.r * zoom > 10)
      n.data.img = n.data?.channel?.logoUrl
  })

  return { groupedNodes, maxSize, zoom, packSize }
}
