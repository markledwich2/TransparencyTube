import React from 'react'
import ReactTooltip from 'react-tooltip'
import styled from 'styled-components'

const TipStyle = styled.div`
  .tip {
    opacity:1;
    padding:1em;
    font-size:1rem;
    background-color: var(--bg);
    color: var(--fg);
    border-color: var(--bg2);
    border-radius: 10px;
    max-width: 90vw;
  }
`
type GetContentFunc = (toolTipStr: string) => React.ReactNode

interface TipProps {
  id: string
  getContent: GetContentFunc
}

export const Tip = ({ id, getContent }: TipProps) => <TipStyle>
  <ReactTooltip
    id={id}
    effect='solid'
    border
    className='tip'
    borderColor='var(--bg2)'
    getContent={getContent}
    globalEventOff='click'
  />
</TipStyle>