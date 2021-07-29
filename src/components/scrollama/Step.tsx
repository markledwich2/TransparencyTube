import React, { useState, useMemo, useCallback, useRef, useEffect, cloneElement, ReactNode, Children, PropsWithChildren, ReactChild, FunctionComponentElement } from 'react'
import { useInView } from 'react-intersection-observer'
import { ScollamaPropsShared, ScrollamaProps } from './Scrollama'

const useRootMargin = offset => `-${offset * 100}% 0px -${100 - offset * 100}% 0px`

const useProgressRootMargin = (direction, offset, node, innerHeight) => {
  if (!node.current) return '0px'
  const offsetHeight = (node.current.offsetHeight / innerHeight)
  if (direction === 'down') return `${(offsetHeight - offset) * 100}% 0px ${(offset * 100) - 100}% 0px`
  return `-${offset * 100}% 0px ${(offsetHeight * 100) - (100 - (offset * 100))}% 0px`
}

interface StepProps<T> extends ScollamaPropsShared<T> {
  data: T
  scrollamaId?: string
  innerHeight?: number
  handleSetLastScrollTop?: any
  lastScrollTop?: number
  progressThreshold?: any
  offset?: number
}

export const Step = <T,>(props: PropsWithChildren<StepProps<T>>) => {
  const { children, data, handleSetLastScrollTop, lastScrollTop, onStepEnter, onStepExit, onStepProgress,
    offset, scrollamaId, progressThreshold, innerHeight } = {
    onStepProgress: null,
    onStepEnter: () => { },
    onStepExit: () => { },
    offset: 0.3,
    handleSetLastScrollTop: () => { }
    , ...props
  }

  const scrollTop = document.documentElement.scrollTop
  const direction = lastScrollTop < scrollTop ? 'down' : 'up'
  const rootMargin = useRootMargin(offset)
  const ref = useRef(null)
  const [isIntersecting, setIsIntersecting] = useState(false)

  const { ref: inViewRef, entry } = useInView({
    rootMargin,
    threshold: 0,
  })

  const progressRootMargin = useMemo(
    () => useProgressRootMargin(direction, offset, ref, innerHeight),
    [direction, offset, ref, innerHeight]
  )

  const { ref: scrollProgressRef, entry: scrollProgressEntry } = useInView({
    rootMargin: progressRootMargin,
    threshold: progressThreshold,
  })

  const setRefs = useCallback(
    (node) => {
      ref.current = node
      inViewRef(node)
      scrollProgressRef(node)
    },
    [inViewRef, scrollProgressRef],
  )


  useEffect(() => {
    if (isIntersecting) {
      const { height, top } = scrollProgressEntry.target.getBoundingClientRect()
      const progress = Math.min(1, Math.max(0, (window.innerHeight * offset - top) / height))
      onStepProgress &&
        onStepProgress({
          progress,
          scrollamaId,
          data,
          element: scrollProgressEntry.target,
          entry: scrollProgressEntry,
          direction,
        })
    }
  }, [scrollProgressEntry])

  useEffect(() => {
    if (entry && !entry.isIntersecting && isIntersecting) {
      onStepExit({ element: entry.target, scrollamaId, data, entry, direction })
      setIsIntersecting(false)
      handleSetLastScrollTop(scrollTop)
    } else if (entry && entry.isIntersecting && !isIntersecting) {
      setIsIntersecting(true)
      onStepEnter({ element: entry.target, scrollamaId, data, entry, direction })
      handleSetLastScrollTop(scrollTop)
    }
  }, [entry])

  const child = Children.only(children) as FunctionComponentElement<StepChildProps>
  return cloneElement(child, {
    'data-react-scrollama-id': scrollamaId,
    ref: setRefs,
    entry,
  })
}

interface StepChildProps { scrollamaId: string, entry?: IntersectionObserverEntry, 'data-react-scrollama-id'?: string, ref: (node: any) => void }

