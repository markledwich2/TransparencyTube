import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { delay } from '../common/Utils'
import { StyleProps } from './Layout'

interface RotateContentProps<T> {
  size: { w: number, h: number }
  data: T[]
  template: (d: T) => JSX.Element
  getDelay: () => number
}

const Container = styled.div`
  .content {
    &.exit {
      animation: shutdown 400ms linear;
      animation-fill-mode: forwards;
    }

    &.off {
      visibility:hidden;
    }

    &.enter {
      animation: shutdown 400ms linear;
      animation-direction: reverse;
    }
  }

  @keyframes 
  shutdown {
    0% {
      transform: scale3d(1, 1, 1);
    }
    20% {
      transform: scale3d(1, 1.2, 1);
    }
    50% {
      transform: scale3d(1, 0.005, 1);
    }
    100% {
      transform: scale3d(0, 0, 1);
    }
  }
`

type RotateStatus = 'exit' | 'on' | 'off' | 'enter'
interface RotateState { status: RotateStatus, i: number }

/**
 * Cycles through the given content in a fixed size container
 */
export const RotateContent = <T,>({ size, data, template, getDelay, style }: RotateContentProps<T> & StyleProps) => {
  const [s, setState] = useState<RotateState>({ status: 'off', i: 0 })

  useEffect(() => {
    let isRunning = true;
    (async () => {
      var cs = { ...s }
      const setCs = (newCs: RotateState) => {
        setState(newCs)
        return newCs
      }
      while (true) {
        if (!isRunning) return
        switch (cs.status) {
          case 'on': {
            await delay(getDelay())
            cs = setCs({ ...cs, status: 'exit' })
          }
          case 'exit': {
            await delay(400)
            cs = setCs({ i: (cs.i + 1) % data.length, status: 'off' })
          }
          case 'off': {
            await delay(100)
            cs = setCs({ ...cs, status: 'enter' })
          }
          case 'enter': {
            await delay(400)
            cs = setCs({ ...cs, status: 'on' })
          }
        }
      }
    })()
    return () => isRunning = false
  }, [])

  const d = data[s.i]
  return <Container style={{ width: size.w, height: size.h, overflow: 'hidden', ...style }}>
    <div className={`content ${s.status}`}>{template(d)}</div>
  </Container>
}