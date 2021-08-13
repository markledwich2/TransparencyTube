import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { delay } from '../common/Utils'
import { StyleProps } from './Style'

interface RotateContentProps<T> {
  data: T[]
  template: (d: T) => JSX.Element
  getDelay: () => number,
  suspend?: boolean
}

const Container = styled.div`
  .content {
    &.exit {
      animation: shutdown 200ms linear;
      animation-fill-mode: forwards;
    }

    &.off {
      visibility:hidden;
    }

    &.enter {
      animation: shutdown 200ms linear;
      animation-direction: reverse;
    }
  }

  @keyframes 
  shutdown {
    0% { transform: scale3d(1, 1, 1); }
    20% { transform: scale3d(1, 1.2, 1); }
    50% { transform: scale3d(1, 0.005, 1); }
    100% { transform: scale3d(0, 0, 1); }
  }
`

type RotateStatus = 'exit' | 'on' | 'off' | 'enter'
interface RotateState { status: RotateStatus, i: number }

/**
 * Cycles through the given content in a fixed size container
 */
export const RotateContent = <T,>({ data, template, getDelay, suspend, style }: RotateContentProps<T> & StyleProps) => {
  const [s, setState] = useState<RotateState>({ status: 'on', i: 0 })

  useEffect(() => {
    let isRunning = true;
    (async () => {
      var cs = { ...s }
      const setCs = async (newCs: RotateState, ms: number = 200) => {
        await delay(ms)
        if (!suspend)
          setState(newCs)
        return newCs
      }

      const stateLoop = {
        on: () => setCs({ ...cs, status: 'exit' }, getDelay()),
        exit: () => setCs({ i: (cs.i + 1) % data.length, status: 'off' }),
        off: () => setCs({ ...cs, status: 'enter' }, 50),
        enter: () => setCs({ ...cs, status: 'on' })
      }

      while (true) {
        if (!isRunning || (data.length <= 1 && cs.status == 'on')) return
        cs = await stateLoop[cs.status]()
      }
    })()
    return () => { isRunning = false }
  }, [data, suspend])

  const d = data?.[s.i % data.length]
  const dPreload = data?.[(s.i + 1) % data.length]
  //width: size.w, height: size.h, overflow: 'hidden',
  return <Container style={{ ...style }}>
    {d && <div className={`content ${s.status}`}>{template(d)}</div>}
    {dPreload && <div style={{ display: 'none' }}>{template(dPreload)}</div>}
  </Container>
}