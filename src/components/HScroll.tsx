import React, { useEffect, useMemo, useRef, useState, FunctionComponent as FC } from 'react'
import styled from 'styled-components'
import useDraggable from '../common/DragScroll'
import { ChevronRightOutline } from '@styled-icons/evaicons-outline'
import { StyleProps } from './Style'

export const HScroll: FC<{ onClick?: () => void, showScrollButton?: boolean } & StyleProps> =
  ({ onClick, children, showScrollButton, style, className }) => {
    const { ref: dragRef, isDragging } = useDraggable([1], onClick)
    return <TopStyle>
      <div ref={dragRef}
        className={`scroll-container ${className}`}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', ...style }}>
        {children}
        {showScrollButton && <div className='scroll-button' onClick={_Readable => {
          const div = dragRef.current
          div.scrollBy({ left: div.clientWidth - 10, top: 0, behavior: 'smooth' })
        }}>
          <ChevronRightOutline style={{ width: '30px', height: '30px' }} />
        </div>}
      </div>
    </TopStyle>
  }

const TopStyle = styled.div`
  /* so that button position can be absolute inside these bounds */
  position: relative; 
  .scroll-container {
    overflow-x: auto;
  }
  .scroll-button {
    position: absolute;
    top: 0px;
    right: 0px;
    height: 100%;
    display: flex;
    align-items: center;
    background: var(--bg);
    opacity: 0.5;
    cursor: pointer;
    &:hover {
      opacity: 0.8;
    }
  }
`



