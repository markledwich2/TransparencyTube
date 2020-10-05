import styled from 'styled-components'
import React, { useState, useEffect, useRef, CSSProperties } from 'react'
import { jsonEquals } from '../common/Utils'
import { InlineForm } from './InlineForm'
import { StyleProps } from './Layout'

const UlStyled = styled.ul`
  list-style-type: none;

  li {
    padding:0em 1em;
    cursor:pointer;
    white-space:nowrap;
    background-color: var(--bg);
    &.selected {
      background-color: var(--bg1);
    }
    :hover {
      background-color: var(--bg2);
    }
  }
`
export interface Opt<T> {
  label?: string
  value: T
}

export interface SelectOptions<T> {
  options: Opt<T>[]
  selected?: T
  onChange?: (o: T) => void
  inlineElement?: (o: T) => JSX.Element
}

export function InlineSelect<T>({ options, selected, onChange, inlineElement }: SelectOptions<T>) {
  const el = (o: T) => <>{options?.find(o => jsonEquals(o.value, selected))?.label}</>
  return <InlineForm<T> {...{ value: selected, onChange }} inlineElement={inlineElement ?? el} >
    <OptionList {...{ options, selected: [selected] }} onChange={o => onChange(o.value)} />
  </InlineForm>
}

export interface OptionListProps<TValue, TOption extends Opt<TValue>> extends StyleProps {
  options: TOption[]
  onChange?: (o: TOption) => void
  itemElement?: (o: TOption) => JSX.Element
}

export const OptionList = <TValue, TOption extends Opt<TValue> & { selected?: boolean }>(
  { options, onChange, itemElement, style, className }: OptionListProps<TValue, TOption>) => {
  return <UlStyled style={style} className={className}>
    {options.map(o => <li
      key={JSON.stringify(o.value)}
      className={o.selected ? 'selected' : null}
      onClick={_ => {
        onChange && onChange({ ...o, selected: !o.selected })
      }}>{itemElement ? itemElement(o) : o.label}</li>)}
  </UlStyled>
}