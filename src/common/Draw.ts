import { HierarchyCircularNode } from 'd3'
import { max, maxBy, min, minBy } from './Pipe'
import { isSSR } from './Utils'

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

export const circleFromD3 = <T,>(c: HierarchyCircularNode<T>): Circle => ({ cx: c.x, cy: c.y, r: c.r })
export const circleToRect = (c: Circle): Rect => ({ x: c.cx - c.r, y: c.cy - c.r, w: c.r * 2, h: c.r * 2 })

/**
 * calculates dimensions to help resizing/zooming to fit containers
 */
export const getBounds = (rects: Rect[], padding: number = 0): Rect => {
  const x = min(rects.map(r => r.x)) - padding
  const y = min(rects.map(r => r.y)) - padding
  const w = max(rects.map(r => r.x + r.w)) - x + padding
  const h = max(rects.map(r => r.y + r.h)) - y + padding
  return { x, y, w, h }
}

export const offsetTransform = (offset: Point) => `translate(${-offset.x}, ${-offset.y})`
export const pointTranslate = <T extends Point>(point: T, offset: Point) => ({ ...point, x: point.x + offset.x, y: point.y + offset.y })

export const getTextWidth = (() => {
  const container = isSSR() ? null : document?.createElement('canvas')
  const widthCache: Record<string, number> = {}

  return function (inputText?: string | number | null, font: string = null, backupFontSize = 12, backupRatio = 0.5) {
    const text = (inputText ?? '').toString()
    const key = [inputText, font, backupFontSize, backupRatio].join('|')
    const cached = widthCache[key]
    if (cached)
      return cached
    if (isSSR()) return backupFontSize * backupRatio * text.length

    let context = container?.getContext('2d')
    if (context && document) {
      context.font = font ?? window.getComputedStyle(document.body).getPropertyValue('font')
      const width = context.measureText(text).width
      widthCache[key] = width
      return width
    } else {
      /* if something goes wrong mounting the canvas, return an estimate calculated using 
       * the backup ratio, the average open-sans font height-width ratio of 0.5 
       */
      let fontSize = document && window ?
        parseFloat(window.getComputedStyle(document.body).getPropertyValue('font-size'))
        : backupFontSize
      return fontSize * backupRatio * text.length
    }
  }
})()