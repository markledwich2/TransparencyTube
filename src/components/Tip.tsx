import React, { PropsWithChildren, useRef, useState } from 'react'
import { StyleProps, styles } from '../components/Layout'
import { usePopper } from 'react-popper'
import { pick } from 'remeda'
import styled from 'styled-components'

interface TipState {
  open: boolean,
  target?: EventTarget & Element,
}


export interface UseTip<T> {
  tipProps: Pick<TipState & {
    data?: T
  }, "target" | "open">
  showTip: (target: EventTarget & Element, data?: T) => void
  hideTip: () => void
  /**
   * Returns attributes to add to data elements that respond to mouse events to create tooltips
   */
  attributes: (data: T) => {
    onMouseEnter: (e: React.MouseEvent<Element, MouseEvent>) => void
    onMouseLeave: (e: React.MouseEvent<Element, MouseEvent>) => void
  }
  data: T
}

export const useTip = <T,>(): UseTip<T> => {
  const [tip, setTip] = useState<TipState & { data?: T }>({ open: false, target: null })
  const showTip = (target: EventTarget & Element, data?: T) => { setTip({ target, data, open: true }) }
  const hideTip = () => { setTip({ target: null, data: null, open: false }) }

  const getTargetProps = (data: T) => ({
    onMouseEnter: (e: React.MouseEvent<Element, MouseEvent>) => { showTip(e.currentTarget, data) },
    onMouseLeave: (e: React.MouseEvent<Element, MouseEvent>) => { hideTip() }
  })

  return { tipProps: pick(tip, ['target', 'open']), showTip, hideTip, attributes: getTargetProps, data: tip.data }
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
    background: var(--bg1);
  }

  &[data-popper-placement^='top'] > .arrow {
    bottom: -4px;
  }

  &[data-popper-placement^='bottom'] > .arrow {
    top: -4px;
  }

  &[data-popper-placement^='left'] > .arrow {
    right: -4px;
  }

  &[data-popper-placement^='right'] > .arrow {
    left: -4px;
  }
`

export const Tip = ({ style, children, target, open }: PropsWithChildren<StyleProps & TipState>) => {
  const popperEl = useRef()
  const [arrowRef, setArrowRef] = useState(null)
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
