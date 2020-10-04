import { useState, useEffect, useMemo } from 'react'
import React from 'react'
import { delay, hoursFormat, numFormat, preloadImages } from '../common/Utils'
import { InlineSelect, Opt } from './InlineSelect'
import ReactTooltip from 'react-tooltip'
import { getChannels, imagesToLoad, GroupedNodes, channelMd, buildTagNodes, DisplayCfg, Channel, TagNodes, measureFormat } from '../common/Channel'
import { ChannelDetails } from './Channel'
import { sumBy } from '../common/Pipe'
import { first, indexBy } from 'remeda'
import styled, { AnyStyledComponent } from 'styled-components'
import Modal from 'react-modal'
import ContainerDimensions from 'react-container-dimensions'
import { Videos } from './Video'
import { Tip } from './Tooltip'
import { ChannelStats, ChannelWithStats, getViewsIndexes, VideoViews, VideoViewsIndex, ViewsIndexes } from '../common/RecfluenceApi'
import { loadingFilter } from './Layout'
import { useQuery } from '../common/QueryString'
import { useLocation } from '@reach/router'
import { Spinner } from './Spinner'
import { InlineVideoFilter, VideoFilter } from './VideoFilter'
import { parsePeriod, periodOptions, PeriodSelect, periodString, StatsPeriod } from './Period'

