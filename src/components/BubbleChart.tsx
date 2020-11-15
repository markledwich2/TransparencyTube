import React, { memo, ReactNode, useEffect } from 'react'
import styled from 'styled-components'
import { measureFormat } from '../common/Channel'
import { GroupedNodes, BubblesSelectionState, getZoomToFit, BubbleNode, buildBubbleNodes } from '../common/Bubble'
import { sumBy } from '../common/Pipe'
import { TagHelp } from './TagInfo'
import { Fullscreen } from '@styled-icons/boxicons-regular'
import { Popup } from './Popup'
import ContainerDimensions from 'react-container-dimensions'
import { HierarchyCircularNode } from 'd3'
import ReactTooltip from 'react-tooltip'
import { delay, jsonEquals } from '../common/Utils'
import { loadingFilter } from './Layout'
import { Tip } from './Tooltip'
import { compact } from 'remeda'


const FullscreenIcon = styled(Fullscreen)`
  position: absolute;
  bottom:5px;
  right:5px;
  cursor: pointer;
  fill: var(--fg3);
  :hover {
    fill: var(--fg-feature);
  }
`

const BubbleDiv = styled.div`
  position:relative;
  display:flex;
  flex-direction:column;
  margin:5px;

  &.inline {
    align-items:center;
    padding:5px;
    background-color: var(--bg1);
    border: 1px solid var(--bg2);
    border-radius: 10px;
  }
`

interface BubbleChartPropsCommon<T> {
  selections: BubblesSelectionState<T>
  onSelect: (row: T) => void
  onOpenGroup?: (group: string) => void
  groupRender: (group: string, rows: T[]) => JSX.Element
  dataCfg: BubbleDataCfg<T>
  showImg: boolean
}

export interface BubbleDataCfg<T> {
  key: (r: T) => string
  title: (r: T) => string
  image: (R: T) => string
}

interface BubbleChartsProps<T> extends BubbleChartPropsCommon<T> {
  rows: T[]
  bubbleWidth: number
  loading?: boolean
  tipContent: (row: T) => ReactNode
}

export const BubbleCharts = <T,>({ selections, rows, onOpenGroup, onSelect, bubbleWidth, loading, groupRender, tipContent, dataCfg, showImg }: BubbleChartsProps<T>) => {
  const { groupedNodes, zoom, packSize } = rows ? buildBubbleNodes(rows, selections, dataCfg, bubbleWidth) : { groupedNodes: [] as GroupedNodes<T>[], zoom: 1, packSize: 1 }
  const openNodes = selections.openGroup && groupedNodes ? groupedNodes.find(g => g.group.value == selections.openGroup) : null
  const commonProps = { selections, rows, pack: { zoom, packSize }, onOpenGroup, onSelect, groupRender, dataCfg, showImg }
  return <><div style={{ display: 'flex', flexDirection: 'row', flexFlow: 'wrap', filter: loading ? loadingFilter : null }}>
    {groupedNodes && groupedNodes.map(t => <BubbleChart key={t.group.value} groupNodes={t} {...commonProps} />)}
    {openNodes && <BubbleChart groupNodes={openNodes} {...commonProps} isOpen />}
  </div>
    <Tip id='bubble' getContent={(key: string) => {
      if (!key || !rows) return
      const r = rows.find(r => dataCfg.key(r) == key)
      return r ? tipContent(r) : <></>
    }} />
  </>
}

interface BubblePackProps {
  zoom: number
  packSize: number
}

interface BubbleChartProps<T> extends BubbleChartPropsCommon<T> {
  groupNodes: GroupedNodes<T>
  rows: T[]
  pack: BubblePackProps,
  isOpen?: boolean,
}

