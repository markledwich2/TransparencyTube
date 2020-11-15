import { indexBy } from 'remeda'
import { entries } from './Pipe'


export type TablesMetadata = Record<string, Record<string, ColumnMd>>

export interface ColumnMd {
  label?: string
  desc?: string
  values: ColumnValueMd<string>[]
}

export interface Opt<T> {
  label?: string
  value: T
}

export interface ColumnValueMd<T> extends Opt<T> { color?: string, format?: (n: number) => string, desc?: string }

/**
 * Gets column metadata. Provides some derived data that don't exist directly on the metadata (e.g. col default labels)
 */
export const colMd = (md: TablesMetadata, col: string, table: string = null): ColumnMd => {
  const t = table ?? tableMdForCol(md, col)
  const colMd = t && md[t][col] as ColumnMd
  return { label: col, ...colMd }
}

export const tableMdForCol = (md: TablesMetadata, col: string) => entries(md).find(e => e[1][col])?.[0]

export const colMdValues = <T,>(md: TablesMetadata, col: string, rows: T[] | null = null): ColumnValueMd<string>[] => {
  const c = colMd(md, col)
  if (!rows) return c.values
  const values = indexBy(c.values ?? [], v => v.value)
  rows.forEach(r => {
    const rowValue = r[col]
    const rowValues = rowValue && Array.isArray(rowValue) ? rowValue as string[] : [rowValue as string]
    rowValues.forEach(v => {
      const existing = values[v]
      if (!existing) values[v] = { value: v, label: v }
    })
  })
  return Object.values(values) ?? []
}