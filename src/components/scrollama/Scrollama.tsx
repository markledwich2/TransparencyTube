import React, { useState, useEffect, useRef, CSSProperties, FunctionComponent as FC, PropsWithChildren, useMemo, Children } from 'react'

export interface OnStepProps<T> {
  element?: Element
  data: T
  direction?: 'up' | 'down'
  entry?: any
  scrollamaId?: string
  progress?: number
}

export interface ScrollamaProps<T> extends ScollamaPropsShared<T> {
  children: React.ReactElement[],
  threshold?: number,
  offset?: number | string,
}

export interface ScollamaPropsShared<T> {
  debug?: boolean
  onStepEnter?: (state: OnStepProps<T>) => void,
  onStepExit?: (state: OnStepProps<T>) => void,
  onStepProgress?: (state: OnStepProps<T> & { progress: number }) => void,
}

const defaultProps = {
  offset: 0.7,
  onStepProgress: null,
  onStepEnter: () => { },
  onStepExit: () => { },
  threshold: 4,
}

const createThreshold = (theta, height) => {
  const count = Math.ceil(height / theta)
  const t = []
  const ratio = 1 / count
  for (let i = 0; i <= count; i += 1) {
    t.push(i * ratio)
  }
  return t
}

const isOffsetInPixels = offset => typeof offset == 'string' && offset.includes('px')

export const Scrollama = <T,>(props: ScrollamaProps<T>) => {
  const { children, offset, onStepEnter, onStepExit, onStepProgress, threshold } = { ...defaultProps, ...props }
  const isOffsetDefinedInPixels = isOffsetInPixels(offset)
  const [lastScrollTop, setLastScrollTop] = useState(0)
  const [windowInnerHeight, setWindowInnerHeight] = useState(null)

  const handleSetLastScrollTop = (scrollTop) => { setLastScrollTop(scrollTop) }
  const handleWindowResize = (e) => { setWindowInnerHeight(window.innerHeight) }

  useEffect(() => {
    if (isOffsetDefinedInPixels) {
      window.addEventListener('resize', handleWindowResize)
      return () => {
        window.removeEventListener('resize', handleWindowResize)
      }
    }
  }, [])


  const innerHeight = (windowInnerHeight || window.innerHeight)
  const offsetValue = isOffsetDefinedInPixels ? (+(offset as string).replace('px', '') / innerHeight) : offset
  const progressThreshold = useMemo(() => createThreshold(threshold, innerHeight), [innerHeight])

  return <>
    {Children.map(children, (child, i) => React.cloneElement(child, {
      scrollamaId: `react-scrollama-${i}`,
      offset: offsetValue,
      onStepEnter,
      onStepExit,
      onStepProgress,
      lastScrollTop,
      handleSetLastScrollTop,
      progressThreshold,
      innerHeight
    }))}
  </>
}

export default Scrollama