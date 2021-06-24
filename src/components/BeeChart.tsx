import {
  SimulationNodeDatum, forceSimulation, forceX, forceY, forceCollide, ScaleTime, scaleLinear, Simulation, ScaleLinear
} from 'd3'
import React, { FunctionComponent as FC, useEffect, useMemo, useRef, useState } from 'react'
import { compact, flatMap, groupBy, indexBy, mapValues, take } from 'remeda'
import styled from 'styled-components'
import { groupMap, keys, mapEntries, max, minMax, sumBy, values } from '../common/Pipe'
import { UseTip } from '../components/Tip'
import { scaleUtc } from '@visx/visx'
import { addDays, addMonths, differenceInDays, eachMonthOfInterval, endOfMonth, formatISO, parseISO, startOfMonth, startOfWeek } from 'date-fns'
import { assign, dateFormat, delay, toJson } from '../common/Utils'
import { Spinner } from './Spinner'
import { circleToRect, getBounds, offsetTransform, Rect } from '../common/Draw'
import { HScroll } from './HScroll'
import { DateRangeValue } from './DateRange'


interface DateVal { date: Date, value: number }
export interface BeehiveNode<T> extends DateVal {
  id: string
  data: T
  color?: string
  img?: string
  selected?: boolean
  group?: string
}

type ForceNode = SimulationNodeDatum & { id: string, r: number, cx?: number, cy?: number }
export type BarNode<T> = { data: T[], range?: DateRangeValue } & DateVal
type LayoutBar<T> = Rect & BarNode<T> & { key: string }

const nodeToRect = (n: ForceNode) => circleToRect({ cx: n.x, cy: n.y, r: n.r })

