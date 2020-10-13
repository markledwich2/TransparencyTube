import styled from 'styled-components'
import React, { useState, useEffect, useRef, FunctionComponent, PropsWithChildren, CSSProperties } from 'react'
import { ChevronDownOutline } from '@styled-icons/evaicons-outline'
import { jsonEquals } from '../common/Utils'


const OuterStyle = styled.span`
  display:inline-block;
  position:relative;
`

const InlineStyle = styled.span`
  margin:0 0.3em;
  padding:0.2em 0.1em 0.2em 0.4em;
  border-radius: 5px;
  background-color: var(--bg2);
  :hover {
    cursor: pointer;
    background-color: var(--bg3);
  }
`

export const PopupStyle = styled.div`
    background-color: var(--bg);
    position: absolute;
    padding:0;
    line-height:2em;
    border: solid 1px var(--bg2);
    z-index:10;
    overflow-y: auto;
    max-height: 50vh;
    max-width: 95vw;
`

const ChevIcon = styled(ChevronDownOutline)`
      height: 1.2em;
      position: relative;
      top: -0.05em;
`

export const keepInView = (e: HTMLElement) => {
  if (!e) return
  e.style.visibility = 'visible' // needs to be visible ot measure. But no jiggle if we do this in the effect
  const br = e.getBoundingClientRect()
  const bod = document.body
  // firefox doesn't have visualViewport
  const view = window.visualViewport ? window.visualViewport : { offsetLeft: bod.scrollLeft, width: bod.clientWidth }
  const overflowX = br.right - view.offsetLeft - view.width
  if (overflowX > 0) {
    e.style.left = `${e.clientLeft - overflowX}px`
  }
}

interface InlineFormOptions<T> {
  value: T
  onChange?: (v: T) => void
  inlineRender?: (v: T) => JSX.Element
  popupStyle?: CSSProperties
  keepOpenOnChange?: boolean
}

export const InlineForm = <T,>({ value, inlineRender, children, popupStyle, keepOpenOnChange }: PropsWithChildren<InlineFormOptions<T>>) => {
  const [open, setOpen] = useState<T>(null)
  const popupRef = useRef<HTMLDivElement>()


  const handleClick = ({ target }) => {
    if (popupRef.current?.contains(target)) return
    setOpen(null)
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    keepInView(popupRef.current)
  })

  return <OuterStyle>
    <InlineStyle onClick={e => {
      if (!open) setOpen(value)
    }}>
      {inlineRender ? inlineRender(value) : value?.toString()}
      <ChevIcon />
    </InlineStyle>
    {open && (keepOpenOnChange || jsonEquals(open, value)) && <PopupStyle ref={popupRef}
      style={{ ...popupStyle, visibility: 'hidden' }} className="inline-form">
      {children}
    </PopupStyle>}
  </OuterStyle>
}
