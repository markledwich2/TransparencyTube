import { useState, useEffect, memo } from 'react'
import React from 'react'
import { delay, jsonEquals, shallowEquals } from '../common/Utils'
import { InlineSelect } from './InlineSelect'
import ReactTooltip from 'react-tooltip'
import { getChannels, GroupedNodes, channelMd, buildTagNodes, BubblesSelectionState, Channel, TagNodes, measureFormat, channelColOpts, ColumnValueMd, ColumnMdOpt, PageSelectionState } from '../common/Channel'
import { ChannelDetails, ChannelTitle } from './Channel'
import { orderBy, sumBy, values } from '../common/Pipe'
import { indexBy } from 'remeda'
import styled from 'styled-components'
import ContainerDimensions from 'react-container-dimensions'
import { Videos } from './Video'
import { Tip } from './Tooltip'
import { ChannelStats, ChannelWithStats, getViewsIndexes, ViewsIndexes } from '../common/RecfluenceApi'
import { loadingFilter, NormalFont } from './Layout'
import { useQuery } from '../common/QueryString'
import { useLocation } from '@reach/router'
import { Spinner } from './Spinner'
import { InlineVideoFilter, VideoFilter } from './VideoFilter'
import { parsePeriod, PeriodSelect, periodString, StatsPeriod } from './Period'
import { TagHelp, TagTip } from './TagInfo'
import { Markdown } from './Markdown'
import { SearchSelect } from './SearchSelect'
import { Popup } from './Popup'

interface QueryState extends Record<string, string>, BubblesSelectionState {
  videoPeriod?: string
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
  const [allowVideoLoad, setAllowVideoLoad] = useState(false)

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

  const period = parsePeriod(q.period) ?? defaultPeriod
  const videoPeriod = parsePeriod(q.videoPeriod) ?? defaultPeriod
  const openChannel = q.openChannelId ? channels?.[q.openChannelId] : null
  const onOpenChannel = (c: Channel) => setQuery({ openChannelId: c.channelId })
  const onCloseChannel = () => setQuery({ openChannelId: null })
  const onQuery = (s: BubblesSelectionState) => setQuery({ ...q, ...s })

  return <div style={{ minHeight: '100vh' }}>
    {channels && defaultPeriod && indexes && <>
      <ContainerDimensions >
        {({ width }) => <Bubbles
          channels={channels}
          width={width}
          onOpenChannel={onOpenChannel}
          indexes={indexes}
          selections={q}
          onSelection={onQuery}
          defaultPeriod={defaultPeriod}
          onLoad={() => !allowVideoLoad ? setAllowVideoLoad(true) : null}
        />}
      </ContainerDimensions>
      <div style={{ height: '2em' }} />

      {indexes && allowVideoLoad && <>
        <FilterHeader style={{ marginBottom: '2em' }}>Top viewed videos in
      <PeriodSelect periods={indexes.periods} period={videoPeriod} onPeriod={(p) => {
            if (p == period) return
            setQuery({ videoPeriod: periodString(p) })
          }} />

        filtered to <InlineVideoFilter filter={videoFilter} onFilter={setVideoFilter} />
        </FilterHeader>
        <Videos channels={channels} onOpenChannel={onOpenChannel} indexes={indexes} period={videoPeriod} videoFilter={videoFilter} />
      </>
      }

      <Popup isOpen={openChannel != null} onRequestClose={onCloseChannel}>
        <ChannelDetails channel={openChannel} mode='max' indexes={indexes} defaultPeriod={defaultPeriod} />
      </Popup>
    </>}

