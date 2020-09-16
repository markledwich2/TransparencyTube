import styled from 'styled-components'
import React, { useState, useEffect, useRef } from 'react'
import { ChevronDownOutline } from '@styled-icons/evaicons-outline'

interface Option<T> {
  label: string
  value: T
}

interface InlineSelectOptions<T> {
  options: Option<T>[]
  defaultValue: T
  onChange?: (o: T) => void
}

const OuterStyle = styled.span`
  display:inline-block;
  position:relative;
`

const InlineStyle = styled.span`
  :hover {
    cursor: pointer
  }
`

const PopupStyle = styled.div`
    position: absolute;
    padding:0;
    line-height:2.5em;
    border: solid 1px var(--bg2);

    ul {
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
    }
`

const ChevIcon = styled(ChevronDownOutline)`
      height: 1.2em;
      position: relative;
      top: -0.05em;
`

export function InlineSelect<T>({ options, defaultValue, onChange }: InlineSelectOptions<T>) {
  const [value, setValue] = useState<T>(defaultValue)
  const [open, setOpen] = useState(false)

  const popupRef = useRef<HTMLDivElement>()

  const handleClick = ({ target }) => {
    if (popupRef.current?.contains(target)) return
    setOpen(false)
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return <OuterStyle>
    <InlineStyle onClick={e => {
      if (!open) setOpen(true)
    }}>
      {options.find(o => o.value == value)?.label}<ChevIcon />
    </InlineStyle>
    {open && <PopupStyle ref={popupRef}>
      <ul>
        {options.map(o => <li
          className={o.value == value ? 'selected' : null}
          onClick={_ => {
            setValue(o.value)
            setOpen(false)
            onChange && onChange(o.value)
          }}>{o.label}</li>)}
      </ul>
    </PopupStyle>}
  </OuterStyle>
}

