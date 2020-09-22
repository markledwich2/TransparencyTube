import { useState, useEffect, useMemo } from 'react'
import React from 'react'
import { numFormat, preloadImages } from '../common/Utils'
import { InlineSelect, Opt } from './InlineSelect'
import ReactTooltip from 'react-tooltip'
import { ChannelStats, getChannels, imagesToLoad, GroupedNodes, channelMd, buildTagNodes, DisplayCfg } from '../common/Channel'
import { ChannelInfo } from './Channel'
import { sumBy } from '../common/Pipe'
import { indexBy } from 'remeda'
import styled, { AnyStyledComponent } from 'styled-components'
import Modal from 'react-modal'
import ContainerDimensions from 'react-container-dimensions'
import { Videos } from './Video'
import { Tip } from './Tooltip'


const modalStyle = {
  overlay: {
    backgroundColor: 'none',
    backdropFilter: 'blur(15px)'
  },
  content: {
    backgroundColor: 'var(--bg)',
    opacity: 1,
    padding: '1em',
    border: 'solid 1px var(--bg2)',
    borderRadius: '10px',
    maxWidth: '100vw',
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
      {({ width }) => <Bubbles channels={channels} width={width} onOpenChannel={c => setOpenChannel(c)} />}
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

const groupOptions: Opt<keyof ChannelStats>[] = [
  { value: 'tags', label: 'tag' },
  { value: 'lr', label: 'left/right' },
  { value: 'media', label: 'media' }
]

const Bubbles = ({ channels, width, onOpenChannel }: { channels: Record<string, ChannelStats>, width: number, onOpenChannel: (c: ChannelStats) => void }) => {
  const [display, setDisplay] = useState<DisplayCfg>({ measure: 'views7', groupBy: 'tags', colorBy: 'lr' })
  const [imagesLoaded, setImagesLoaded] = useState(new Set<string>([]))

  const { groupedNodes, zoom, packSize } = useMemo(() => {
    return buildTagNodes(channels, display, width)
  }, [channels, display, width])

  useEffect(() => {
    const images = imagesToLoad(groupedNodes, imagesLoaded)
    if (images.length > 0) {
      console.log('loaded images', images.length)
      preloadImages(images)
        .then(() => {
          return setImagesLoaded(new Set([...imagesLoaded, ...images]))
        })
    }
  }, [display])

  const channelClick = (c: ChannelStats) => {
    ReactTooltip.hide()
    onOpenChannel(c)
    console.log('openChannel')
  }

  const bubblesChart = useMemo(() => {
    console.log('bubble chart render')
    useEffect(() => { ReactTooltip.rebuild() })
    return <>
      <h3 style={{ padding: '0.5em 1em' }}>Political YouTube channel's
        <InlineSelect options={channelMd.measures} value={display.measure} onChange={o => setDisplay({ ...display, measure: o as any })} />
        by
        <InlineSelect options={groupOptions} value={display.groupBy} onChange={o => {
          const cb = display.colorBy == o ? (o == 'lr' ? 'tags' : 'lr') : o //when changing the group, switch colorBy to sensible default
          setDisplay({ ...display, groupBy: o, colorBy: cb })
        }} />
        and colored by
        <InlineSelect options={groupOptions} value={display.colorBy} onChange={o => setDisplay({ ...display, colorBy: o })} />
      </h3>
      <div style={{ display: 'flex', flexDirection: 'row', flexFlow: 'wrap' }}>
        {groupedNodes.map(t => <BubbleDiv key={t.group.value}>
          <div style={{ padding: '2px' }}>
            <h4>
              <span style={{ color: 'var(--fg2)' }}>{t.group.label ?? t.group.value}</span>
              <b style={{ paddingLeft: '8px', fontSize: '1.5em' }}>{numFormat(sumBy(t.nodes, n => n.data.val ?? 0))}</b>
            </h4>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <TagPack {...t} {...{ zoom, packSize, imagesLoaded, channelClick }} /></div>
        </BubbleDiv>
        )}
      </div>
    </>
  },
    [display, imagesLoaded, channels, zoom])


  return <div>
    <Tip id='bubble' getContent={(id: string) => id ? <ChannelInfo channel={channels[id]} size='min' /> : <></>} />
    {bubblesChart}
  </div>
}


const GStyle = styled.g`
  .node {
    :hover {
      cursor:pointer;
    }
  }
`

interface PackExtra { zoom: number, packSize: number, imagesLoaded: Set<string>, channelClick: (c: ChannelStats) => void }
const TagPack = ({ nodes, dim, zoom, imagesLoaded, channelClick: onChannelClick }: {} & GroupedNodes & PackExtra) => {
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
          {n.data.img && imagesLoaded.has(n.data.img) &&
            <image x={x - r * 0.9} y={y - r * 0.9} width={r * 0.9 * 2}
              href={n.data.img} style={{ clipPath: 'circle()' }}{...props} />}
        </GStyle>
      }
      )}
    </g>
  </svg>
}
