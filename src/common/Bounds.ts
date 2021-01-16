import { HierarchyCircularNode } from 'd3'
import { max, maxBy, min, minBy } from './Pipe'

export interface Point {
  x: number
  y: number
}

export interface Dim {
  w: number,
  h: number
}

export type Rect = Point & Dim

export interface Circle {
  cx: number
  cy: number
  r: number
}

export const circleFromD3 = <T,>(c: HierarchyCircularNode<T>): Circle => {
  console.log('circleFromD3', c)
  return ({ cx: c.x, cy: c.y, r: c.r })
}

export const circleToRect = (c: Circle): Rect => {
  return ({ x: c.cx - c.r, y: c.cy - c.r, w: c.r * 2, h: c.r * 2 })
}

/**
 * calculates dimensions to help resizing/zooming to fit containers
 * @param nodes circle packing nodes
 */
export const getBounds = (rects: Rect[]): Rect => {
  const x = min(rects.map(r => r.x))
  const y = min(rects.map(r => r.y))
  const w = max(rects.map(r => r.x + r.w)) - x
  const h = max(rects.map(r => r.y + r.h)) - y
  return { x, y, w, h }
}

export const cropTransform = (crop: Rect) => `translate(${-crop.x}, ${-crop.y})`