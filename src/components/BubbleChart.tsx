import React, { useState } from 'react'
import styled from 'styled-components'
import { GroupedNodes, BubblesSelectionState, measureFormat, Channel } from '../common/Channel'
import { sumBy } from '../common/Pipe'
import { ChannelStats } from '../common/RecfluenceApi'
import { TagHelp, TagInfo } from './TagInfo'
import { Fullscreen, ExitFullscreen } from '@styled-icons/boxicons-regular'
import { Popup } from './Popup'


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

interface PackExtra {
  zoom: number,
  packSize: number,
  channelClick: (c: ChannelStats) => void,
  showImg: boolean,
  key: string
}

interface BubbleChartProps extends PackExtra {
  channels: Channel[]
  groupedNodes: GroupedNodes[],
  selections: BubblesSelectionState
  onOpenGroup: (group: string) => void
}

export const BubbleChart = ({ groupedNodes, selections, onOpenGroup, channels, ...extra }: BubbleChartProps) => {
  const measureFmt = measureFormat(selections.measure)

  return <>
    {groupedNodes && groupedNodes.map(t => {

      const group = t.group.value
      const groupBy = selections.groupBy ?? 'tags'
      const isOpen = selections.openGroup && selections.openGroup == group
      const gExtra = { ...extra, zoom: isOpen ? extra.zoom * 2 : 1 } //todo make this fit
      const fMeasure = measureFmt(sumBy(t.nodes, n => n.data.val ?? 0))

      const contents = <BubbleDiv key={group} className={isOpen ? 'open' : 'inline'}>
        <div style={{ padding: '2px' }}>
          <h4>
            <span style={{ paddingRight: '0.5em' }}>{t.group.label ?? group}</span>
            {!isOpen && <span style={{ paddingRight: '0.5em' }}>{groupBy == 'tags' && <TagHelp tag={group} showTitle />}</span>}
            <b style={{ fontSize: '1.5em' }}>{fMeasure}</b>
          </h4>
        </div>
        {groupBy == 'tags' && <TagInfo tag={group} channels={channels} style={{ marginBottom: '1em' }} />}

        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <TagPack {...t} {...gExtra} />
        </div>
        {!isOpen && <FullscreenIcon onClick={() => onOpenGroup(group)} />}
      </BubbleDiv>

      return isOpen ? <Popup isOpen={isOpen} onRequestClose={() => onOpenGroup(null)} >{contents}</Popup> : contents
    }
    )}</>
}

const SVGStyle = styled.svg`
  .node {
    :hover {
      cursor:pointer;
    }
  }
`



const TagPack = ({ nodes, dim, zoom, channelClick: onChannelClick, showImg, key }: {} & GroupedNodes & PackExtra) => {
  const dx = -dim.x.min.x + dim.x.min.r
  const dy = -dim.y.min.y + dim.y.min.r
  const z = zoom
  const imgRatio = 0.9
  const channelNodes = nodes.filter(n => n.data.type == 'channel')
    .map(n => ({
      ...n,
      x: (n.x + dx) * zoom,
      y: (n.y + dy) * zoom,
      r: n.r * zoom,
      id: n.data.key
    }))

  return <SVGStyle key={key} width={dim.w * z} height={dim.h * z} >
    <defs>
      {showImg && channelNodes.filter(n => n.data.img)
        .map(n => <clipPath key={n.id} id={`clip-${n.id}`}><circle r={n.r * imgRatio} /></clipPath >)}
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
          {showImg && n.data.img &&
            <image x={- r * imgRatio} y={- r * imgRatio} width={r * imgRatio * 2}
              href={n.data.img} clipPath={`url(#clip-${n.id})`} {...props} />}
        </g>
      }
      )}
    </g>
  </SVGStyle>
}

