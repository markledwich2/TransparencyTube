import { entries, isSubset, mapEntries, max, min, minBy, sumBy, values } from './Pipe'
import { venn, scaleSolution, computeTextCentres, distance } from 'venn.js'
import { pack, hierarchy, HierarchyNode, sum, HierarchyCircularNode } from 'd3'
import { flatMap, groupBy, indexBy, mapValues, pick, pipe, } from 'remeda'
import { getPackDim } from './Bubble'
import { Circle, circleFromD3, circleToRect, getBounds, Point } from './Bounds'
import orderBy from 'lodash.orderby'


interface VennChartCircle { x: number, y: number, radius: number }
type VennChart = Record<string, VennChartCircle>
type TextCenters = Record<string, { x: number, y: number }>


interface VennCommonDatum {
  id: string,
  value?: number
}
interface VennRootNode extends VennCommonDatum { type: 'root', nodes: any[] }
const isVenRootNode = (o: any): o is VennRootNode => o.type == 'root' && Array.isArray(o.nodes)

export interface VennSet<T> {
  sets: string[],
  root: HierarchyNode<VennDatum<T>>
  size: number,
}

type VennDatum<T> = VennRootNode | (T & VennCommonDatum)

const setNamesToKey = (sets: string[]) => sets.sort().join(',')
const keyToSetNames = (key: string) => key.split(',')

export interface VennTypeCfg<T> {
  getKey: (n: T) => string
  getSets: (n: T) => string[]
  getSize: (n: T) => number
  getChildren: (n: T) => any[]
}

export const vennSets = <T>(data: T[], typeCfg: VennTypeCfg<T>): VennSet<T>[] => {
  const groupObj = pipe(
    data.filter(d => typeCfg.getSets(d).length > 0),
    groupBy(n => setNamesToKey(typeCfg.getSets(n)))
  )

  const groups = mapEntries(groupObj, (nodes, key) => {
    const root = hierarchy<VennDatum<T>>(
      { type: 'root', nodes, id: key, value: null },
      n => isVenRootNode(n) ? n.nodes : typeCfg.getChildren(n)?.map(c => ({
        ...c,
        value: typeCfg.getSize(c),
        id: typeCfg.getKey(c)
      })))
    return {
      root,
      sets: keyToSetNames(key),
      size: sum(root.leaves().map(n => isVenRootNode(n.data) ? 0 : typeCfg.getSize(n.data)))
    }
  })
  const sizedGroups = groups.map(g => ({ // use 2nd pass to add subset sizes to other groups
    ...g,
    size: sumBy(groups.filter(h => isSubset(g.sets, h.sets)), g => g.size)
  }))
  return sizedGroups
}

interface VennSetLayout<T> {
  key: string,
  circle: (Circle)
  txtCenter: Point
  innerRadius: number
  offset: Point, // translate points & zoom for circle & rowCircles
  circles: VennCircle<T>[]
}

interface VennCircle<T> extends Circle { data: T, key: string }

export const vennLayout = <T>(
  sets: VennSet<T>[],
  cfg: { width: number, height: number, padding: number }): VennSetLayout<T>[] => {
  const setsObj = indexBy(sets, s => setNamesToKey(s.sets))
  console.log('vennLayout sets:')
  console.table(sets)
  const rawVenn: VennChart = venn(sets)
  const scaledVenn: VennChart = scaleSolution(rawVenn, cfg.width, cfg.height, cfg.padding)
  const textCenters: TextCenters = computeTextCentres(scaledVenn, sets)
  const setCircles = mapValues(scaledVenn, c => ({ cx: c.x, cy: c.y, r: c.radius, vennCircle: c })) // basic big circles

  const getInnerRadius = (node: VennSet<T>) => {
    const key = setNamesToKey(node.sets)
    const txtCenter = textCenters[key]
    return min(entries(setCircles).map(([k, circle]) => {
      if (!circle.vennCircle.x) debugger
      const dist = distance(txtCenter, circle.vennCircle) // distance between center points
      return k == key ? circle.r - dist : Math.abs(dist - circle.r)
    }))
  }

  // pack node circles without any zoom/offset
  const rawCircles = mapEntries(textCenters, (txtCenter, key) => {
    const set = setsObj[key]
    const innerRadius = getInnerRadius(set)

    const circles = pack<VennDatum<T>>()
      .padding(0)
      .radius(n => n.data.value ? Math.sqrt(n.data.value) : null)
      .size([innerRadius * 2, innerRadius * 2])
      (set.root)
      .descendants()

    const c = { key, circles, circlesDim: getPackDim(circles), txtCenter, innerRadius }
    return c
  })

  const zooms = rawCircles.map(c => c.innerRadius * 2 / Math.max(c.circlesDim.h, c.circlesDim.w)).sort()
  const zoom = zooms[zooms.length > 1 ? Math.floor(zooms.length / 4) : 0]

  // fit packing into the inner circle of each set
  const circleNodes = rawCircles.map(n => {
    const dim = n.circlesDim
    const dx = -dim.x.min.x + dim.x.min.r
    const dy = -dim.y.min.y + dim.y.min.r
    const circles: VennCircle<T>[] = n.circles.filter(c => !isVenRootNode(c.data)).map(n => ({
      key: n.id,
      cx: (n.x + dx) * zoom,
      cy: (n.y + dy) * zoom,
      r: n.r * zoom,
      data: n.data as T
    }))

    const bounds = getBounds(circles.map(circleToRect))

    const offset = {
      x: n.txtCenter.x - bounds.w / 2,
      y: n.txtCenter.y - bounds.h / 2
    }
    const circle = setCircles[n.key]
    const { key, txtCenter, innerRadius } = n
    const layout: VennSetLayout<T> = { key, circle, txtCenter, innerRadius, offset, circles }
    return layout
  })
  return circleNodes
}

