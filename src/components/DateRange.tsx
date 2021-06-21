
import { parseISO, addDays, startOfToday, endOfToday, isSameDay, startOfDay, startOfWeek, endOfWeek, endOfDay, startOfMonth, endOfMonth, addMonths, startOfYear, endOfYear, addYears, format } from 'date-fns'
import React, { useEffect, useState } from 'react'
import { DateRangePicker, DateRangeProps, defaultStaticRanges } from 'react-date-range'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { concat, pipe } from 'remeda'
import styled from 'styled-components'
import { dateFormat, useDebounce } from '../common/Utils'
import { InlineForm } from '../components/InlineForm'
import { StyleProps } from './Style'

export interface DateRangeValue {
  start: Date
  end: Date
}

export type DateRangeQueryState<Prefix extends string> = {
  [Property in keyof DateRangeValue as `${Prefix}${Property}`]?: string
}

export const rangeFromQuery = (q: DateRangeQueryState<typeof prefix>, defaultRange: DateRangeValue = null, prefix?: string): DateRangeValue => {
  prefix ??= ''
  const r = {
    start: q[`${prefix}start`] as string,
    end: q[`${prefix}end`] as string
  }

  return {
    start: r.start ? parseISO(r.start) : defaultRange?.start,
    end: r.end ? parseISO(r.end) : defaultRange?.end,
  }
}

export const rangeToQuery = (r: DateRangeValue, prefix?: string): DateRangeQueryState<typeof prefix> => {
  prefix ??= ''
  const res = ({ [`${prefix}start`]: r?.start?.toISOString(), [`${prefix}end`]: r?.end?.toISOString() })
  return res
}

const DateRangeStyle = styled.div`
  .rdrDateRangePickerWrapper, .rdrDateDisplayWrapper, .rdrDefinedRangesWrapper, .rdrStaticRange, .rdrMonths, .rdrMonthAndYearWrapper, .rdrCalendarWrapper  {
    background-color: var(--bg1);
    color: var(--fg1);
  }

  .rdrDateDisplayItem, .rdrDateDisplayItemActive {
    background-color: var(--bg1);
    input {
      color: var(--fg1);
    }
  }

  .rdrNextPrevButton {
    background: var(--bg2);
    &:hover {
      background: var(--bg3);
    }
  }

  .rdrPprevButton i {
      border-color: transparent var(--fg3) transparent transparent !important;
  }

  .rdrNextButton i {
      border-color: transparent transparent transparent var(--fg3) !important;
  }

  .rdrDayToday .rdrDayNumber span:after {
    background: var(--bg-feature);
  }
  

  button.rdrDay .rdrDayNumber span {
    color: var(--fg);
  }

  button.rdrDayPassive .rdrDayNumber span {
    color: var(--fg3);
  }

  .rdrDayDisabled {
    background-color: var(--bg1);
    > span.rdrDayNumber > span { color: var(--bg3); }
  }

  .rdrStaticRange {
    border-bottom: 1px solid var(--bg2);
    background: var(--bg1);


    &:hover, &:focus{
      .rdrStaticRangeLabel{
        background: var(--bg2);
      }
    }
  }

  .rdrStaticRange.rdrStaticRangeSelected span {
      color:var(--fg-feature);
    }

  .rdrDefinedRangesWrapper {
    border-right: solid 1px var(--bg2);
    width:unset;
  }

  .rdrSelected, .rdrInRange, .rdrStartEdge, .rdrEndEdge {
    background: var(--bg-feature);
  }

  .rdrDayStartPreview, .rdrDayInPreview, .rdrDayEndPreview {
    border-color: var(--bg-feature);
  }

  .rdrDateDisplayItemActive {
    border-color: var(--bg);
    background-color: var(--bg2);
  }

  .rdrInputRange {
    display:none;
  }

  .rdrMonthAndYearPickers select {
    color: var(--fg3);
    background-color: var(--bg1);
  }
`

interface InlineDateRangeProps extends StyleProps {
  range: DateRangeValue,
  inputRange?: DateRangeValue,
  onClose?: () => void
  onChange?: (r: DateRangeValue) => void
}

