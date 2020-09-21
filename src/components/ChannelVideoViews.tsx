import { hierarchy, pack } from 'd3'
import { Uri } from '../common/Uri'
import { useState, useEffect, useRef, useMemo, CSSProperties } from 'react'
import React from 'react'
import { getJsonl, numFormat, preloadImages } from '../common/Utils'
import { InlineSelect } from './InlineSelect'
import ReactTooltip from 'react-tooltip'
import { ChannelStats, ChannelMeasures, ChannelNode, getChannels, imagesToLoad, TagNodes, getTagData, channelMd } from '../common/Channel'
import { ChannelInfo } from './Channel'
import { max, maxBy, minBy, sumBy, values } from '../common/Pipe'
import { flatMap, indexBy, mapValues } from 'remeda'
import styled from 'styled-components'
import Modal from 'react-modal'
import ContainerDimensions from 'react-container-dimensions'
import { Videos } from './Video'
import { Tip } from './Tooltip'

export const ChannelVideoViewsPage = () => {
  const [channels, setChannels] = useState<Record<string, ChannelStats>>()
  const [openChannel, setOpenChannel] = useState<ChannelStats>(null)
  useEffect(() => { getChannels().then((channels) => setChannels(indexBy(channels, c => c.channelId))) }, [])

  const videosList = useMemo(() => {
    if (!channels) return <></>
    return <><div style={{ height: '1em' }} /><Videos channels={channels} onOpenChannel={c => setOpenChannel(c)} /></>
  }, [channels])

  if (!channels) return <></>
  return <div id='page'>
    <ContainerDimensions >
      {({ height, width }) => <Bubbles channels={channels} width={width} onOpenChannel={c => setOpenChannel(c)} />}
    </ContainerDimensions>
    {videosList}
    {openChannel &&
      <Modal
        isOpen={openChannel != null}
        ariaHideApp={false}
        parentSelector={() => document.querySelector('#page')}
        onRequestClose={() => setOpenChannel(null)}
        style={modalStyle}
      >
        <ChannelInfo channel={openChannel} size='max' />
      </Modal>}
  </div>
}

const BubbleDiv = styled.div`
  display:flex;
  flex-direction:column;
  margin:5px;
  align-items:center;
  padding:5px;
  background-color: var(--bg1);
  border: 1px solid var(--bg2);
  border-radius: 10px;
`

const modalStyle = {
  overlay: {
    backgroundColor: 'none',
    backdropFilter: 'blur(15px)'
  },
  content: {
    backgroundColor: 'var(--bg)',
    opacity: 1,
    padding: '0.5em',
    border: 'solid 1px var(--bg2)',
    borderRadius: '10px',
    maxWidth: '95vw',
    minWidth: "300px",
    height: '90vh',
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    overflow: 'hidden'
  }
}

const Bubbles = ({ channels, width, onOpenChannel }: { channels: Record<string, ChannelStats>, width: number, onOpenChannel: (c: ChannelStats) => void }) => {
  const [measure, setMeasure] = useState<keyof ChannelMeasures>('views7')
  const [imgLoaded, setImgLoaded] = useState(false)

  const { tagNodes, maxSize, zoom, packSize } = useMemo(() => {
    const tagData = getTagData(values(channels), c => c[measure] ?? 0)
    const packSize = Math.min(width - 20, 800)
    const tagNodes: TagNodes[] = tagData.map(t => {

      if (t.channels.length == 0) return null

      const root: ChannelNode = {
        type: 'root',
        title: 'root',
        children: t.channels
      }

      const nodes = pack<ChannelNode>()
        .padding(0)
        .size([packSize, packSize])
        .radius(d => Math.sqrt(d.data.val) * 0.015)
        (hierarchy(root, n => n.children))
        .descendants()

      let { x, y } = {
        x: {
          min: minBy(nodes, n => n.x - n.r),
          max: maxBy(nodes, n => n.x + n.r)
        },
        y: {
          min: minBy(nodes, n => n.y - n.r),
          max: maxBy(nodes, n => n.y + n.r)
        },
      }

      let dim = {
        x, y,
        w: (x.max.x + x.max.r) - (x.min.x - x.min.r),
        h: (y.max.y + y.max.r) - (y.min.y - y.min.r)
      }

      return { tag: t.tag, nodes: nodes, dim }
    }).filter(t => t != null)

    const maxSize = max(tagNodes.map(t => Math.max(t.dim.w, t.dim.h))) // max size for all charts
    const zoom = packSize / maxSize

    flatMap(tagNodes, t => t.nodes).forEach(n => {
      if (n.r * zoom > 10)
        n.data.img = n.data?.channel?.logoUrl
    })

    return { tagNodes, maxSize, zoom, packSize }
  }, [channels, measure, width])


  useEffect(() => {
    setImgLoaded(false)
    const images = imagesToLoad(tagNodes)
    preloadImages(images).then(() => setImgLoaded(true))
  }, [measure])

  const channelClick = (c: ChannelStats) => {
    ReactTooltip.hide()
    onOpenChannel(c)
    console.log('openChannel')
  }

  const bubblesChart = useMemo(() => <>
    <h3 style={{ padding: '0.5em 1em' }}>Channels <InlineSelect options={channelMd.measures} value={measure} onChange={o => setMeasure(o)} /> grouped by tag</h3>
    <div style={{ display: 'flex', flexDirection: 'row', flexFlow: 'wrap' }}>
      {tagNodes.map(t =>
        <BubbleDiv key={t.tag.value}>
          <div style={{ padding: '2px' }}>
            <h4>
              <span style={{ color: 'var(--fg2)' }}>{t.tag.label ?? t.tag.value}</span>
              <b style={{ paddingLeft: '8px', fontSize: '1.5em' }}>{numFormat(sumBy(t.nodes, n => n.data.val ?? 0))}</b>
            </h4>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}><TagPack {...t} {...{ zoom, packSize, imgLoaded, channelClick }} /></div>
        </BubbleDiv>
      )}
    </div>
  </>,
    [measure, imgLoaded, channels, zoom])


  return <div>
    {bubblesChart}
    {imgLoaded &&
      <Tip id='bubble' getContent={(id: string) => id ? <ChannelInfo channel={channels[id]} size='min' /> : <></>} />
    }
  </div>
}


const GStyle = styled.g`
  .node {
    :hover {
      cursor:pointer;
    }
  }
`

interface TagPackExtra { zoom: number, packSize: number, imgLoaded: boolean, channelClick: (c: ChannelStats) => void }
const TagPack = ({ nodes, dim, zoom, imgLoaded, channelClick: onChannelClick }: {} & TagNodes & TagPackExtra) => {
  const dx = -dim.x.min.x + dim.x.min.r
  const dy = -dim.y.min.y + dim.y.min.r
  const z = zoom

  return <svg width={dim.w * z} height={dim.h * z} style={{}}>
    <g>
      {nodes.filter(n => n.data.type == 'channel').map(n => {
        const x = (n.x + dx) * zoom
        const y = (n.y + dy) * zoom
        const r = n.r * zoom
        const props = { 'data-for': 'bubble', 'data-tip': n.data.channel.channelId, onClick: (_) => onChannelClick(n.data.channel), className: 'node' }
        return <GStyle key={n.data.key}>
          <circle cx={x} cy={y} r={r} fill={n.data.color} {...props} />
          {imgLoaded && n.data.img &&
            <image x={x - r * 0.9} y={y - r * 0.9} width={r * 0.9 * 2}
              href={n.data.img} style={{ clipPath: 'circle()' }}{...props} />}
        </GStyle>
      }
      )}
    </g>
  </svg>
}
