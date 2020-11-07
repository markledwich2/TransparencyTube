import { useState, useEffect } from 'react'
import React from 'react'
import { delay, navigateNoHistory } from '../common/Utils'
import { InlineSelect } from './InlineSelect'
import ReactTooltip from 'react-tooltip'
import { buildChannelBubbleNodes, BubblesSelectionState, TagNodes } from '../common/ChannelBubble'
import { getChannels, md, Channel, ColumnMdOpt, getColOptions } from '../common/Channel'
import { ChannelDetails, ChannelTitle } from './Channel'
import { orderBy, values } from '../common/Pipe'
import { indexBy } from 'remeda'
import styled from 'styled-components'
import ContainerDimensions from 'react-container-dimensions'
import { Tip } from './Tooltip'
import { ChannelStats, ChannelViewIndexes, ChannelWithStats, indexChannelViews } from '../common/RecfluenceApi'
import { loadingFilter, NormalFont } from './Layout'
import { useQuery } from '../common/QueryString'
import { useLocation } from '@reach/router'
import { Spinner } from './Spinner'
import { parsePeriod, PeriodSelect, periodString, StatsPeriod } from './Period'
import { TagTip } from './TagInfo'
import { Markdown } from './Markdown'
import { SearchSelect } from './SearchSelect'
import { Popup } from './Popup'
import { BubbleCharts } from './BubbleChart'
import { FilterHeader } from './FilterCommon'
import { ColumnValueMd } from '../common/Metadata'

interface QueryState extends Record<string, string>, BubblesSelectionState {
  videoPeriod?: string
}

export const ChannelViewsPage = () => {
  const [channels, setChannels] = useState<Record<string, Channel>>()
  const [indexes, setIndexes] = useState<ChannelViewIndexes>(null)
  const [defaultPeriod, setDefaultPeriod] = useState<StatsPeriod>(null)
  const [q, setQuery] = useQuery<QueryState>(useLocation(), navigateNoHistory)

  useEffect(() => {
    const go = async () => {
      const channelsTask = getChannels()
      try {
        const idx = await indexChannelViews()
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

  const openChannel = q.openChannelId ? channels?.[q.openChannelId] : null
  const onOpenChannel = (c: Channel) => setQuery({ openChannelId: c.channelId, openGroup: null })
  const onCloseChannel = () => setQuery({ openChannelId: null })
  const onQuery = (s: Partial<BubblesSelectionState>) => setQuery(s)

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
        />}
      </ContainerDimensions>
      <div style={{ height: '2em' }} />

      <Popup isOpen={openChannel != null} onRequestClose={onCloseChannel}>
        <ChannelDetails channel={openChannel} mode='max' indexes={indexes} defaultPeriod={defaultPeriod} />
      </Popup>
    </>}

  </div >
}

interface BubblesProps {
  channels: Record<string, Channel>
  width: number, onOpenChannel: (c: ChannelWithStats) => void
  indexes: ChannelViewIndexes
  selections: BubblesSelectionState
  onSelection?: (d: BubblesSelectionState) => void
  defaultPeriod?: StatsPeriod
  onLoad?: () => void
}

const Bubbles = ({ channels, width, onOpenChannel, indexes, selections, onSelection, defaultPeriod, onLoad }: BubblesProps) => {
  const [rawStats, setRawStats] = useState<ChannelStats[]>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [showImg] = useState(true) // always render sans image first

  const period = parsePeriod(selections.period) ?? defaultPeriod
  const derivedSelections = { ...{ measure: 'views', colorBy: 'lr', groupBy: 'tags' }, ...selections } as BubblesSelectionState
  const { measure, colorBy, groupBy } = derivedSelections

  const bubbleWidth = width > 800 ? 800 : 400

  const stats = rawStats ? indexBy(rawStats.map(s => ({ ...channels[s.channelId], ...s })), c => c.channelId) : null
  const { groupedNodes, zoom, packSize } = stats ?
    buildChannelBubbleNodes(Object.values(stats), derivedSelections, bubbleWidth) :
    { groupedNodes: [], zoom: 1, packSize: 1 } as TagNodes

  useEffect(() => {
    const go = async () => {
      setLoading(true)
      await delay(1)
      const rawStats = await indexes.channelStatsByPeriod.getRows(period)
      setRawStats(rawStats)
      setLoading(false)
      await delay(1000) // wait a sec before rebuilding tooltips. This makes it work more consistently but i'm not sure why
      ReactTooltip.rebuild()
      await delay(1000) // wait a sec before allowing other things to load
      onLoad?.()
    }
    go()
  }, [JSON.stringify(period), indexes, channels])

  useEffect(() => {
    if (selections.groupBy)
      ReactTooltip.rebuild()
  }, [selections.groupBy])

  const channelClick = (c: ChannelWithStats) => {
    ReactTooltip.hide()
    onOpenChannel(c)
  }

  if (!rawStats) return <Spinner />

  const filterOnRight = width > 800
  const colOptions = getColOptions('channel')

  return <div>
    <div style={{ display: 'flex', flexDirection: filterOnRight ? 'row' : 'column', justifyContent: filterOnRight ? 'space-between' : null }}>
      <FilterHeader style={{ padding: '0.5em 1em' }}>Political YouTube channel
        <InlineSelect
          options={md.channel.measures.values}
          selected={measure}
          onChange={o => onSelection({ measure: o as any })}
          itemRender={MeasureOption}
        />
        {['views', 'watchHours'].includes(measure) && <PeriodSelect
          periods={indexes.periods}
          period={period}
          onPeriod={o => onSelection({ period: periodString(o) })} />
        }
        by
        <InlineSelect
          options={colOptions}
          selected={groupBy} onChange={o => onSelection({ groupBy: o })}
          itemRender={ColOption}
        />
        and colored by
        <InlineSelect
          options={colOptions}
          selected={colorBy}
          onChange={o => onSelection({ colorBy: o })}
          itemRender={ColOption}
        />
      </FilterHeader>
      <SearchSelect
        popupStyle={{ right: filterOnRight ? '0px' : null }}
        onSelect={(c: Channel) => onSelection({ openChannelId: c.channelId })}
        search={(q) => new Promise((resolve) => resolve(
          orderBy(
            values(channels).filter(f => f.channelTitle.match(new RegExp(`${q}`, 'i'))),
            c => c.channelViews, 'desc')
        ))}
        itemRender={(c: Channel) => <ChannelTitle c={c} style={{ width: filterOnRight ? '50em' : '95vw' }} />}
        getKey={c => c.channelId}
        getLabel={c => c.channelTitle}
        placeholder='find channel'
      />
    </div>

    <div style={{ display: 'flex', flexDirection: 'row', flexFlow: 'wrap', filter: loading ? loadingFilter : null }}>
      <BubbleCharts
        {... {
          groupedNodes, selections: derivedSelections, channels: values(channels),
          pack: { zoom, packSize, channelClick, showImg, key: JSON.stringify(period) }
        }}
        onOpenGroup={(g) => onSelection({ openGroup: g })}
      />
    </div>

    <Tip id='bubble' getContent={(id: string) => id ? <ChannelDetails
      channel={stats[id]}
      mode='min'
      indexes={indexes}
      defaultPeriod={period}
    /> : <></>} />

    <TagTip channels={values(channels)} />
  </div>
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