const staticRangeHandler = {
  range: {},
  isSelected(range) {
    const definedRange = this.range()
    return (
      isSameDay(range.startDate, definedRange.startDate) &&
      isSameDay(range.endDate, definedRange.endDate)
    )
  },
}

export const createStaticRanges = (ranges: { label: string, range: PickerRange }[]) => ranges.filter(r => r.range).map(r => ({ ...staticRangeHandler, range: () => r.range, label: r.label }))

const dates = {
  //yearStart: { 0:startOfYear(new Date()), 1:startOfYear(addYears(new Date(), -1)), 2:startOfYear(addYears(new Date(), -2))},
  startOfWeek: startOfWeek(new Date()),
  endOfWeek: endOfWeek(new Date()),
  startOfLastWeek: startOfWeek(addDays(new Date(), -7)),
  endOfLastWeek: endOfWeek(addDays(new Date(), -7)),
  startOfToday: startOfDay(new Date()),
  endOfToday: endOfDay(new Date()),
  startOfYesterday: startOfDay(addDays(new Date(), -1)),
  endOfYesterday: endOfDay(addDays(new Date(), -1)),
  startOfMonth: startOfMonth(new Date()),
  endOfMonth: endOfMonth(new Date()),
  startOfLastMonth: startOfMonth(addMonths(new Date(), -1)),
  endOfLastMonth: endOfMonth(addMonths(new Date(), -1)),
}

export const inRange = <T,>(v: T, range: { start: T, end: T }) => v >= range.start && v <= range.end

const ranges = (inputRange: DateRangeValue) => createStaticRanges(pipe(
  [{
    label: 'All',
    range: (inputRange?.start && inputRange?.end) ? toPickerRange(inputRange) : null
  }],
  concat([...Array(4).keys()].map(y => {
    const d = startOfYear(addYears(new Date(), -y))
    return ({
      label: format(d, 'yyyy'),
      range: {
        startDate: d,
        endDate: endOfYear(d),
      }
    })
  })),
  concat([30, 60, 90, 120].map(d => ({
    label: `Last ${d} days`,
    range: {
      startDate: addDays(dates.endOfToday, -d),
      endDate: dates.endOfToday,
    }
  })))
).filter(r => r.range && (inRange(r.range.startDate, inputRange) || inRange(r.range.endDate, inputRange))))

export const InlineDateRange = ({ onClose, onChange, range, inputRange, style, className, ...dateRageProps }: InlineDateRangeProps) => {
  const [openValue, setOpenValue] = useState<DateRangeValue>(null)
  const currentRange = openValue ?? range
  const debounceRange = useDebounce(currentRange, 300)

  useEffect(
    () => {
      onChange(debounceRange)
    },
    [JSON.stringify(debounceRange)]
  )

  return <InlineForm
    style={style}
    value={toPickerRange(currentRange)}
    inlineRender={r => r ? <span>{dateFormat(r.startDate)} - {dateFormat(r.endDate)}</span> : <></>}
    keepOpenOnChange={true}
    onClose={() => onClose?.()}
  >
    <DateRangeStyle>
      <DateRangePicker
        {...dateRageProps}
        ranges={[toPickerRange(currentRange)]}
        minDate={inputRange?.start}
        maxDate={inputRange?.end}
        direction='vertical'
        scroll={{ enabled: true }}
        showMonthAndYearPickers
        staticRanges={ranges(inputRange)}
        months={3}
        onChange={v => {
          const r = (v as { range1: PickerRange }).range1
          setOpenValue(fromPickerRange(r))
          onChange?.(currentRange)
        }}  // date-range control has poor typings 💢
      /></DateRangeStyle>
  </InlineForm>
}

interface PickerRange { startDate: Date, endDate: Date }
const toPickerRange = (d: DateRangeValue): PickerRange => ({ startDate: d?.start, endDate: d?.end })
const fromPickerRange = (d: PickerRange): DateRangeValue => ({ start: d?.startDate, end: d?.endDate })