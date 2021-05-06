import { indexBy, mapValues } from 'remeda'
import { entries, values } from './Pipe'
import { assign } from './Utils'


export type TablesMetadata = Record<string, ColumnMd[]>

export interface ColumnMd {
  label?: string
  desc?: string
  values: ColumnMdVal<string>[]
}

export interface ColumnMdRun extends ColumnMd {
  name: string
  label: string
  val: Record<string, ColumnMdVal<string>>
}

export type TableMd = Record<string, ColumnMd>
export type TableMdRun<T> = Record<Extract<keyof T, string>, ColumnMdRun>

export interface Opt<T> {
  label?: string
  value: T
}

export interface ColumnMdVal<T> extends Opt<T> { color?: string, format?: (n: number) => string, desc?: string, numRows?: number }

/**
 * Gets column metadata. Provides some derived data that don't exist directly on the metadata (e.g. col default labels)
 */
export const colMd = <T extends ColumnMd & { name: string },>(md: T, rows: object[] | null = null): ColumnMdRun & T => {
  const c = { label: md.name, ...md }
  const val = indexBy(c.values?.map(v => ({ label: v.value, ...v, numRows: 0 })) ?? [], v => v.value)
  rows?.forEach(r => {
    const rowValue = r[c.name]
    const rowValues = rowValue && Array.isArray(rowValue) ? rowValue as string[] : [rowValue as string]
    rowValues.forEach(v => {
      const existing = val[v]
      if (existing)
        existing.numRows++
      else
        val[v] = { value: v, label: v, numRows: 1 }
    })
  })
  return { ...c, val, values: values(val) }
}

export const tableMd = <T extends TableMd,>(table: T, rows: any[] | null = null): TableMdRun<T> =>
  mapValues(table, (c, name: string) => colMd({ ...c, name }, rows))