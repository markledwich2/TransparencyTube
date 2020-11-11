
import React, { useEffect, useState } from 'react'
import { DateRangePicker, DateRangeProps } from 'react-date-range'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { first } from 'remeda'
import styled from 'styled-components'
import { dateFormat, useDebounce } from '../common/Utils'
import { InlineForm } from '../components/InlineForm'
import { StyleProps } from './Layout'

export interface DateRangeValue {
  startDate: Date
  endDate: Date
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

export const InlineDateRange = ({ onClose, onChange, range, style, className, ...dateRageProps }: DateRangeProps & { range: DateRangeValue, onClose?: () => void } & StyleProps) => {
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
    value={currentRange}
    inlineRender={r => r ? <span>{dateFormat(r.startDate)} - {dateFormat(r.endDate)}</span> : <></>}
    keepOpenOnChange={true}
    onClose={() => onClose?.()}
  >
    <DateRangeStyle>
      <DateRangePicker
        {...dateRageProps}
        ranges={[currentRange]}
        direction='vertical'
        scroll={{ enabled: true }}
        months={3}
        onChange={v => {
          const r = (v as { range1: DateRangeValue }).range1
          setOpenValue(r)
          onChange?.(currentRange)
        }}  // date-range control has poor typings 💢
      /></DateRangeStyle>
  </InlineForm>
}