const modalStyle = {
  overlay: {
    backgroundColor: 'none',
    backdropFilter: 'brightness(0.4)'
  },
  content: {
    backgroundColor: 'var(--bg)',
    opacity: 1,
    padding: '1em',
    border: 'solid 1px var(--bg2)',
    borderRadius: '10px',
    maxWidth: '100vw',
    minWidth: "70vw",
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

interface QueryState extends Record<string, string> {
  period: string,
  videoPeriod: string
  openChannelId: string
}

const FilterHeader = styled.h3`
  line-height:2em;
`

const navigate = (to: string) => history.replaceState({}, '', to)

export const ChannelVideoViewsPage = () => {
  const [channels, setChannels] = useState<Record<string, Channel>>()
  const [indexes, setIndexes] = useState<ViewsIndexes>(null)
  const [defaultPeriod, setDefaultPeriod] = useState<StatsPeriod>(null)
  const [q, setQuery] = useQuery<QueryState>(useLocation(), navigate)
  const [videoFilter, setVideoFilter] = useState<VideoFilter>({ tags: null, lr: null })

  useEffect(() => {
    const go = async () => {
      const channelsTask = getChannels()
      try {
        const idx = await getViewsIndexes()
        setIndexes(idx)
        setDefaultPeriod(idx?.periods.find(p => p.periodType == 'd7'))
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

  const period = parsePeriod(q.period) ?? defaultPeriod
  const videoPeriod = parsePeriod(q.videoPeriod) ?? period
  const openChannel = q.openChannelId ? channels[q.openChannelId] : null
  const onOpenChannel = (c: Channel) => setQuery({ openChannelId: c.channelId })
  const onCloseChannel = () => setQuery({ openChannelId: null })

  if (!channels) return <Spinner />

  return <div id='page'>
    <ContainerDimensions >
      {({ width }) => <Bubbles channels={channels} width={width > 800 ? 800 : 400}
        onOpenChannel={onOpenChannel} indexes={indexes} period={period}
        onPeriodChange={p => {
          setQuery({ period: periodString(p) })
        }} />}
    </ContainerDimensions>
    <div style={{ height: '2em' }} />

    <FilterHeader style={{ marginBottom: '2em' }}>Top viewed videos in
    <PeriodSelect indexes={indexes} period={videoPeriod} onPeriod={(p) => {
        if (p == period) return
        setQuery({ videoPeriod: periodString(p) })
      }} />

      filtered to <InlineVideoFilter filter={videoFilter} onFilter={setVideoFilter} />
    </FilterHeader>

    <Videos channels={channels} onOpenChannel={onOpenChannel} indexes={indexes} period={videoPeriod} videoFilter={videoFilter} />

    {openChannel &&
      <Modal
        isOpen={openChannel != null}
        ariaHideApp={false}
        parentSelector={() => document.querySelector('#page')}
        onRequestClose={onCloseChannel}
        style={modalStyle}
      >
        <ChannelDetails channel={openChannel} size='max' indexes={indexes} defaultPeriod={defaultPeriod} />
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

interface BubblesProps {
  channels: Record<string, Channel>,
  width: number, onOpenChannel: (c: ChannelWithStats) => void,
  indexes: ViewsIndexes,
  period: StatsPeriod
  onPeriodChange?: (p: StatsPeriod) => void
}

const Bubbles = ({ channels, width, onOpenChannel, indexes, period, onPeriodChange }: BubblesProps) => {
  const [display, setDisplay] = useState<DisplayCfg>({ measure: 'views', groupBy: 'tags', colorBy: 'lr' })
  const [rawStats, setRawStats] = useState<ChannelStats[]>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [showImg, setShowImg] = useState(false) // always render sans image first

  const stats = rawStats ? indexBy(rawStats.map(s => ({ ...channels[s.channelId], ...s })), c => c.channelId) : null

  const { groupedNodes, zoom, packSize } = useMemo(() => {
    return stats ? buildTagNodes(Object.values(stats), display, width) : { groupedNodes: [], zoom: 1, packSize: 1 } as TagNodes
  }, [stats, display, width])

  useEffect(() => {
    const go = async () => {
      setLoading(true)
      const rawStats = await indexes.channelStats.getRows(period)
      setShowImg(false)
      setRawStats(rawStats)
      setShowImg(true)
      setLoading(false)
    }
    go()
  }, [period, indexes, channels])

  const channelClick = (c: ChannelWithStats) => {
    ReactTooltip.hide()
    onOpenChannel(c)
  }

  const measureFmt = measureFormat(display.measure)

  return <div>
    <Tip id='bubble' getContent={(id: string) => id ? <ChannelDetails
      channel={stats[id]} size='min'
      indexes={indexes}
      defaultPeriod={period}
    /> : <></>} />

    <FilterHeader style={{ padding: '0.5em 1em' }}>Political YouTube channel
        <InlineSelect options={channelMd.measures} selected={display.measure} onChange={o => setDisplay({ ...display, measure: o as any })} />
      {['views', 'watchHours'].includes(display.measure) && <InlineSelect
        options={periodOptions(indexes.periods)}
        selected={period}
        onChange={o => {
          onPeriodChange && onPeriodChange(o as any)
        }} />
      }
        by
        <InlineSelect options={groupOptions} selected={display.groupBy} onChange={o => {
        const cb = display.colorBy == o ? (o == 'lr' ? 'tags' : 'lr') : o //when changing the group, switch colorBy to sensible default
        setDisplay({ ...display, groupBy: o, colorBy: cb })
      }} />
        and colored by
        <InlineSelect options={groupOptions} selected={display.colorBy} onChange={o => setDisplay({ ...display, colorBy: o })} />
    </FilterHeader>
    <div style={{ display: 'flex', flexDirection: 'row', flexFlow: 'wrap', filter: loading ? loadingFilter : null }}>
      {groupedNodes && groupedNodes.map(t => <BubbleDiv key={t.group.value}>
        <div style={{ padding: '2px' }}>
          <h4>
            <span style={{ color: 'var(--fg2)' }}>{t.group.label ?? t.group.value}</span>
            <b style={{ paddingLeft: '8px', fontSize: '1.5em' }}>{measureFmt(sumBy(t.nodes, n => n.data.val ?? 0))}</b>
          </h4>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <TagPack {...t} {...{ zoom, packSize, channelClick, showImg }} /></div>
      </BubbleDiv>
      )}
    </div>
  </div>
}

const SVGStyle = styled.svg`
  .node {
    :hover {
      cursor:pointer;
    }
  }
`

interface PackExtra { zoom: number, packSize: number, channelClick: (c: ChannelStats) => void, showImg: boolean }
const TagPack = ({ nodes, dim, zoom, channelClick: onChannelClick, group, showImg }: {} & GroupedNodes & PackExtra) => {

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

  //return <div key={new Date().getTime()}>{channelNodes.length}</div>
  return <SVGStyle width={dim.w * z} height={dim.h * z} >
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
          <circle r={r} fill={n.data.color} {...props} />
          {showImg && n.data.img &&
            <image x={- r * imgRatio} y={- r * imgRatio} width={r * imgRatio * 2}
              href={n.data.img} clipPath={`url(#clip-${n.id})`} {...props} />}
        </g>
      }
      )}
    </g>
  </SVGStyle>
}
