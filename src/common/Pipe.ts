import { groupBy, mapToObj, purry, take } from 'remeda'
import _orderBy from 'lodash.orderby'
import { shuffle } from 'd3'

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
export const entries = <X extends string, Y>(o: { [key in X]?: Y }): [X, Y][] => Object.entries(o) as any
export const entriesToObj = <T>(entries: [string, T][]) => mapToObj(entries, e => e)
export const pickFull = <T extends {}, K extends keyof T>(
  object: T,
  names: readonly K[]
): Pick<T, K> => mapToObj(names, n => [n, object[n]]) as Pick<T, K>
export const minMax = (items: number[]) => [min(items), max(items)]

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

/**
 * Map's entries according to `fn` who'd results are returned as an array.
 * e.g. `mapEntries({panda:{size:5},fish:{size:2}], (animal, name, i) => ({animal, name, rank:i+1}))` // returns [{animal:'panda', size:5, rank:1}, {animal:'fish', size:2, rank:2}]
 * This is like remeda's mapEntries, but with an index parameter.
 */
export const mapEntries = <K extends string, T, U>(group: Record<K, T>, fn: (values: T, key: string, i: number) => U): U[] => {
  if (!group) return null
  return entries(group).map(([key, values], i) => fn(values, key, i))
}

/**
 * like remeda mapValues, but provides an index to fn
 */
export const mapValuesIdx = <T extends object, S>(obj: T, fn: (value: T[keyof T], key: keyof T, i: number) => S): Record<keyof T, S> =>
  Object.keys(obj).reduce((acc, key, i) => {
    acc[key] = fn(obj[key], key as keyof T, i)
    return acc
  }, {} as any)

/**
 * Groups items by `getKey` then maps using getVal.
 * @example groupMap(
 *  [{cat:'Fruit', name:'Apple'},{cat:'Fruit', name:'Banana'},{cat:'Veggie', name:'Capsicum'}], 
 *  k => k.cat, 
 *  (g, cat) => ({cat, products:g})
 * ) // => [{cat:'Fruit', products:['Apple', 'Banana']}, {cat:'Veggie', products:['Capsicum']}]
 */
export const groupMap = <T, TVal, K extends string>(items: T[], getKey: (item: T) => K, getVal: (values: T[], key: K, i: number) => TVal): TVal[] => {
  if (!items) return null
  return mapEntries(groupBy(items, getKey), getVal)
}

export const takeRandom = <T>(items: T[]): T => items ? items[Math.floor(Math.random() * items.length)] : null
export const takeSample = <T>(items: T[], n: number): T[] => take(shuffle(items.slice()), n)

export const asArray = <T,>(v: Array<T> | T) => !v ? [] : Array.isArray(v) ? v as Array<T> : [v as T]

export const flatMap = <T, R>(items: T[], getVals: (i: T) => R[]): R[] => [].concat(...items.map(getVals))

export const compactObj = <T>(obj: T) => mapToObj(keys(obj).filter(k => obj[k] != null), k => [k, obj[k]])