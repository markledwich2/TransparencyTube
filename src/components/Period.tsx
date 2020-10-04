import { format, parseISO } from 'date-fns'
import React from 'react'
import { map, pipe } from 'remeda'
import { sortBy } from '../common/Pipe'
import { ViewsIndexes } from '../common/RecfluenceApi'
import { dateFormat } from '../common/Utils'
import { InlineSelect } from './InlineSelect'

export const daysTillLabel = (p: string, days: number) =>
  `${days > 1 ? `${days} days till ` : ''}${dateFormat(p)}`

export const labelFuncs = {
  d: daysTillLabel,
  m: (p: string) => `${format(parseISO(p), 'yyyy MMM')}`,
  y: (p: string) => `${format(parseISO(p), 'yyyy')}`
}

export const periodLabel = (type: string, period: string) => {
  const dReg = /d([\d]+)/.exec(type)
  if (dReg?.length) return labelFuncs.d(period, parseInt(dReg[1]))
  const labelF: (p: string) => string = labelFuncs[type]
  if (labelF) return labelF(period)
  return `${type} - ${period}`
}

export const parsePeriod = (s: string) => {
  if (!s) return null
  const p = s.split('|')
  return { periodType: p[0], periodValue: p[1] }
}
export const periodString = (p: StatsPeriod) => `${p.periodType}|${p.periodValue}`
export type StatsPeriod = { periodType: string, periodValue: string }

export const periodOptions = (periods: StatsPeriod[]) => periods ? pipe(
  periods,
  map(k => ({ value: k, label: periodLabel(k.periodType, k.periodValue) })),
  sortBy(o => o.value.periodValue, 'desc')
) : []

interface PeriodSelectProps {
  indexes: ViewsIndexes
  period: StatsPeriod
  onPeriod: (p: StatsPeriod) => void
}
export const PeriodSelect = ({ indexes, period, onPeriod }: PeriodSelectProps) => <InlineSelect
  options={periodOptions(indexes.periods)}
  selected={period}
  onChange={onPeriod}
/>