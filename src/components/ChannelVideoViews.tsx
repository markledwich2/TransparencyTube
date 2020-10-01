import { useState, useEffect, useMemo } from 'react'
import React from 'react'
import { hoursFormat, numFormat, preloadImages } from '../common/Utils'
import { InlineSelect, Opt } from './InlineSelect'
import ReactTooltip from 'react-tooltip'
import { getChannels, imagesToLoad, GroupedNodes, channelMd, buildTagNodes, DisplayCfg, Channel, TagNodes, periodOptions, measureFormat } from '../common/Channel'
import { ChannelInfo } from './Channel'
import { sumBy } from '../common/Pipe'
import { first, indexBy } from 'remeda'
import styled, { AnyStyledComponent } from 'styled-components'
import Modal from 'react-modal'
import ContainerDimensions from 'react-container-dimensions'
import { Videos } from './Video'
import { Tip } from './Tooltip'
import { ChannelStats, ChannelWithStats, getViewsIndexes, StatsPeriod, VideoViews, VideoViewsIndex, ViewsIndexes } from '../common/RecfluenceApi'
import { periodLabel } from '../common/Video'

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
  const [channels, setChannels] = useState<Record<string, Channel>>()
  const [openChannel, setOpenChannel] = useState<ChannelWithStats>(null)
  const [indexes, setIndexes] = useState<ViewsIndexes>(null)

  useEffect(() => {
    const go = async () => {
      const channelsTask = getChannels()
      try {
        setIndexes(await getViewsIndexes())
      }
      catch (e) {
        console.log('error getting view indexes', e)
      }
      const channels = indexBy(await channelsTask, c => c.channelId)
      setChannels(channels)
    }
    go()
  }, [])

  if (!channels) return <></>
  return <div id='page'>
    <ContainerDimensions >
      {({ width }) => <Bubbles channels={channels} width={width} onOpenChannel={c => setOpenChannel(c)} indexes={indexes} />}
    </ContainerDimensions>
    <div style={{ height: '1em' }} />
    <Videos channels={channels} onOpenChannel={c => setOpenChannel(c)} indexes={indexes} />
    {openChannel &&
      <Modal
        isOpen={openChannel != null}
        ariaHideApp={false}
        parentSelector={() => document.querySelector('#page')}
        onRequestClose={() => setOpenChannel(null)}
        style={modalStyle}
      >
        <ChannelInfo channel={openChannel} size='max' indexes={indexes} />
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

const groupOptions: Opt<keyof Channel>[] = [
  { value: 'tags', label: 'tag' },
  { value: 'lr', label: 'left/right' },
  { value: 'media', label: 'media' }
]

interface BubblesProps { channels: Record<string, Channel>, width: number, onOpenChannel: (c: ChannelWithStats) => void, indexes: ViewsIndexes }

const Bubbles = ({ channels, width, onOpenChannel, indexes }: BubblesProps) => {
  const [display, setDisplay] = useState<DisplayCfg>({ measure: 'views', groupBy: 'tags', colorBy: 'lr', period: first(indexes.periods) })
  const [imagesLoaded, setImagesLoaded] = useState(new Set<string>([]))
  const [stats, setStats] = useState<Record<string, ChannelWithStats>>(null)

  const { groupedNodes, zoom, packSize } = useMemo(() => {
    return stats ? buildTagNodes(Object.values(stats), display, width) : { groupedNodes: [], zoom: 1, packSize: 1 } as TagNodes
  }, [stats, display, width])

  useEffect(() => {
    const go = async () => {
      if (!['views', 'watchHours'].includes(display.measure)) return Object.values(channels)
      const rawStats = await indexes.channelStats.getRows(display.period)
      const stats = indexBy(rawStats.map(s => ({ ...channels[s.channelId], ...s })), c => c.channelId)
      setStats(stats)
    }
    go()
  }, [display.period, display.measure, indexes, channels])

  useEffect(() => {
    if (!groupedNodes) return
    const existingLoaded = new Set([...imagesLoaded])
    setImagesLoaded(new Set([])) // clear this so that bubble images are removed then added toi avoid artifacts that occur
    const images = imagesToLoad(groupedNodes, existingLoaded)
    const go = async () => {
      await preloadImages(images)
      setImagesLoaded(new Set([...existingLoaded, ...images]))
      ReactTooltip.rebuild()
    }
    go()
  }, [stats, display.groupBy, groupedNodes])

  const channelClick = (c: ChannelWithStats) => {
    ReactTooltip.hide()
    onOpenChannel(c)
  }

  const measureFmt = measureFormat(display.measure)

  const bubblesChart = useMemo(() => {
    return <>
      <h3 style={{ padding: '0.5em 1em' }}>Political YouTube channel's
        <InlineSelect options={channelMd.measures} value={display.measure} onChange={o => setDisplay({ ...display, measure: o as any })} />

        {['views', 'watchHours'].includes(display.measure) && <InlineSelect
          options={periodOptions(indexes.periods)}
          value={display.period}
          onChange={o => setDisplay({ ...display, period: o as any })} />
        }
        by
        <InlineSelect options={groupOptions} value={display.groupBy} onChange={o => {
          const cb = display.colorBy == o ? (o == 'lr' ? 'tags' : 'lr') : o //when changing the group, switch colorBy to sensible default
          setDisplay({ ...display, groupBy: o, colorBy: cb })
        }} />
        and colored by
        <InlineSelect options={groupOptions} value={display.colorBy} onChange={o => setDisplay({ ...display, colorBy: o })} />
      </h3>
      <div style={{ display: 'flex', flexDirection: 'row', flexFlow: 'wrap' }}>
        {groupedNodes && groupedNodes.map(t => <BubbleDiv key={t.group.value}>
          <div style={{ padding: '2px' }}>
            <h4>
              <span style={{ color: 'var(--fg2)' }}>{t.group.label ?? t.group.value}</span>
              <b style={{ paddingLeft: '8px', fontSize: '1.5em' }}>{measureFmt(sumBy(t.nodes, n => n.data.val ?? 0))}</b>
            </h4>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <TagPack {...t} {...{ zoom, packSize, imagesLoaded, channelClick }} /></div>
        </BubbleDiv>
        )}
      </div>
    </>
  },
    [display, imagesLoaded, groupedNodes, zoom])


  return <div>
    <Tip id='bubble' getContent={(id: string) => id ? <ChannelInfo channel={stats[id]} size='min' indexes={indexes} /> : <></>} />
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
  const imgRatio = 0.9
  const channelNodes = nodes.filter(n => n.data.type == 'channel')
    .map(n => ({
      ...n,
      x: (n.x + dx) * zoom,
      y: (n.y + dy) * zoom,
      r: n.r * zoom,
      id: n.data.key
    }))
  return <svg width={dim.w * z} height={dim.h * z} style={{}}>
    <defs>
      {channelNodes.map(n => <clipPath key={n.id} id={`clip-${n.id}`}><circle r={n.r * imgRatio} /></clipPath >)}
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
        return <GStyle key={id} transform={`translate(${x}, ${y})`}>
          <circle r={r} fill={n.data.color} {...props} />
          {n.data.img && imagesLoaded.has(n.data.img) &&
            <image x={- r * imgRatio} y={- r * imgRatio} width={r * imgRatio * 2}
              href={n.data.img} clipPath={`url(#clip-${n.id})`} {...props} />}
        </GStyle>
      }
      )}
    </g>
  </svg>
}
