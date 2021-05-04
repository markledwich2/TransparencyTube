import {
  SimulationNodeDatum, scaleTime, extent, forceSimulation, forceX, forceY, forceCollide, ScaleTime
} from 'd3'
import React, { FunctionComponent as FC, useCallback, useEffect, useMemo, useState } from 'react'
import { compact, groupBy, indexBy } from 'remeda'
import styled from 'styled-components'
import { max, minMax } from '../common/Pipe'
import { UseTip } from '../components/Tip'
import { scaleUtc } from '@visx/visx'
import fns, { addDays, addMonths, differenceInDays, eachMonthOfInterval, endOfMonth, startOfMonth } from 'date-fns'
import { assign, dateFormat, delay, simpleHash } from '../common/Utils'
import { Spinner } from './Spinner'
import { circleToRect, getBounds, offsetTransform } from '../common/Draw'

export interface BeehiveNode<T> {
  id: string
  data: T
  value: number
  date: Date
  color?: string
  img?: string
  selected?: boolean
}

type ForceNode = SimulationNodeDatum & { id: string, r: number, cx?: number, cy?: number }

export const BeeChart = <T,>({ nodes, animate, onSelect, ...props }: {
  nodes: BeehiveNode<T>[]
  w: number
  tip: UseTip<any>
  onSelect: (data: T) => void
  animate?: boolean
  bubbleSize?: number
}) => {

  var ticks = 200

  var nodesById = useMemo(() => nodes && indexBy(nodes, n => n.id), [nodes])

  var { fNodes, axis, sim, bubbleBounds } = useMemo(() => {
    if (!nodes) return { fNodes: null, axis: null, sim: null }
    console.log('BeeHive - layout')

    const dayRange = minMax(nodes.map(v => v.date.valueOf()))
    const days = differenceInDays(dayRange[1], dayRange[0])
    const w = max([props.w - 20, days * 4])

    const axis = monthAxisLayout(nodes, w)
    const maxValue = max(nodes.map(n => n.value))
    const fNodes: ForceNode[] = nodes.map(n => ({
      id: n.id,
      y: Math.random(),
      x: axis.scale(n.date) + (Math.random() - 0.5) * 0.05, // place on x but randomize slightly to avoid overlapping
      r: Math.sqrt(n.value / maxValue) * 50 * (props.bubbleSize ?? 1)
    }))
    var sim = forceSimulation(fNodes)
      .force('forceX', forceX(d => d.x).strength(1))
      .force('forceY', forceY(_ => 0).strength(0.02))
      .force('collide', forceCollide((d: ForceNode) => d.r + 1).iterations(1))
      .velocityDecay(0.2)
      //.on("tick", () => { })
      .stop()

    if (!animate) {
      var sw = performance.now()
      sim.tick(ticks)
      sim.stop()
      console.log(`BeeChart - sim took ${performance.now() - sw}ms`)
    }

    const bubbleBounds = getBounds(fNodes.map(n => circleToRect({ cx: n.x, cy: n.y, r: n.r })))

    return { fNodes, axis, bubbleBounds, sim }
  }, [nodes?.length ?? 0, props.bubbleSize])

  const showImage = (n: BeehiveNode<T> & ForceNode) => n.img && n.r > 10
  const imgPad = 2

  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!animate || !sim) return
    var cancel = false;
    (async () => {
      for (var i = 0; i < ticks && !cancel; i++) {
        sim.tick()
        if (i % 40 == 0) {
          setTick(i)
          await delay(10)
        }
      }
      if (!cancel) {
        setTick(i)
        sim.stop()
      }
    })()
    return () => { cancel = true }
  }, [sim])


  const onDeselect = useCallback(() => onSelect(null), [onSelect])

  var el = useMemo(() => {
    if (!fNodes || !axis) return <Spinner />
    console.log('BeeHive - render')

    const bubbles = fNodes.map(n => assign(n, nodesById[n.id]))
    const b = { ...bubbleBounds, h: bubbleBounds.h + 25 }

    return <div onClick={onDeselect} style={{ width: '100%', overflowX: 'auto' }}>
      <SVGStyle style={{ width: b.w, height: b.h }} >
        <defs>
          {bubbles.filter(showImage)
            .map(n => <clipPath key={n.id} id={`clip-${n.id}`}><circle r={n.r - imgPad} /></clipPath>)}
        </defs>

        <g >
          <g className='bubbles' transform={offsetTransform(b)}>
            {bubbles.map(b => {
              const { id, x, y, r, color, selected, img } = b
              const selectedClass = selected == true ? 'selected' : (selected == false ? 'deselected' : null)
              const elProps = {
                ...props.tip.eventProps(b.data),
                onClick: (e) => {
                  e.stopPropagation()
                  onSelect(b.data)
                },
                className: compact(['node', selectedClass]).join(' ')
              }

              return <g key={id} transform={`translate(${x}, ${y})`}>
                <circle r={r} fill={color ?? 'var(--bg3)'} {...elProps} onTouchStart={e => e.preventDefault()} />
                {showImage(b) &&
                  <image x={-r + imgPad} y={-r + imgPad} width={(r - imgPad) * 2}
                    href={img} clipPath={`url(#clip-${b.id})`} {...elProps} />}
              </g>
            }
            )}
          </g>
          <g className='axis' transform={`translate(${-b.x}, 0)`}>
            {/* only transform x. Append y raw */}
            <DateAxis {...axis} top={b.h - 25} />
          </g>
        </g>
      </SVGStyle></div>
  }, [nodes, fNodes, tick, props.w])
  return el
}

