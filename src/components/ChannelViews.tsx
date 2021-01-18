import { useState, useEffect } from 'react'
import React from 'react'
import { delay, navigateNoHistory } from '../common/Utils'
import { InlineSelect } from './InlineSelect'
import ReactTooltip from 'react-tooltip'
import { BubblesSelectionState } from '../common/Bubble'
import { getChannels, md, Channel, ColumnMdOpt, getColOptions } from '../common/Channel'
import { ChannelDetails, ChannelSearch } from './Channel'
import { values } from '../common/Pipe'
import { indexBy } from 'remeda'
import styled from 'styled-components'
import ContainerDimensions from 'react-container-dimensions'
import { ChannelStats, ChannelViewIndexes, ChannelWithStats, indexChannelViews, indexPeriods } from '../common/RecfluenceApi'
import { NormalFont } from './Layout'
import { useQuery } from '../common/QueryString'
import { useLocation } from '@reach/router'
import { Spinner } from './Spinner'
import { parsePeriod, PeriodSelect, periodString, Period } from './Period'
import { TagInfo, TagTip } from './TagInfo'
import { Markdown } from './Markdown'
import { Popup } from './Popup'
import { BubbleCharts } from './BubbleChart'
import { FilterHeader } from './FilterCommon'
import { ColumnValueMd } from '../common/Metadata'

interface QueryState extends BubblesSelectionState<Channel> {
  videoPeriod?: string
}

export const ChannelViewsPage = () => {
  const [channels, setChannels] = useState<Record<string, Channel>>()
  const [indexes, setIndexes] = useState<ChannelViewIndexes>(null)
  const [defaultPeriod, setDefaultPeriod] = useState<Period>(null)
  const [q, setQuery] = useQuery<QueryState>(useLocation(), navigateNoHistory)

  useEffect(() => {
    getChannels().then(chans => setChannels(indexBy(chans, c => c.channelId)))
    indexChannelViews().then(idx => {
      try {
        setIndexes(idx)
        const periods = idx ? indexPeriods(idx.channelStatsByPeriod) : []
        setDefaultPeriod(periods.find(p => p.type == 'd7'))
      }
      catch (e) {
        console.error('error getting view indexes', e)
      }
    })
  }, [])

  const openChannel = q.openRowKey ? channels?.[q.openRowKey] : null
  const onOpenChannel = (c: Channel) => setQuery({ openRowKey: c?.channelId, openGroup: null })
  const onCloseChannel = () => setQuery({ openRowKey: null })

  return <div style={{ minHeight: '100vh' }}>
    {channels && defaultPeriod && indexes && <>
      <ContainerDimensions >
        {({ width }) => <Bubbles
          channels={channels}
          width={width}
          onOpenChannel={onOpenChannel}
          onSelection={setQuery}
          indexes={indexes}
          selections={q}
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
  width: number,
  onOpenChannel: (c: ChannelWithStats) => void
  indexes: ChannelViewIndexes
  selections: BubblesSelectionState<Channel>
  onSelection: (d: BubblesSelectionState<ChannelWithStats>) => void
  defaultPeriod?: Period
  onLoad?: () => void
}

const Bubbles = ({ channels, width, onOpenChannel, indexes, selections, onSelection, defaultPeriod, onLoad }: BubblesProps) => {
  const [rawStats, setRawStats] = useState<ChannelStats[]>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [showImg] = useState(true) // always render sans image first

  const period = parsePeriod(selections.period) ?? defaultPeriod
  const derivedSelections: BubblesSelectionState<Channel> = { ...{ measure: 'views', colorBy: 'lr', groupBy: 'tags' }, ...selections }
  const { measure, colorBy, groupBy } = derivedSelections

  const stats = rawStats ? rawStats.map(s => ({ ...channels[s.channelId], ...s })) : null

  const bubbleWidth = Math.min(800, width)

  useEffect(() => {
    const go = async () => {
      setLoading(true)
      await delay(1)
      const rawStats = await indexes.channelStatsByPeriod.rows({ period: periodString(period) })
      setRawStats(rawStats)
      setLoading(false)
      await delay(1000) // wait a sec before rebuilding tooltips. This makes it work more consistently but i'm not sure why
      ReactTooltip.rebuild()
      onLoad?.()
    }
    go()
  }, [periodString(period), indexes, channels])

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
          onChange={o => onSelection?.({ measure: o as any })}
          itemRender={MeasureOption}
        />
        {['views', 'watchHours'].includes(measure) && <PeriodSelect
          periods={indexPeriods(indexes.channelStatsByPeriod)}
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
      <ChannelSearch onSelect={c => onSelection({ openRowKey: c.channelId })} channels={values(channels)} sortBy='channelViews' />
    </div>


    <BubbleCharts<ChannelWithStats>
      {... {

      }}
      onSelect={channelClick}
      bubbleWidth={bubbleWidth}
      dataCfg={{
        key: r => r.channelId,
        image: r => r.logoUrl,
        title: r => r.channelTitle
      }}
      groupRender={(g, rows) => groupBy == 'tags' && <TagInfo tag={g} channels={rows} />}
      onOpenGroup={(g) => onSelection({ openGroup: g })}
      rows={stats}
      loading={loading}
      showImg={showImg}
      selections={derivedSelections}
      tipContent={c => <ChannelDetails
        channel={c}
        mode='min'
        indexes={indexes}
        defaultPeriod={period}
      />}
    />

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
