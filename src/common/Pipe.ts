import { purry } from 'remeda'
import _orderBy from 'lodash.orderby'

type Many<T> = T | readonly T[]
export type Dir = 'asc' | 'desc'

export function orderBy<T>(collection: T[], by?: Many<(item: T) => any>, orders?: Many<Dir>): T[]
export function orderBy<T>(by?: Many<(item: T) => any>, orders?: Many<Dir>): (array: readonly T[]) => T[]
export function orderBy() { return purry(innerOrderBy, arguments) }
const innerOrderBy = <T>(collection: T[], by?: Many<(item: T) => any>, orders?: Many<Dir>): T[] =>
  _orderBy(collection, by, orders)


/* Below I haven't done the purry yet, so you can't pipe */
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
export const values = <V>(o: Record<any, V>): V[] => Object.values(o)
export const keys = <T>(o: T): (keyof T)[] => Object.keys(o) as unknown as (keyof T)[]
export const entries = <X extends string, Y>(o: { [key in X]: Y }): [X, Y][] => Object.entries(o) as any

export const treeToList = <T>(roots: T[], getChildren: (node: T) => T[]): T[] => {
  let working = [...roots], res: T[] = []
  while (working.length > 0) {
    var node = working.pop()
    res.push(node)
    getChildren(node)?.forEach(c => working.push(c))
  }
  return res
}

export const treeParents = <T>(node: T, getParent: (n: T) => T) => {
  let res: T[] = [], p: T = getParent(node)
  while (true) {
    if (!p) break
    if (res.includes(p)) break
    res.push(p)
    p = getParent(p)
  }
  return res
}

export const isSubset = <T>(subset: T[], items: T[]) => subset.every(n => items.includes(n))
export const mapEntries = <T, U>(group: Record<string, T>, groupMap: (key: string, values: T) => U): U[] => entries(group).map(([key, values]) => groupMap(key, values))
export const takeRandom = <T>(items: T[]): T => items ? items[Math.floor(Math.random() * items.length)] : null
