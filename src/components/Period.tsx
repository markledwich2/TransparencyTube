import { format, parseISO, getYear } from 'date-fns'
import React from 'react'
import { compact, groupBy, map, pipe } from 'remeda'
import { entries, orderBy, values } from '../common/Pipe'
import { dateFormat } from '../common/Utils'
import { InlineForm } from './InlineForm'
import { Opt, OptionList } from './InlineSelect'
import { FlexRow } from './Layout'
import numeral from 'numeral'

export type StatsPeriod = { periodType: string, periodValue: string }

type FormatMode = 'menu' | 'inline'

const groupFormat = {
  d: (p: string, mode: FormatMode, days: number) => {
    const date = dateFormat(p)
    return mode == 'menu' ?
      `${days > 1 ? ` ${days} days to` : date}` :
      `${days > 1 ? ` ${days} days to ${date}` : date}`
  }
  ,
  m: (p: string, mode: FormatMode) => `${format(parseISO(p), mode == 'inline' ? 'MMM yyyy' : 'MMM')}`,
  y: (p: string, mode: FormatMode) => `${format(parseISO(p), 'yyyy')}`
}

type PeriodOption = Opt<StatsPeriod> & { group: string, parent: StatsPeriod, daysTill: number, date: string }
const periodOption = (p: StatsPeriod) => {
  const type = p.periodType
  const date = p.periodValue
  const dReg = /d([\d]+)/.exec(type)
  const group = dReg ? 'd' : 'my'
  const daysTill = group == 'd' ? parseInt(dReg[1]) : null

  let parent: StatsPeriod = null
  if (group == 'd' && type != 'd1')
    parent = { periodType: 'd', periodValue: date }
  else if (type == 'm')
    parent = { periodType: 'y', periodValue: `${getYear(parseISO(date))}-01-01` }

  const option: PeriodOption = { value: p, group, daysTill, parent, date }
  return { ...option, label: periodLabel(option, 'menu') }
}

const periodLabel = (p: PeriodOption, mode: FormatMode) => {
  const { group, date, daysTill, value } = p
  const label = group == 'd' ?
    groupFormat.d(date, mode, daysTill) :
    groupFormat[value.periodType]?.(date, mode) ?? periodString(value)
  return label
}

export const parsePeriod = (s: string) => {
  if (!s) return null
  const p = s.split('|')
  return { periodType: p[0], periodValue: p[1] }
}

export const periodString = (p: StatsPeriod) => `${p.periodType}|${p.periodValue}`

interface PeriodSelectProps {
  periods: StatsPeriod[]
  period: StatsPeriod
  onPeriod?: (p: StatsPeriod) => void
}
export const PeriodSelect = ({ periods, period, onPeriod }: PeriodSelectProps) => {
  const periodGroups = pipe(periods,
    map(p => periodOption(p)),
    orderBy([p => p.parent?.periodValue ?? p.value.periodValue, p => p.parent ? 1 : -1, p => p.value.periodValue, p => p.daysTill ? numeral(p.daysTill).format('####') : 0]
      , ['desc', 'asc', 'desc', 'asc']),
    groupBy(p => p.group)
  )

  return <InlineForm value={period} inlineRender={p => p ? periodLabel(periodOption(p), 'inline') : ''}>
    <FlexRow style={{ fontSize: '1rem' }}>
      {entries(periodGroups).map((e) => {
        const [group, options] = e
        return <OptionList key={group}
          options={options}
          onChange={p => onPeriod(p.value)}
          itemRender={p => <div style={{ paddingLeft: p.parent ? '1em' : null }}>{p.label}</div>} />
      })}
    </FlexRow>
  </InlineForm>
}
