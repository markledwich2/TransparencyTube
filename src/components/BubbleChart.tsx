import React, { ReactNode, useCallback, useMemo, FunctionComponent as FC } from 'react'
import styled from 'styled-components'
import { measureFormat } from '../common/Channel'
import { GroupedNodes, BubblesSelectionState, getZoomToFit, BubbleNode, buildBubbleNodes } from '../common/Bubble'
import { sumBy } from '../common/Pipe'
import { Fullscreen } from '@styled-icons/boxicons-regular'
import { Popup } from './Popup'
import ContainerDimensions from 'react-container-dimensions'
import { HierarchyCircularNode } from 'd3'
import { toJson } from '../common/Utils'
import { loadingFilter, NormalFont, StyleProps, styles } from './Style'
import { compact, pick } from 'remeda'
import { HelpOutline } from 'styled-icons/material'
import { TableMdRun } from '../common/Metadata'
import { Tip, UseTip, useTip } from './Tip'


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
  titleSuffixRender?: (group: string, rows: T[]) => JSX.Element
  dataCfg: BubbleDataCfg<T>
}

export interface BubbleDataCfg<T> {
  key: (r: T) => string
  title: (r: T) => string
  image: (R: T) => string
  md: TableMdRun<any>
}

interface BubbleChartsProps<T> extends BubbleChartPropsCommon<T> {
  rows: T[]
  bubbleWidth: number
  loading?: boolean
  tipContent: (row: T) => ReactNode
}

interface GroupData<T> {
  group: string
  rows: T[]
}

export const BubbleCharts = <T extends object,>({ selections, rows, onOpenGroup, onSelect, bubbleWidth, loading, groupRender, titleSuffixRender, tipContent, dataCfg, style }: BubbleChartsProps<T> & StyleProps) => {
  const bubbleTip = useTip<T>()
  const groupTip = useTip<GroupData<T>>()

  const d = useMemo(() => {
    const { groupedNodes, zoom, packSize } = rows ? buildBubbleNodes(rows, selections, dataCfg, bubbleWidth) : { groupedNodes: [] as GroupedNodes<T>[], zoom: 1, packSize: 1 }
    const commonProps = { selections, pack: { zoom, packSize }, onOpenGroup, onSelect, groupRender, titleSuffixRender, dataCfg, groupTip, bubbleTip }
    return { groupedNodes, commonProps }
  }, [rows, toJson(pick(selections, ['colorBy', 'groupBy', 'measure', 'period'])), bubbleWidth, loading])

  const openNodes = useMemo(() => {
    return selections.openGroup && d.groupedNodes ? d.groupedNodes.find(g => g.group.value == selections.openGroup) : null
  }, [d, toJson(pick(selections, ['openGroup', 'openRowKey']))])

  return <>
    { useMemo(() => {
      return <div className="bubbles-container" style={{ display: 'flex', flexDirection: 'row', flexFlow: 'wrap', filter: loading ? loadingFilter : null, ...style }}>
        {d.groupedNodes && d.groupedNodes.map(t => <BubbleChart key={t.group.value} groupNodes={t} {...d.commonProps} />)}
        {openNodes && <BubbleChart groupNodes={openNodes} {...d.commonProps} isOpen />}
      </div>
    }, [d, openNodes, onSelect])}
    <Tip {...bubbleTip.tipProps}>{bubbleTip.data && tipContent(bubbleTip.data)}</Tip>
    {groupRender && <Tip {...groupTip.tipProps}>{groupTip.data && groupRender(groupTip.data.group, groupTip.data.rows)}</Tip>}
  </>
}

interface BubblePackProps {
  zoom: number
  packSize: number
}

interface BubbleChartProps<T> extends BubbleChartPropsCommon<T> {
  groupNodes: GroupedNodes<T>
  pack: BubblePackProps,
  isOpen?: boolean,
  groupTip?: UseTip<GroupData<T>>
  bubbleTip?: UseTip<T>
}

