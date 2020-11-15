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