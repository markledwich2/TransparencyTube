import React, { PropsWithChildren, useCallback, useRef, useState } from 'react'
import { StyleProps, styles } from './Style'
import { usePopper } from 'react-popper'
import styled from 'styled-components'
import { useClickOutside } from '../common/Clicks'
import { isMobile } from "react-device-detect"

interface TipState {
  open: boolean,
  target?: EventTarget & Element,
}

export interface UseTip<T> {
  tipProps: TipState & { data?: T, setTip: (state: TipState) => void }
  showTip: (target: EventTarget & Element, data?: T) => void
  hideTip: () => void
  /**
   * Returns attributes to add to data elements that respond to mouse events to create tooltips
   */
  eventProps: (data: T) => {
    onMouseEnter: (e: React.MouseEvent<Element, MouseEvent>) => void
    onMouseLeave: (e: React.MouseEvent<Element, MouseEvent>) => void
  }
  setTip: (state: TipState) => void
  data: T
}

export const useTip = <T,>(): UseTip<T> => {
  const [tip, setTip] = useState<TipState & { data?: T }>({ open: false, target: null })
  const showTip = (target: EventTarget & Element, data?: T) => { setTip({ target, data, open: true }) }
  const hideTip = () => { setTip({ target: null, data: null, open: false }) }

  const eventProps = (data: T, touchShows = false) => ({
    onMouseEnter: (e: React.MouseEvent<Element, MouseEvent>) => {
      if (isMobile && !touchShows) return false
      showTip(e.currentTarget, data)
    },
    onMouseLeave: () => { hideTip() },
  })

  return { tipProps: { ...tip, setTip }, showTip, hideTip, eventProps: eventProps, data: tip.data, setTip }
}

const TipStyle = styled.div`
    z-index:1;

  .arrow, .arrow::before {
    position: absolute;
    width: 8px;
    height: 8px;
    z-index: -10;
  }

  .arrow::before {
    content: '';
    transform: rotate(45deg);
    background: var(--bg3);
  }

  &[data-popper-placement^='top'] > .arrow { bottom: -4px; }
  &[data-popper-placement^='bottom'] > .arrow { top: -4px; }
  &[data-popper-placement^='left'] > .arrow { right: -4px; }
  &[data-popper-placement^='right'] > .arrow { left: -4px; }
`

export const Tip = ({ style, children, target, open, setTip }: PropsWithChildren<StyleProps & TipState & { setTip: (state: TipState) => void }>) => {
  const popperEl = useRef()
  const [arrowRef, setArrowRef] = useState(null)
  //const close = useCallback(() => setTip({ open: false }), [setTip])
  //useClickOutside(popperEl, close)

  const { styles: tipStyle, attributes } = usePopper(target, popperEl.current, {
    placement: 'auto',
    modifiers: [
      { name: 'arrow', options: { element: arrowRef, padding: 5 } },
      { name: "offset", options: { offset: [0, 5] } }
    ],
  })

  return <TipStyle ref={popperEl} style={{ ...tipStyle.popper, display: open ? 'initial' : 'none' }} {...attributes.popper}>
    <div ref={setArrowRef} style={tipStyle.arrow} className="arrow" />
    <div style={{ ...styles.tip, ...style }}>{children}</div>
  </TipStyle>
}
