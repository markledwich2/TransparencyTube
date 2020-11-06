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
 * Gets column metadata. Provides somde derived data that don't exist directly on the metadata (e.g. col default labels)
 */
export const colMd = (md: TablesMetadata, table: string, col: string): ColumnMd => {
  const colMd = md[table][col] as ColumnMd
  return { label: col, ...colMd }
}

export const tableMdForCol = (md: TablesMetadata, col: string) => entries(md).find(e => e[1][col])[0]