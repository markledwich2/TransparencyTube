import { pack, hierarchy } from 'd3'
import orderBy from 'lodash.orderby'
import { pipe, map, indexBy, flatMap, filter, first } from 'remeda'
import { blobCfg } from './Cfg'
import { Channel, md, hiddenTags, ColumnValueMd, ColumnMd } from './Channel'
import { sumBy, values, minBy, maxBy, max } from './Pipe'
import { ChannelWithStats } from './RecfluenceApi'
import { getJsonl } from './Utils'

export interface ChannelNode {
  type: 'root' | 'tag' | 'channel'
  title: string
  children?: ChannelNode[]
  channel?: ChannelWithStats
  color?: string
  key?: string
  val?: number
  img?: string
}

export interface GroupedNodes {
  group: ColumnValueMd<string>
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

export interface BubblesSelectionState {
  measure?: string
  groupBy?: keyof Channel
  colorBy?: keyof Channel
  period?: string
  openGroup?: string
  openChannelId?: string
}

export const getGroupData = (channels: ChannelWithStats[], display: BubblesSelectionState) => {
  const { measure, groupBy, colorBy } = display
  const val = (c: ChannelWithStats) => c[measure] ?? 0
  const channelMd: Record<string, ColumnMd> = md.channel

  const groupMd = indexBy(channelMd[groupBy].values.filter(g => g.color), o => o.value)
  const colorMd = indexBy(channelMd[colorBy].values, o => o.value)

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
        const colorVal = Array.isArray(colorVals) ? first(colorVals.filter(cv => colorMd[cv])) : colorVals as string | number
        return {
          type: 'channel',
          title: c.channelTitle,
          channel: c,
          color: colorMd[colorVal]?.color,
          val: val(c),
          key: c.channelId
        }
      })
    return { group: g, nodes }
  })

  return orderBy(groups, n => sumBy(n.nodes, c => c.val), 'desc')
}

export interface TagNodes {
  groupedNodes: GroupedNodes[]
  maxSize: number
  zoom: number
  packSize: number
  containerWidth: number
}

export const buildChannelBubbleNodes = (channels: ChannelWithStats[], display: BubblesSelectionState, containerWidth: number)
  : TagNodes => {
  const groupData = getGroupData(channels, display)
  const packSize = Math.min(containerWidth - 20, 800)
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
      .radius(d => Math.sqrt(d.data.val) * 0.015)
      (hierarchy(root, n => n.children))
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
    n.data.img = n.data?.channel?.logoUrl
  })

  return { groupedNodes, maxSize, zoom, packSize, containerWidth }
}

export const getZoomToFit = (nodes: GroupedNodes, size: number) =>
  size / Math.max(nodes.dim.w, nodes.dim.h)