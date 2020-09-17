import { purry } from 'remeda'

export type Dir = 'asc' | 'desc'

export function sortBy<T>(array: readonly T[], fn: (item: T) => any, dir?: Dir): T[]
export function sortBy<T>(fn: (item: T) => any, dir?: Dir): (array: readonly T[]) => T[]
export function sortBy() { return purry(_sortBy, arguments) }

function _sortBy<T>(array: T[], fn: (item: T) => any, dir?: Dir): T[] {
  const copied = [...array]
  return copied.sort((a, b) => {
    const aa = fn(a)
    const bb = fn(b)
    const compare = aa < bb ? -1 : aa > bb ? 1 : 0
    return dir == 'desc' ? -compare : compare
  })
}

/* Below I haven't done the purry yet, so you can't pipe? */

export const sumBy = <T>(items: T[], by: (i: T) => number) => items.map(by).reduce((p, c) => p + c, 0)

function firstBy<T>(items: T[], by: (i: T) => number, dir: Dir) {
  let [first, v] = [null as T, null as number]
  items.forEach(i => {
    const n = by(i)
    if (v == null || (dir == 'desc' ? n > v : n < v))
      [first, v] = [i, n]
  })
  return first
}

export const minBy = <T>(items: T[], by: (i: T) => number) => firstBy(items, by, 'asc')
export const maxBy = <T>(items: T[], by: (i: T) => number) => firstBy(items, by, 'desc')
export const min = (items: number[]) => firstBy(items, i => i, 'asc')
export const max = (items: number[]) => firstBy(items, i => i, 'desc')