export const BeeChart = <T,>({ nodes, animate, onSelect, ticks, ...props }: {
  nodes: BeehiveNode<T>[]
  w: number
  tip: UseTip<any>
  barTip: UseTip<BarNode<BeehiveNode<T>>>
  onSelect: (selection: { data?: T, dateRange?: DateRangeValue }) => void
  animate?: boolean
  bubbleSize?: number
  ticks?: number
  selectedRange?: DateRangeValue
  maxBubbles?: number
}) => {

  ticks ??= 180
  const { gNodes, dNodes, gBars } = useMemo(() => {
    const gNodes = nodes && mapValues(groupBy(nodes, n => n.group ?? '_'), g => take(g.filter(n => n.date), props.maxBubbles ?? 2000))
    const dNodes = gNodes && indexBy(flatMap(values(gNodes), g => g), n => n.id)
    const gBars = gNodes && mapValues(gNodes, g => groupMap(g,
      v => formatISO(startOfWeek(v.date)),
      (g, d) => ({ date: parseISO(d), value: sumBy(g, v => v.value), data: g } as BarNode<BeehiveNode<T>>)
    ))
    return { dNodes, gNodes, gBars }
  }, [nodes])

  const nodeIdsString = toJson(dNodes ? keys(dNodes) : '')

  const { w } = useMemo(() => {
    if (!dNodes) return { w: props.w }
    const dayRange = minMax(values(dNodes).map(v => v.date.valueOf()))
    const days = differenceInDays(dayRange[1], dayRange[0])
    const w = max([props.w - 20, days * 5])
    return { w }
  }, [nodeIdsString, props.w])

  const sizes = {
    title: { h: 100 },
    bar: { h: 100 },
    legend: { h: 25 }
  }

  var { bubbleGroups, axis } = useMemo(() => {
    const axis = dNodes && dateAxisLayout(values(dNodes), w)
    const barYScale = gBars && scaleLinear([0, max(flatMap(values(gBars), g => g).map(b => b.value))], [0, sizes.bar.h])
    const maxValue = dNodes && max(values(dNodes).map(n => n.value))

    const bubbleGroups = gNodes && mapEntries(gNodes, (dNodes, groupName) => {
      const barsIn = gBars[groupName]
      const bars = barChartLayout(axis.scale, barYScale, barsIn)
      const fNodes: ForceNode[] = dNodes.map(n => ({
        id: n.id,
        y: Math.random(),
        x: axis.scale(n.date) + (Math.random() - 0.5) * 0.05, // place on x but randomize slightly to avoid overlapping
        r: Math.sqrt(n.value / maxValue) * 50 * (props.bubbleSize ?? 1)
      }))
      var sim = forceSimulation(fNodes)
        .force('forceX', forceX(d => d.x).strength(0.8))
        .force('forceY', forceY(_ => 0).strength(0.02))
        .force('collide', forceCollide((d: ForceNode) => d.r + 1).iterations(1))
        .velocityDecay(0.2)
        //.on("tick", () => { })
        .stop()

      if (!animate) {
        var sw = performance.now()
        sim.tick(ticks)
        sim.stop()
        console.log(`BeeChart - sim took ${performance.now() - sw}ms`, { w, nodes: dNodes.length })
      }
      const bounds = fNodes && getBounds(fNodes.map(nodeToRect))
      return { axis, bounds, sim, bars, fNodes, groupName }
    })
    return { bubbleGroups, axis }
  }, [nodeIdsString, w])

  const showImage = (n: { img?: string, r?: number }) => n.img && n.r > 10
  const imgPad = 2

  // const [tick, setTick] = useState(0)
  // useEffect(() => {
  //   if (!animate || !sim) return
  //   var cancel = false;
  //   (async () => {
  //     for (var i = 0; i < ticks && !cancel; i++) {
  //       sim.tick()
  //       if (i % 40 == 0) {
  //         setTick(i)
  //         await delay(10)
  //       }
  //     }
  //     if (!cancel) {
  //       setTick(i)
  //       sim.stop()
  //     }
  //   })()
  //   return () => { cancel = true }
  // }, [sim])

  const chartRef = useRef<SVGSVGElement>()

  useEffect(() => {
    if (!dNodes) return
    const chart = chartRef.current
    chart.parentElement.scrollBy(chart.clientWidth, 0) // scroll all the way to right
  }, [!dNodes])


  var svgEl = useMemo(() => {
    if (!bubbleGroups || !axis) return <Spinner />


    const allBounds = getBounds(bubbleGroups.map(g => g.bounds))

    let currentY = 0
    const groupsLayout = bubbleGroups.map(g => {
      const newG = {
        ...g,
        bubbles: g.fNodes.map(f => ({ ...f, ...dNodes[f.id] })),
        dy: currentY, h: g.bounds.h + g.bars.bounds.h + sizes.legend.h + sizes.title.h
      }
      currentY += newG.h
      return newG
    })

    return <SVGStyle style={{ width: allBounds.w, height: sumBy(groupsLayout, g => g.h) }} ref={chartRef} >
      <defs>
        {flatMap(groupsLayout, g => g.bubbles).filter(b => showImage(b))
          .map(n => <clipPath key={n.id} id={`clip-${n.id}`}><circle r={n.r - imgPad} /></clipPath>)}
      </defs>
      {groupsLayout.map(g => <g key={g.groupName} transform={`translate(0, ${g.dy})`}>
        <text className='title' style={{ textAnchor: 'middle' }} x={allBounds.w / 2} y={sizes.title.h}>{g.groupName}</text>
        <g transform={`translate(${-allBounds.x}, 0)`} >
          <g className='bubbles' transform={`translate(0, ${-g.bounds.y + sizes.title.h})`} >
            {g.bubbles.map(b => {
              const { id, x, y, r, color, selected, img, data } = b
              const selectedClass = selected == true ? 'selected' : (selected == false ? 'deselected' : null)
              const elProps = {
                ...props.tip.eventProps(data),
                onClick: (e) => {
                  e.stopPropagation()
                  onSelect({ data })
                },
                className: compact(['node', selectedClass]).join(' ')
              }
              return <g key={id} id={id} transform={`translate(${x}, ${y})`}>
                <circle r={r} fill={color ?? 'var(--bg3)'} {...elProps} onTouchStart={e => e.preventDefault()} />
                {showImage({ img, r }) &&
                  <image x={-r + imgPad} y={-r + imgPad} width={(r - imgPad) * 2}
                    href={img} clipPath={`url(#clip-${b.id})`} {...elProps} />}
              </g>
            }
            )}
          </g>
          <g className='axis'>
            {/* only transform x. Append y raw */}
            <DateAxis {...axis} top={g.bounds.h + sizes.title.h} />
          </g>
          <g className='bars' transform={`translate(0, ${g.bounds.h + sizes.legend.h + sizes.title.h})`}>
            {g.bars.bars.map(r => {
              const selectedStart = props.selectedRange?.start
              const selected = selectedStart ? selectedStart.toISOString() == r.range.start.toISOString() : null
              const selectedClass = selected ? 'selected' : (selected == false ? 'deselected' : null)
              return <rect key={r.key}
                onClick={e => {
                  e.stopPropagation()
                  onSelect({ dateRange: r.range })
                }}
                {...props.barTip?.eventProps(r)}
                className={compact(['node', selectedClass]).join(' ')}
                width={r.w} height={r.h} x={r.x} y={g.bars.bounds.h - r.h} />
            })}
          </g>
        </g>
      </g>
      )}
    </SVGStyle>
  }, [toJson(dNodes && values(dNodes).map(n => [n.id, n.selected])), w])

  return <HScroll className='bee-chart' onClick={() => onSelect(null)}>{svgEl}</HScroll>
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

const dateAxisLayout = <T,>(nodes: BeehiveNode<T>[], width: number): AxisLayout => {
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



const barPadding = 1

const barChartLayout = <T,>(xScale: ScaleTime<number, number>, yScale: ScaleLinear<number, number>, barData: BarNode<BeehiveNode<T>>[]): { bars: LayoutBar<BeehiveNode<T>>[], bounds: Rect } => {
  const w = xScale(new Date()) - xScale(addDays(new Date(), -7)) - barPadding * 2
  // center on given date group, fit space between
  const bars = barData.map(b => ({
    ...b,
    key: formatISO(b.date),
    x: xScale(b.date) + barPadding,
    w,
    y: 0,
    h: yScale(b.value),
    range: { start: b.date, end: addDays(b.date, 7) },
  }))
  const bounds = getBounds(bars)
  return { bars, bounds }
}

const SVGStyle = styled.svg`
  font-size: 1em;
  pointer-events: visible;

  text {
      fill: var(--fg1);
  }

  text.title {
    font-size: 1.5em;
    font-weight: bolder;
    fill: var(--fg2);
  }

  .axis .tick {
    line {
      stroke: var(--fg3);
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

  .bars rect {
    fill: var(--bg3);
  }
`