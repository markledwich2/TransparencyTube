import { pack, hierarchy, HierarchyCircularNode } from 'd3'
import orderBy from 'lodash.orderby'
import { pipe, map, indexBy, flatMap, filter, first } from 'remeda'
import { BubbleDataCfg } from '../components/BubbleChart'
import { Channel, md } from './Channel'
import { ColumnValueMd, colMdValues } from './Metadata'
import { sumBy, minBy, maxBy, max } from './Pipe'

export interface BubbleNode<T> {
  type: 'root' | 'group' | 'node'
  title: string
  children?: BubbleNode<T>[]
  row?: T
  color?: string
  key?: string
  val?: number
  img?: string
  selected?: boolean
}

export interface GroupedNodes<T> {
  group: ColumnValueMd<string>
  nodes: d3.HierarchyCircularNode<BubbleNode<T>>[]
  dim: {
    x: NodeMinMax<T>
    y: NodeMinMax<T>
    w: number
    h: number
  }
}

export interface NodeMinMax<T> {
  min: d3.HierarchyCircularNode<BubbleNode<T>>
  max: d3.HierarchyCircularNode<BubbleNode<T>>
}

export interface BubblesSelectionState<T> {
  measure?: string
  groupBy?: Extract<keyof T, string>
  colorBy?: Extract<keyof T, string>
  period?: string
  openGroup?: string
  openRowKey?: string
  selectedKeys?: string[]
}

export const getGroupData = <T>(rows: T[], selections: BubblesSelectionState<T>, dataCfg: BubbleDataCfg<any>) => {
  const { measure, groupBy, colorBy, selectedKeys } = selections
  const val = (c: T) => c[measure] ?? 0

  const groupValues = colMdValues(md, groupBy, rows).filter(g => g.value)
  const colorValues = indexBy(colMdValues(md, colorBy), c => c.value)

  const selectedSet = selectedKeys ? new Set(selectedKeys) : null

  const groups = groupValues.map(g => {
    const nodes: BubbleNode<T>[] = rows
      .filter(r => {
        const gVal = r[groupBy as string]
        return Array.isArray(gVal)
          ? gVal.includes(g.value) && val(r) != null
          : gVal == g.value && val(r) != null
      })
      .map(r => {
        const colorVals = r[colorBy as string]
        const colorVal = Array.isArray(colorVals) ? first(colorVals.filter(cv => colorValues[cv])) : colorVals as string | number
        const key = dataCfg.key(r)
        return {
          type: 'node',
          title: dataCfg.title(r),
          row: r,
          color: colorValues[colorVal]?.color,
          val: val(r),
          key: key,
          selected: selectedSet == null ? null : selectedSet.has(key)
        }
      })
    return { group: g, nodes }
  })

  return orderBy(groups, n => sumBy(n.nodes, c => c.val), 'desc')
}

export interface GroupNodes<T> {
  groupedNodes: GroupedNodes<T>[]
  maxSize: number
  zoom: number
  packSize: number
  containerWidth: number
}

/**
 * calculates dimensions to help resizing/zooming to fit containers
 * @param nodes circle packing nodes
 */
export const getPackDim = <T>(nodes: HierarchyCircularNode<T>[]) => {
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

  return dim
}

export const buildBubbleNodes = <T>(rows: T[], selections: BubblesSelectionState<T>, dataCfg: BubbleDataCfg<any>, containerWidth: number)
  : GroupNodes<T> => {
  const groupData = getGroupData(rows, selections, dataCfg)
  const packSize = Math.min(containerWidth - 20, 800)
  const groupedNodes: GroupedNodes<T>[] = groupData.map(t => {

    if (t.nodes.length == 0)
      return null

    const root: BubbleNode<T> = {
      type: 'root',
      title: 'root',
      children: t.nodes
    }

    const nodes = pack<BubbleNode<T>>()
      .padding(0)
      .size([packSize, packSize])
      .radius(d => Math.sqrt(d.data.val) * 0.015)
      (hierarchy(root, n => n.children))
      .descendants()

    return { group: t.group, nodes: nodes, dim: getPackDim(nodes) }
  }).filter(t => t != null)

  const maxSize = max(groupedNodes.map(t => Math.max(t.dim.w, t.dim.h))) // max size for all charts
  const zoom = packSize / maxSize

  flatMap(groupedNodes, t => t.nodes).forEach(n => {
    if (n.data?.row)
      n.data.img = dataCfg.image(n.data.row)
  })

  return { groupedNodes, maxSize, zoom, packSize, containerWidth }
}

export const getZoomToFit = (nodes: GroupedNodes<any>, size: number) =>
  size / Math.max(nodes.dim.w, nodes.dim.h)