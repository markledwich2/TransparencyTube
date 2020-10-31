import React, { memo, useEffect } from 'react'
import styled from 'styled-components'
import { measureFormat, Channel } from '../common/Channel'
import { GroupedNodes, BubblesSelectionState, getZoomToFit, ChannelNode } from '../common/ChannelBubble'
import { sumBy } from '../common/Pipe'
import { ChannelStats } from '../common/RecfluenceApi'
import { TagHelp, TagInfo } from './TagInfo'
import { Fullscreen } from '@styled-icons/boxicons-regular'
import { Popup } from './Popup'
import ContainerDimensions from 'react-container-dimensions'
import { HierarchyCircularNode } from 'd3'
import ReactTooltip from 'react-tooltip'
import { delay, jsonEquals } from '../common/Utils'


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

interface PackProps {
  zoom: number,
  packSize: number,
  channelClick: (c: ChannelStats) => void,
  showImg: boolean,
  key: string
}

interface BubbleChartsProps {
  channels: Channel[]
  groupedNodes: GroupedNodes[],
  selections: BubblesSelectionState
  onOpenGroup: (group: string) => void
  pack: PackProps
}

export const BubbleCharts = ({ groupedNodes, selections, channels, pack, onOpenGroup }: BubbleChartsProps) => {
  const openNodes = selections.openGroup ? groupedNodes.find(g => g.group.value == selections.openGroup) : null
  const commonProps = { selections, channels, pack, onOpenGroup }
  return <>
    {groupedNodes && groupedNodes.map(t => <BubbleChart key={t.group.value} groupNodes={t} {...commonProps} />)}
    {openNodes && <BubbleChart groupNodes={openNodes} {...commonProps} isOpen />}
  </>
}

interface BubbleChartProps {
  groupNodes: GroupedNodes
  selections: BubblesSelectionState
  channels: Channel[]
  pack: PackProps,
  onOpenGroup: (group: string) => void
  isOpen?: boolean
}

const BubbleChart = ({ groupNodes, selections, channels, pack, onOpenGroup, isOpen }: BubbleChartProps) => {
  const group = groupNodes.group.value
  const groupBy = selections.groupBy ?? 'tags'
  const measureFmt = measureFormat(selections.measure)
  const fMeasure = measureFmt(sumBy(groupNodes.nodes, n => n.data.val ?? 0))

  useEffect(() => {
    if (isOpen) {
      delay(1000).then(() => ReactTooltip.rebuild())
    }
  }, [selections.openGroup])

  const info = <div style={{ padding: '2px' }}>
    <h4>
      <span style={{ paddingRight: '0.5em' }}>{groupNodes.group.label ?? group}</span>
      {!isOpen && <span style={{ paddingRight: '0.5em' }}>{groupBy == 'tags' && <TagHelp tag={group} showTitle />}</span>}
      <b style={{ fontSize: '1.5em' }}>{fMeasure}</b>
    </h4>
    {isOpen && groupBy == 'tags' && <TagInfo tag={group} channels={channels} style={{ marginBottom: '1em' }} />}
  </div>

  if (!isOpen) return <BubbleDiv key={group} className='inline'>
    {info}
    <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
      <BubbleSvg {...groupNodes} {...pack} />
    </div>
    <FullscreenIcon onClick={() => onOpenGroup(group)} />
  </BubbleDiv>

  return <Popup key={group + '|open'} isOpen={isOpen} onRequestClose={() => onOpenGroup(null)}>
    <ContainerDimensions >
      {({ width, height }) => <BubbleDiv key={group}>
        <div style={{ display: 'flex', flexFlow: 'wrap', flexDirection: 'row' }}>
          {info}
          <BubbleSvg {...groupNodes} {...pack} zoom={getZoomToFit(groupNodes, Math.min(width, height) - 20)} />
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
  }
`
// function bubbleEquals(a: Readonly<BubblesProps>, b: Readonly<BubblesProps>) {
//   const bubbleSelections = ({ colorBy, groupBy, measure, period, openGroup, openChannelId }: BubblesSelectionState) =>
//     ({ colorBy, groupBy, measure, period, openGroup, openChannelId })
//   const shallowProps = (p: BubblesProps) => {
//     const { selections, onOpenChannel, onLoad, onSelection, ...rest } = p
//     return rest
//   }
//   const res = shallowEquals(shallowProps(a), shallowProps(b))
//     && jsonEquals(bubbleSelections(a.selections), bubbleSelections(b.selections))
//   return res
// }


const BubbleSvg = memo(({ nodes, dim, zoom, channelClick: onChannelClick, showImg }: {} & GroupedNodes & PackProps) => {
  const dx = -dim.x.min.x + dim.x.min.r
  const dy = -dim.y.min.y + dim.y.min.r
  const z = zoom
  const imgPad = 3
  const channelNodes = nodes.filter(n => n.data.type == 'channel')
    .map(n => ({
      ...n,
      x: (n.x + dx) * zoom,
      y: (n.y + dy) * zoom,
      r: n.r * zoom,
      id: `${n.data.key}|${zoom}`
    }))

  const showImage = (n: HierarchyCircularNode<ChannelNode>) => n.data.img && n.r > 10

  return <SVGStyle width={dim.w * z} height={dim.h * z} >
    <defs>
      {showImg && channelNodes.filter(showImage)
        .map(n => <clipPath key={n.id} id={`clip-${n.id}`}><circle r={n.r - imgPad} /></clipPath >)}
    </defs>
    <g>
      {channelNodes.map(n => {
        const { id, x, y, r } = n
        const props = {
          'data-for': 'bubble',
          'data-tip': n.data.channel.channelId,
          onClick: (_) => onChannelClick(n.data.channel),
          className: 'node'
        }
        return <g key={id} transform={`translate(${x}, ${y})`}>
          <circle r={r} fill={n.data.color ?? 'var(--bg3)'} {...props} />
          {showImg && showImage(n) &&
            <image x={- r - imgPad} y={- r - imgPad} width={(r + imgPad) * 2}
              href={n.data.img} clipPath={`url(#clip-${n.id})`} {...props} />}
        </g>
      }
      )}
    </g>
  </SVGStyle>
}, (a, b) => a.zoom == b.zoom && a?.nodes.length == b?.nodes.length && jsonEquals(a?.nodes[0]?.data, b?.nodes[0]?.data) && a?.dim.w == b?.dim.w && a?.showImg == b?.showImg)


