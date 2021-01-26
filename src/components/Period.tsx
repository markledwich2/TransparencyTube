import { format, parseISO, getYear } from 'date-fns'
import React from 'react'
import { compact, first, groupBy, map, pipe } from 'remeda'
import { entries, orderBy, values } from '../common/Pipe'
import { dateFormat } from '../common/Utils'
import { InlineForm } from './InlineForm'
import { OptionList } from './InlineSelect'
import { FlexRow } from './Layout'
import numeral from 'numeral'
import { Opt } from '../common/Metadata'

export type Period = { type: string | 'd' | 'm' | 'y', value: string }
export type HasPeriod = { period: string }

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

type PeriodOption = Opt<Period> & { group: string, parent?: Period, daysTill?: number, date?: string }
const periodOption = (p: Period): PeriodOption => {
  if (!p.value) return { label: 'All', value: { type: null, value: null }, group: '_' }

  const dReg = /d([\d]+)/.exec(p.type)
  const group = dReg ? 'd' : 'my'
  const daysTill = group == 'd' ? parseInt(dReg[1]) : null

  let parent: Period = null
  if (group == 'd' && p.type != 'd1')
    parent = { type: 'd', value: p.value }
  else if (p.type == 'm')
    parent = { type: 'y', value: `${getYear(parseISO(p.value))}` }

  const option: PeriodOption = { value: p, group, daysTill, parent, date: p.value }
  return { ...option, label: periodLabel(option, 'menu') }
}

const periodLabel = (p: PeriodOption, mode: FormatMode) => {
  const { group, date, daysTill, value } = p
  const label = group == 'd' ?
    groupFormat.d(date, mode, daysTill) :
    groupFormat[value.type]?.(date, mode) ?? periodString(value)
  return label
}

export const parsePeriod = (s: string): Period => {
  if (!s) return null
  const p = s.split('|')
  return { type: p[0], value: p[1] }
}

export const periodString = (p: Period) => p ? `${p.type}|${p.value}` : null

interface PeriodSelectProps {
  periods: Period[]
  period?: Period
  onPeriod?: (p: Period) => void
  showAll?: boolean
}
export const PeriodSelect = ({ periods, period, onPeriod, showAll }: PeriodSelectProps) => {
  if (!periods) return <></>

  if (showAll)
    periods.push({ type: null, value: null })

  const periodGroups = pipe(periods,
    map(p => periodOption(p)),
    orderBy([p => p.parent?.value ?? p.value.value, p => p.parent ? 1 : -1, p => p.value.value, p => p.daysTill ? numeral(p.daysTill).format('####') : 0]
      , ['desc', 'asc', 'desc', 'asc']),
    groupBy(p => p.group)
  )

  return <InlineForm value={period} inlineRender={p => p ? periodLabel(periodOption(p), 'inline') : 'All'}>
    <FlexRow style={{ fontSize: '1rem' }}>
      {entries(periodGroups).map((e) => {
        const [group, options] = e

        return <OptionList key={group}
          options={options}
          onChange={p => onPeriod(p.value)}
          itemRender={p => <div style={{ paddingLeft: p.parent ? '1em' : null, whiteSpace: 'nowrap' }}>{p.label}</div>}
        />
      })}
    </FlexRow>
  </InlineForm>
}

export const periodIncludes = (p: Period, ts: string) => !p || ts.startsWith(p.value)