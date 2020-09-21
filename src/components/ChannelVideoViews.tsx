import { hierarchy, pack } from 'd3'
import { Uri } from '../common/Uri'
import { useState, useEffect, useRef, useMemo } from 'react'
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

export const ChannelVideoViewsPage = () => {
  const [channels, setChannels] = useState<Record<string, ChannelStats>>()
  useEffect(() => { getChannels().then((channels) => setChannels(indexBy(channels, c => c.channelId))) }, [])
  const videosList = useMemo(() => <><div style={{ height: '1em' }} /><Videos channels={channels} /></>, [channels])
  if (!channels) return <></>
  return <>
    <ContainerDimensions >
      {({ height, width }) => <Bubbles channels={channels} width={width} />}
    </ContainerDimensions>
    {videosList}
  </>
}

const TipStyle = styled.div`
  .tip {
    opacity:1;
    padding:1em;
    font-size:1rem;
    max-width: 30rem;
    background-color: var(--bg);
    color: var(--fg);
    border-color: var(--bg2);
    border-radius: 10px;
  }
`

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
    opacity: 0.85,
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

const Bubbles = ({ channels, width }: { channels: Record<string, ChannelStats>, width: number }) => {
  const [measure, setMeasure] = useState<keyof ChannelMeasures>('views7')
  const [imgLoaded, setImgLoaded] = useState(false)
  const [openChannel, setOpenChannel] = useState<ChannelStats>(null)

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

      const pad = 0
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
    setOpenChannel(c)
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


  return <div id='page'>
    {bubblesChart}
    {imgLoaded &&
      <TipStyle>
        <ReactTooltip
          effect='solid'
          border
          className='tip'
          borderColor='var(--bg2)'
          getContent={(id: string) => id ? <ChannelInfo channel={channels[id]} measure={measure} size='min' /> : <></>} />
      </TipStyle>}
    {openChannel &&
      <Modal
        isOpen={openChannel != null}
        ariaHideApp={false}
        parentSelector={() => document.querySelector('#page')}
        onRequestClose={() => setOpenChannel(null)}
        style={modalStyle}
      >
        <ChannelInfo channel={openChannel} measure={measure} size='max' />
      </Modal>}
  </div>
}


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

        return <g key={n.data.key}>
          <circle cx={x} cy={y} r={r} fill={n.data.color} data-tip={n.data.channel.channelId} onClick={_ => onChannelClick(n.data.channel)} />
          {imgLoaded && n.data.img &&
            <image x={x - r * 0.9} y={y - r * 0.9} width={r * 0.9 * 2}
              href={n.data.img} data-tip={n.data.channel.channelId} style={{ clipPath: 'circle()' }} onClick={_ => onChannelClick(n.data.channel)} />}
        </g>
      }
      )}
    </g>
  </svg>
}