const BubbleChart = <T,>({ groupNodes, selections, pack, onOpenGroup, isOpen, groupRender, titleSuffixRender, dataCfg, onSelect, groupTip, bubbleTip }: BubbleChartProps<T>) => {
  const group = groupNodes.group.value
  const measureFmt = measureFormat(selections.measure)
  const fMeasure = measureFmt(sumBy(groupNodes.nodes, n => n.data.val ?? 0))
  const rows = groupNodes.rows

  const info = <div style={{ padding: '2px' }}>
    <h4>
      <span style={{ paddingRight: '0.5em' }}>{groupNodes.group.label ?? group}</span>
      {!isOpen && <span style={{ paddingRight: '0.5em' }}>{groupRender && <HelpOutline {...groupTip.eventProps({ group, rows })}
        style={{ ...styles.inlineIcon }} />}
      </span>}
      <b style={{ fontSize: '1.5em' }}>{fMeasure}</b>
      {titleSuffixRender && <NormalFont>{titleSuffixRender(group, rows)}</NormalFont>}
    </h4>
    {isOpen && <div style={{ marginBottom: '1em' }}>{groupRender(group, rows)}</div>}
  </div>

  const svgProps = {
    ...groupNodes,
    ...pack,
    onSelect,
    dataCfg,
    bubbleTip
  }

  const onDeselect = useCallback(() => onSelect(null), [onSelect])


  return useMemo(() => <>
    <BubbleDiv className='inline' onClick={onDeselect}>
      {info}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <BubbleSvg {...svgProps} />
      </div>
      <FullscreenIcon onClick={e => {
        e.stopPropagation()
        onOpenGroup(group)
      }} />
    </BubbleDiv>

    {isOpen && <Popup isOpen={isOpen} onRequestClose={() => onOpenGroup(null)}>
      <ContainerDimensions >
        {({ width, height }) => <BubbleDiv key={group} onClick={onDeselect}>
          <div style={{ display: 'flex', flexFlow: 'wrap', flexDirection: 'row' }}>
            {info}
            <BubbleSvg {...svgProps} zoom={getZoomToFit(groupNodes, Math.min(width, height) - 20)} />
          </div>
          {!isOpen && <FullscreenIcon onClick={() => onOpenGroup(group)} />}
        </BubbleDiv>}
      </ContainerDimensions>
    </Popup>}
  </>, [isOpen, svgProps.nodes])
}

const SVGStyle = styled.svg`
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

const imgPad = 3

const BubbleSvg: FC<{ onSelect: (row: any) => void, bubbleTip: UseTip<any> } & GroupedNodes<any> & BubblePackProps> =
  ({ nodes, dim, zoom, onSelect, bubbleTip }) => {

    const displayNodes = useMemo(() => {
      const dx = -dim.x.min.x + dim.x.min.r
      const dy = -dim.y.min.y + dim.y.min.r
      const displayNodes = nodes
        .filter(n => n.data.type == 'node')
        .map(n => ({
          ...n,
          x: (n.x + dx) * zoom,
          y: (n.y + dy) * zoom,
          r: n.r * zoom,
          id: `${n.data.key}|${zoom}`
        }))

      return displayNodes
    }, [nodes])

    const showImage = (n: HierarchyCircularNode<BubbleNode<any>>) => n.data.img && n.r > 10

    return useMemo(() => {
      return <SVGStyle width={dim.w * zoom} height={dim.h * zoom}>
        <defs>
          {displayNodes.filter(showImage)
            .map(n => <clipPath key={n.id} id={`clip-${n.id}`}><circle r={n.r - imgPad} /></clipPath>)}
        </defs>
        <g>
          {displayNodes.filter(n => n.data?.row).map(n => {
            const { id, x, y, r } = n
            const { selected, color, img } = n.data
            const selectedClass = selected == true ? 'selected' : (selected == false ? 'deselected' : null)

            const props = {
              ...bubbleTip.eventProps(n.data.row),
              onClick: (e) => {
                e.stopPropagation()
                onSelect(n.data.row)
              },
              className: compact(['node', selectedClass]).join(' ')
            }

            return <g key={id} transform={`translate(${x}, ${y})`}>
              <circle r={r} fill={color ?? 'var(--bg3)'} {...props} onTouchStart={e => e.preventDefault()} />
              {showImage(n) &&
                <image x={-r + imgPad} y={-r + imgPad} width={(r - imgPad) * 2}
                  href={img} clipPath={`url(#clip-${n.id})`} {...props} />}
            </g>
          }
          )}
        </g>
      </SVGStyle>
    }, [displayNodes, onSelect])
  }