const DateAxis: FC<AxisLayout & { top: number }> = ({ top, ticks, scale, tickFormat }) => {
  return <g className='axis' transform={`translate(0, ${top})`}>
    {ticks.map((t, i) => {
      var x = scale(t)
      return <g key={i} className='tick' transform={`translate(${x}, 0)`}>
        <line className='tick-line' x1={0} y1={0} x2={0} y2={6} shapeRendering='crispEdges' strokeLinecap='square' />
        <text x={0} y={20} textAnchor='middle'>{tickFormat(t, i)}</text>
      </g>
    })}
  </g>
}


interface AxisLayout {
  scale: ScaleTime<number, number>
  ticks: Date[]
  tickFormat: (v: Date, i: number) => string
}

const monthAxisLayout = <T,>(nodes: BeehiveNode<T>[], width: number) => {
  const [minVal, maxVal] = nodes?.length > 0
    ? minMax(nodes.map(n => n.date.valueOf()))
    : [startOfMonth(new Date()).valueOf(), endOfMonth(new Date()).valueOf()]
  const [min, max] = [addDays(new Date(minVal), -1), addDays(new Date(maxVal), 1)]

  var interval = { start: addMonths(startOfMonth(min), 1), end: startOfMonth(max) }
  if (interval.start >= interval.end)
    interval = { start: startOfMonth(min), end: endOfMonth(max) }
  const monthTicks = eachMonthOfInterval(interval)
  return {
    scale: scaleUtc({
      domain: [min, max],
      range: [0, width],
    }),
    ticks: monthTicks,
    tickFormat: (v: Date, i: number) =>
      v.getMonth() == 0 || i == 0 ? dateFormat(v, null, 'MMM yyyy') : dateFormat(v, null, 'MMM'),
  }
}

const SVGStyle = styled.svg`
  font-size: 0.8em;
  pointer-events: visible;

  .axis .tick {
    line {
      stroke: var(--fg3);
    }
    text {
      stroke: var(--fg2);
    }
  }

  .node {
    :hover {
      cursor:pointer;
    }

    &.selected {
      box-shadow: 0 0 60px 30px var(--fg)
    }

    &.deselected {
      opacity: 0.2
    }
  }
`