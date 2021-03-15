import React, { ReactNode } from 'react'
import * as d3 from 'd3'
import { sankey, sankeyLinkHorizontal, sankeyLeft, SankeyNode, SankeyLink, SankeyGraph } from 'd3-sankey'
import styled from 'styled-components'
import { StyleProps } from './Style'



interface Size {
  w: number
  h: number
}

export interface LinkData {
  color?: string
}

export interface NodeData {
  id: string,
  color?: string
  title: string
}


const SvgStyled = styled.svg`
  text {
    fill: var(--fg1);
  }
`

interface SankeyProps<TNode, TLink> {
  graph: SankeyGraph<TNode, TLink>
  size: Size
  /** child nodes of the text element */
  textRender?: (n: TNode) => ReactNode
}
export const Sankey = <TNode extends NodeData, TLink extends LinkData>({ graph, size, textRender, style, className }: SankeyProps<TNode, TLink> & StyleProps) => {
  if (graph.nodes.length == 0) return <svg width={size.w} height={size.h} />

  const { nodes, links } = sankey<TNode, TLink>()
    .size([size.w, size.h - 15])
    .nodeWidth(10)
    .nodeId(d => d.id)
    (graph)

  const makeLink = sankeyLinkHorizontal<TNode, TLink>()

  return <SvgStyled width={size.w} height={size.h} style={style} className={className}>
    <g className='rectangle'>
      {nodes.map(d => <g key={d.id}>
        <rect x={d.x0} y={d.y0} height={d.y1 - d.y0} width={d.x1 - d.x0} fill={d.color} rx='3'>
          <title>{d.value}</title>
        </rect>
      </g>
      )}
    </g>
    <g fill='none' className='link'>
      {links.map(d => <path key={d.index}
        d={makeLink(d)}
        stroke={(d.source as any).color}
        strokeWidth={d.width}
        style={{ opacity: 0.4 }} />)}
    </g>
    <g className='text'>
      {nodes.map(d => {
        const x = d.x0 < size.w / 2 ? d.x1 + 6 : d.x0 - 6
        const y = (d.y1 + d.y0) / 2
        const anchor = d.x0 < size.w / 2 ? 'start' : 'end'
        // 
        return <g key={d.id} transform={`translate(${x}, ${y})`}>
          <text textAnchor={anchor}>{textRender ? textRender(d) : d.title}</text>
        </g>
      })}
    </g>
  </SvgStyled >
}