const BubbleChart = <T,>({ groupNodes, selections, rows, pack, onOpenGroup, isOpen, groupRender, dataCfg, onSelect, showImg }: BubbleChartProps<T>) => {
  const group = groupNodes.group.value
  const groupBy = selections.groupBy
  const measureFmt = measureFormat(selections.measure)
  const fMeasure = measureFmt(sumBy(groupNodes.nodes, n => n.data.val ?? 0))

  useEffect(() => {
    if (isOpen) {
      delay(1000).then(() => {
        ReactTooltip.rebuild()
      })
    }
  }, [selections.openGroup])

  const info = <div style={{ padding: '2px' }}>
    <h4>
      <span style={{ paddingRight: '0.5em' }}>{groupNodes.group.label ?? group}</span>
      {!isOpen && <span style={{ paddingRight: '0.5em' }}>{groupBy == 'tags' && <TagHelp tag={group} showTitle />}</span>}
      <b style={{ fontSize: '1.5em' }}>{fMeasure}</b>
    </h4>
    {isOpen && <div style={{ marginBottom: '1em' }}>{groupRender(group, rows)}</div>}
  </div>

  const commonProps = { ...groupNodes, ...pack, onSelect, showImg, dataCfg }

  if (!isOpen) return <BubbleDiv className='inline'>
    {info}
    <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
      <BubbleSvg {...commonProps} />
    </div>
    <FullscreenIcon onClick={() => onOpenGroup(group)} />
  </BubbleDiv>

  return <Popup isOpen={isOpen} onRequestClose={() => onOpenGroup(null)}>
    <ContainerDimensions >
      {({ width, height }) => <BubbleDiv key={group}>
        <div style={{ display: 'flex', flexFlow: 'wrap', flexDirection: 'row' }}>
          {info}
          <BubbleSvg {...commonProps} zoom={getZoomToFit(groupNodes, Math.min(width, height) - 20)} />
        </div>
        {!isOpen && <FullscreenIcon onClick={() => onOpenGroup(group)} />}
      </BubbleDiv>}
    </ContainerDimensions>
  </Popup>
}

const SVGStyle = styled.svg`
  .node {
    :hover {
      cursor:pointer;
    }

    &.deselected {
      filter:opacity(50%);
    }
  }
`

const BubbleSvg = memo(({ nodes, dim, zoom, onSelect, showImg, dataCfg }
  : { dataCfg: BubbleDataCfg<any>, onSelect: (row: any) => void, showImg: boolean } & GroupedNodes<any> & BubblePackProps) => {
  const dx = -dim.x.min.x + dim.x.min.r
  const dy = -dim.y.min.y + dim.y.min.r
  const z = zoom
  const imgPad = 3
  const displayNodes = nodes
    .filter(n => n.data.type == 'node')
    .map(n => ({
      ...n,
      x: (n.x + dx) * zoom,
      y: (n.y + dy) * zoom,
      r: n.r * zoom,
      id: `${n.data.key}|${zoom}`
    }))

  const showImage = (n: HierarchyCircularNode<BubbleNode<any>>) => n.data.img && n.r > 10

  return <SVGStyle width={dim.w * z} height={dim.h * z} >
    <defs>
      {showImg && displayNodes.filter(showImage)
        .map(n => <clipPath key={n.id} id={`clip-${n.id}`}><circle r={n.r - imgPad} /></clipPath >)}
    </defs>
    <g>
      {displayNodes.filter(n => n.data?.row).map(n => {
        const { id, x, y, r } = n
        const { selected, color, img } = n.data
        const selectedClass = selected == true ? 'selected' : (selected == false ? 'deselected' : null)

        const props = {
          'data-for': 'bubble',
          'data-tip': dataCfg.key(n.data.row),
          onClick: (_) => onSelect(n.data.row),
          className: compact(['node', selectedClass]).join(' ')
        }
        return <g key={id} transform={`translate(${x}, ${y})`}>
          <circle r={r} fill={color ?? 'var(--bg3)'} {...props} />
          {showImg && showImage(n) &&
            <image x={- r + imgPad} y={- r + imgPad} width={(r - imgPad) * 2}
              href={img} clipPath={`url(#clip-${n.id})`} {...props} />}
        </g>
      }
      )}
    </g>
  </SVGStyle>
}, (a, b) => a.zoom == b.zoom && a?.nodes.length == b?.nodes.length && jsonEquals(a?.nodes[0]?.data, b?.nodes[0]?.data) && a?.dim.w == b?.dim.w && a?.showImg == b?.showImg)


