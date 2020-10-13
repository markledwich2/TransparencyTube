import styled from 'styled-components'
import React, { useState, useEffect, useRef, CSSProperties } from 'react'
import { jsonEquals } from '../common/Utils'
import { InlineForm } from './InlineForm'
import { StyleProps } from './Layout'

export const UlStyled = styled.ul`
  list-style-type: none;

  li {
    padding:0em 1em;
    cursor:pointer;
    &.selected {
      background-color: var(--bg1);
    }
    :hover, &.focused {
      background-color: var(--bg2);
    }
  }
`
export interface Opt<T> {
  label?: string
  value: T
}

export interface SelectOptions<TVal, TOpt extends Opt<TVal>> {
  options: TOpt[]
  selected?: TVal
  onChange?: (o: TVal) => void
  inlineRender?: (o: TVal) => JSX.Element
  itemRender?: (o: TOpt) => JSX.Element
  listStyle?: CSSProperties
}

export function InlineSelect<TVal, TOpt extends Opt<TVal>>({ options, selected, onChange, inlineRender, itemRender, listStyle }: SelectOptions<TVal, TOpt>) {
  const el = (o: TVal) => <>{options?.find(o => jsonEquals(o.value, selected))?.label}</>
  return <InlineForm<TVal> {...{ value: selected, onChange }} inlineRender={inlineRender ?? el} >
    <OptionList style={listStyle} {...{ options, selected: [selected], itemRender }} onChange={o => onChange(o.value)} />
  </InlineForm>
}

export interface OptionListProps<TVal, TOpt extends Opt<TVal>> extends StyleProps {
  options: TOpt[]
  onChange?: (o: TOpt) => void
  itemRender?: (o: TOpt) => JSX.Element
}

export const OptionList = <TVal, TOpt extends Opt<TVal> & { selected?: boolean }>(
  { options, onChange, itemRender, style, className }: OptionListProps<TVal, TOpt>) => {
  return <UlStyled style={style} className={className}>
    {options.map(o => <li
      key={JSON.stringify(o.value)}
      className={o.selected ? 'selected' : null}
      onClick={_ => {
        onChange && onChange({ ...o, selected: !o.selected })
      }}>{itemRender ? itemRender(o) : o.label}</li>)}
  </UlStyled>
}