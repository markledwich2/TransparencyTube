import { hierarchy, pack } from 'd3'
import { Uri } from '../common/Uri'
import { useState, useEffect, useRef, useMemo } from 'react'
import React from 'react'
import { getJsonl, numFormat, preloadImages } from '../common/Utils'
import { InlineSelect } from './InlineSelect'
import ReactTooltip from 'react-tooltip'
import { ChannelStats, ChannelMeasures, ChannelNode, getChannels, imagesToLoad, TagNodes, getTagData, channelMd } from '../common/Channel'
import { ChannelInfo } from './Channel'
import { max, maxBy, minBy, sumBy } from '../common/Pipe'
import { flatMap, indexBy } from 'remeda'
import styled from 'styled-components'
import Modal from 'react-modal'
import ContainerDimensions from 'react-container-dimensions'

export const ViewsByTagPage = () => {
  const [channels, setChannels] = useState<ChannelStats[]>()
  useEffect(() => { getChannels().then((channels) => setChannels(channels)) }, [])
  if (!channels) return <></>
  return <ContainerDimensions >
    {({ height, width }) => <TagsChart channels={channels} width={width} />}
  </ContainerDimensions>
}

const TipStyle = styled.div`
  .tip {
    opacity:1;
    padding:1em;
    font-size:1rem;
  }
`

const TagsChart = ({ channels, width }: { channels: ChannelStats[], width: number }) => {
  const [measure, setMeasure] = useState<keyof ChannelMeasures>('views7')
  const [imgLoaded, setImgLoaded] = useState(false)
  const [openChannel, setOpenChannel] = useState<ChannelStats>(null)

  const chanById = useMemo(() => indexBy(channels, c => c.channelId), [channels])
  const { tagNodes, maxSize, zoom, packSize } = useMemo(() => {
    const tagData = getTagData(channels, c => c[measure] ?? 0)
    const packSize = Math.min(width - 20, 800)
    const tagNodes: TagNodes[] = tagData.map(t => {

      const root: ChannelNode = {
        type: 'root',
        title: 'root',
        children: t.channels
      }

      const nodes = pack<ChannelNode>()
        .padding(0)
        .size([packSize, packSize])
        .radius(d => Math.sqrt(d.data.val) * 0.015)
        (hierarchy(root, n => n.children)).descendants()

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
        size: Math.max((x.max.x + x.max.r) - (x.min.x - x.min.r) + pad, (y.max.y + y.max.r) - (y.min.y - y.min.r) + pad, 100)
      }

      return { tag: t.tag, nodes: nodes, dim }
    })

    const maxSize = max(tagNodes.map(t => t.dim.size))
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

  const chart = useMemo(() => <>
    <span>Channel <InlineSelect options={channelMd.measures} value={measure} onChange={o => setMeasure(o)} /> by tag</span>
    <div style={{ display: 'flex', flexDirection: 'row', flexFlow: 'wrap' }}>
      {tagNodes.map(t =>
        <div key={t.tag.value} style={{ display: 'flex', flexDirection: 'column', padding: '5px 5px 20px', alignItems: 'center' }}>
          <div style={{ padding: '1px 10px 5px' }}>
            <h4>
              {t.tag.label ?? t.tag.value}
              <b style={{ paddingLeft: '8px', fontSize: '1.5em' }}>{numFormat(sumBy(t.nodes, n => n.data.val ?? 0))}</b>
            </h4>
          </div>
          <TagPack {...t} {...{ zoom, packSize, imgLoaded, channelClick }} />
        </div>
      )}
    </div>
  </>,
    [measure, imgLoaded, channels, zoom])

  return <div id='page'>
    {chart}
    {imgLoaded &&
      <TipStyle>
        <ReactTooltip
          effect='solid'
          backgroundColor='var(--bg)'
          border
          textColor='var(--fg)'
          borderColor='var(--bg2)'
          className='tip'
          getContent={(id: string) => id ? <ChannelInfo channel={chanById[id]} measure={measure} size='min' /> : <></>} />
      </TipStyle>}
    {openChannel &&
      <Modal
        isOpen={openChannel != null}
        ariaHideApp={false}
        parentSelector={() => document.querySelector('#page')}
        onRequestClose={() => setOpenChannel(null)}
        style={{
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
        }}
      >
        <ChannelInfo channel={openChannel} measure={measure} size='max' />
      </Modal>}
  </div>
}


interface TagPackExtra { zoom: number, packSize: number, imgLoaded: boolean, channelClick: (c: ChannelStats) => void }

const TagPack = ({ nodes, dim, zoom, imgLoaded, channelClick: onChannelClick }: {} & TagNodes & TagPackExtra) => {

  const size = dim.size * zoom
  const dx = -dim.x.min.x + dim.x.min.r
  const dy = -dim.y.min.y + dim.y.min.r

  return <svg width={size} height={size} style={{}}>
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