  </div >
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

interface BubblesProps {
  channels: Record<string, Channel>
  width: number, onOpenChannel: (c: ChannelWithStats) => void
  indexes: ViewsIndexes
  selections: BubblesSelectionState
  onSelection?: (d: PageSelectionState) => void
  defaultPeriod?: StatsPeriod
  onLoad?: () => void
}

const Bubbles = memo(({ channels, width, onOpenChannel, indexes, selections, onSelection, defaultPeriod, onLoad }: BubblesProps) => {
  const [rawStats, setRawStats] = useState<ChannelStats[]>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [showImg] = useState(true) // always render sans image first

  const period = parsePeriod(selections.period) ?? defaultPeriod
  const derivedSelections = { ...{ measure: 'views', colorBy: 'lr', groupBy: 'tags' }, ...selections } as BubblesSelectionState
  const { measure, colorBy, groupBy } = derivedSelections

  const bubbleWidth = width > 800 ? 800 : 400

  const stats = rawStats ? indexBy(rawStats.map(s => ({ ...channels[s.channelId], ...s })), c => c.channelId) : null
  const { groupedNodes, zoom, packSize } = stats ?
    buildTagNodes(Object.values(stats), derivedSelections, bubbleWidth) :
    { groupedNodes: [], zoom: 1, packSize: 1 } as TagNodes

  useEffect(() => {
    const go = async () => {
      // const start = new Date()
      setLoading(true)
      await delay(1)
      // let start2 = new Date()
      const rawStats = await indexes.channelStatsByPeriod.getRows(period)
      // console.log('rawStats ms', differenceInMilliseconds(new Date(), start2))
      //setShowImg(false)
      // start2 = new Date()
      setRawStats(rawStats)
      // console.log('setRawStats ms', differenceInMilliseconds(new Date(), start2))
      setLoading(false)
      await delay(1000)
      ReactTooltip.rebuild()
      onLoad?.()
      //setShowImg(true)
      // console.log('useEffect ms', differenceInMilliseconds(new Date(), start))
    }
    go()
  }, [JSON.stringify(period), indexes, channels])

  useEffect(() => { ReactTooltip.rebuild() }, [groupBy])

  const channelClick = (c: ChannelWithStats) => {
    ReactTooltip.hide()
    onOpenChannel(c)
  }

  if (!rawStats) return <Spinner />

  const filterOnRight = width > 800

  return <div>
    <Tip id='bubble' getContent={(id: string) => id ? <ChannelDetails
      channel={stats[id]}
      mode='min'
      indexes={indexes}
      defaultPeriod={period}
    /> : <></>} />

    <TagTip channels={values(channels)} />

    <div style={{ display: 'flex', flexDirection: filterOnRight ? 'row' : 'column', justifyContent: filterOnRight ? 'space-between' : null }}>
      <FilterHeader style={{ padding: '0.5em 1em' }}>Political YouTube channel
        <InlineSelect
          options={channelMd.measures.values}
          selected={measure}
          onChange={o => onSelection({ ...selections, measure: o as any })}
          itemRender={MeasureOption}
        />
        {['views', 'watchHours'].includes(measure) && <PeriodSelect
          periods={indexes.periods}
          period={period}
          onPeriod={o => onSelection({ ...selections, period: periodString(o) })} />
        }
        by
        <InlineSelect
          options={channelColOpts}
          selected={groupBy} onChange={o => {
            const cb = colorBy == o ? (o == 'lr' ? 'tags' : 'lr') : o //when changing the group, switch colorBy to sensible default
            onSelection({ ...selections, groupBy: o, colorBy: cb })
          }}
          itemRender={ColOption}
        />
        and colored by
        <InlineSelect
          options={channelColOpts}
          selected={colorBy}
          onChange={o => onSelection({ ...selections, colorBy: o })}
          itemRender={ColOption}
        />
      </FilterHeader>
      <SearchSelect
        popupStyle={{ right: filterOnRight ? '0px' : null }}
        onSelect={(c: Channel) => onSelection({ ...selections, openChannelId: c.channelId })}
        search={(q) => new Promise((resolve) => resolve(
          orderBy(
            values(channels).filter(f => f.channelTitle.match(new RegExp(`${q}`, 'i'))),
            c => c.channelViews, 'desc')
        ))}
        itemRender={(c: Channel) => <ChannelTitle c={c} showLr style={{ width: filterOnRight ? '50em' : '95vw' }} />}
        getKey={c => c.channelId}
        getLabel={c => c.channelTitle}
        placeholder='find channel'
      />
    </div>

    <div style={{ display: 'flex', flexDirection: 'row', flexFlow: 'wrap', filter: loading ? loadingFilter : null }}>
      <BubbleChart {... { groupedNodes, selections: derivedSelections, zoom, packSize, channelClick, showImg }} key={JSON.stringify(period)} />
    </div>
  </div>
}, (a, b) => {
  return bubbleEquals(a, b)
})

function bubbleEquals(a: Readonly<BubblesProps>, b: Readonly<BubblesProps>) {
  const bubbleSelections = ({ colorBy, groupBy, measure, period }: BubblesSelectionState) => ({ colorBy, groupBy, measure, period })
  const shallowProps = (p: BubblesProps) => {
    const { selections, onOpenChannel, onLoad, onSelection, ...rest } = p
    return rest
  }
  const res = shallowEquals(shallowProps(a), shallowProps(b))
    && jsonEquals(bubbleSelections(a.selections), bubbleSelections(b.selections))
  return res
}

const MeasureOptionStyle = styled.div`
  padding: 0.1em 0 0.2em 0;
  min-width:20rem;
  width:30rem;
  max-width:90vw;
`

const ColOption = (o: ColumnMdOpt) => <MeasureOptionStyle><NormalFont>
  <b>{o.label}</b><Markdown source={o.desc} />
</NormalFont></MeasureOptionStyle>

export const MeasureOption = (o: ColumnValueMd<string>) => <MeasureOptionStyle><NormalFont>
  <b>{o.label}</b><Markdown source={o.desc} />
</NormalFont></MeasureOptionStyle>

interface BubbleChartProps extends PackExtra { groupedNodes: GroupedNodes[], selections: BubblesSelectionState }

const BubbleChart = ({ groupedNodes, selections, ...extra }: BubbleChartProps) => {
  const measureFmt = measureFormat(selections.measure)
  return <>
    {groupedNodes && groupedNodes.map(t => <BubbleDiv key={t.group.value}>
      <div style={{ padding: '2px' }}>
        <h4>
          <span style={{ color: 'var(--fg2)' }}>{t.group.label ?? t.group.value}</span>
          <span style={{ padding: '0 0.5em' }} >{selections.groupBy == 'tags' && <TagHelp tag={t.group.value} />}</span>
          <b style={{ fontSize: '1.5em' }}>{measureFmt(sumBy(t.nodes, n => n.data.val ?? 0))}</b>
        </h4>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <TagPack {...t} {...extra} />
      </div>
    </BubbleDiv>
    )}</>
}

const SVGStyle = styled.svg`
  .node {
    :hover {
      cursor:pointer;
    }
  }
`

interface PackExtra { zoom: number, packSize: number, channelClick: (c: ChannelStats) => void, showImg: boolean, key: string }
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

