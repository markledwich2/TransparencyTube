import React, { useEffect, useState, FunctionComponent as FC, useMemo, ReactNode, Fragment } from "react"
import { groupBy, indexBy, pick, uniq, } from 'remeda'
import { blobIndex, BlobIndex } from '../common/BlobIndex'
import { Channel, md } from '../common/Channel'
import { useQuery } from '../common/QueryString'
import { ChannelStats, NarrativeVideo, NarrativeCaption, NarrativeCaptionKey, NarrativeIdx, NarrativeChannel, NarrativeKey } from '../common/RecfluenceApi'
import { FilterHeader, FilterPart } from '../components/FilterCommon'
import { FlexRow, styles } from "../components/Style"
import { Videos } from '../components/Video'
import { useLocation } from '@reach/router'
import { delay, navigateNoHistory, numFormat, toJson } from '../common/Utils'
import { filterIncludes, InlineValueFilter } from '../components/ValueFilter'
import ReactTooltip from 'react-tooltip'
import { DateRangeQueryState, DateRangeValue, InlineDateRange, rangeFromQuery, rangeToQuery } from '../components/DateRange'
import { entries, sumBy, values } from '../common/Pipe'
import { BubbleCharts } from '../components/BubbleChart'
import ContainerDimensions from 'react-container-dimensions'
import { ChannelDetails, ChannelLogo, ChannelSearch, Tag } from '../components/Channel'
import { BubblesSelectionState } from '../common/Bubble'
import { CloseOutline } from '@styled-icons/evaicons-outline'
import { Markdown, TextSection } from '../components/Markdown'
import { useTip, Tip } from './Tip'
import { HelpTip } from './HelpTip'
import styled from 'styled-components'


const bubbleKeyString = <T extends { channelId: string }>(r: T, groupBy: keyof T) => `${r.channelId}|${r[groupBy]}`
const bubbleKeyObject = (key: string) => {
  if (!key) return { channelId: null, group: null }
  const [channelId, group] = key.split('|')
  return { channelId, group }
}

export interface NarrativeFilterState extends DateRangeQueryState, BubblesSelectionState<NarrativeChannel> {
  channelId?: string[]
  tags?: string[]
  lr?: string[]
  support?: string[]
  supplement?: string[]
  errorType?: string[]
}

const groupCol = 'support'

export const useNarrative = (narrative = '2020 Election Fraud',
  defaultRange: DateRangeValue = { startDate: new Date(2020, 11 - 1, 3), endDate: new Date(2021, 1 - 1, 31) },
  rawLocation?: boolean, narrativeIndexPrefix = 'narrative',): UseNarrative => {
  const [idx, setIdx] = useState<NarrativeIdx>(null)
  const [q, setQuery] = useQuery<NarrativeFilterState>(rawLocation ? window.location : useLocation(), navigateNoHistory)
  const [videos, setVideos] = useState<(NarrativeVideo)[]>(null)
  const [channels, setChannels] = useState<Record<string, NarrativeChannel>>(null)
  const [loading, setLoading] = useState(false)

  const setVideoFilter = (f: NarrativeFilterState) => setQuery(pick(f, ['tags', 'lr', 'support', 'channelId', 'supplement', 'errorType']))
  const bubbleFilter = pick(q, ['tags', 'lr', 'support', 'supplement', 'errorType'])
  const videoFilter = { ...bubbleFilter, bubbleKey: q.selectedKeys }


  const { dateRange, selectedChannels, videoRows, bubbleRows } = useMemo(() => {
    const dateRange = rangeFromQuery(q, defaultRange.startDate, defaultRange.endDate)

    // aggregate videos into channel/group-by granularity. Use these rows for bubbles
    const bubbleRows = videos && channels && entries(
      groupBy(videos.filter(v => filterIncludes(bubbleFilter, v)), v => bubbleKeyString(v, groupCol))
    )
      .map(([g, vids]) => {
        const { channelId, group } = bubbleKeyObject(g)
        return ({
          bubbleKey: g,
          ...channels[channelId],
          [groupCol]: group,
          views: vids ? sumBy(vids, v => v.videoViews ?? 0) : 0,
          viewsAdjusted: vids ? sumBy(vids, v => v.videoViewsAdjusted ?? 0) : 0,
        }) as NarrativeChannel
      })

    const videoRows = videos?.filter(v => filterIncludes(videoFilter, v))
    const selectedChannels = q.selectedKeys && channels && uniq(q.selectedKeys.map(k => bubbleKeyObject(k).channelId)).map(id => channels[id])

    return { narrative, dateRange, selectedChannels, videoRows, bubbleRows }
  }, [toJson(q), videos, channels, idx])

  useEffect(() => {
    Promise.all([
      blobIndex<NarrativeVideo, NarrativeKey>(`${narrativeIndexPrefix}_videos`, true, "v2.1"),
      blobIndex<NarrativeChannel, NarrativeKey>(`${narrativeIndexPrefix}_channels`, true),
      blobIndex<NarrativeCaption, NarrativeCaptionKey>(`${narrativeIndexPrefix}_captions`)
    ]).then(([videos, channels, captions]) => setIdx({ videos, channels, captions }))
  }, [])

  useEffect(() => { idx?.channels.rows({ narrative }).then(chans => setChannels(indexBy(chans, c => c.channelId))) }, [idx, narrative])

  useEffect(() => {
    if (!idx || !channels) return
    setLoading(true)
    idx.videos.rows(
      { narrative },
      { from: { uploadDate: dateRange.startDate.toISOString() }, to: { uploadDate: dateRange.endDate.toISOString() } }
    ).then(vids => {
      const vidsExtra = vids.map(v => {
        let r = { videoViews: null, videoViewsAdjusted: null, ...v } // for metrics, ensure null instead of undefined to make it easier to work with
        const c = channels[v.channelId]
        if (!c) return r
        r = {
          ...r,
          ...pick(c, ['tags', 'lr']),
          supplement: (['heur_chan', 'heur_tag'].includes(v.supplement)) ? v.supplement : 'manual',
          bubbleKey: bubbleKeyString(r, groupCol) //2nd step so key can be derived from other calculated cols
        }
        return r
      })
      setVideos(vidsExtra)
      setLoading(false)
      delay(200).then(() => ReactTooltip.rebuild())
    })
  }, [idx, channels, JSON.stringify(q)])

  var res = { loading, videoFilter, setVideoFilter, channels, selectedChannels, videoRows, bubbleRows, videos, dateRange, q, setQuery, idx }
  return res
}

interface UseNarrative {
  loading: boolean
  videoFilter: NarrativeFilterState
  setVideoFilter: (f: NarrativeFilterState) => void
  channels: Record<string, NarrativeChannel>
  selectedChannels: NarrativeChannel[]
  videos: NarrativeVideo[]
  videoRows: NarrativeVideo[]
  bubbleRows: NarrativeChannel[]
  dateRange: DateRangeValue
  q: NarrativeFilterState
  setQuery: (values: Partial<NarrativeFilterState>) => void
  idx: NarrativeIdx
}

const supportValues = md.video.support.val
const SupportTag = () => <Tag label={supportValues['support'].label} color={supportValues['support'].color} />
const DisputeTag = () => <Tag label={supportValues['dispute'].label} color={supportValues['dispute'].color} />
const PageStyle = styled.div`
    mark {
        background-color: unset;
        font-weight: bold;
        color:var(--fg);
    }
`

export const NarrativeBubbles: FC<UseNarrative> = ({ videoFilter, setVideoFilter, videos, videoRows, dateRange, channels, selectedChannels,
  q, setQuery, bubbleRows, loading, idx }) => {
  const selections: BubblesSelectionState<NarrativeChannel> = {
    groupBy: groupCol,
    colorBy: 'lr',
    measure: 'views',
    openGroup: q.openGroup,
    selectedKeys: q.selectedKeys
  }

  const channelTip = useTip<Channel>()
  const helpTip = useTip<ReactNode>()

  return <PageStyle><ContainerDimensions>
    {({ width }) => <>
      <TextSection style={{ marginBottom: '1em' }}>
        <p>Channel <b>bubbles</b> are sized by views of their videos discussing voter fraud. Select a channel to filter the videos below.</p>
      </TextSection>
      <FilterHeader style={{ marginBottom: '2em' }}>
        <FilterPart>
          Videos filter
        <InlineValueFilter metadata={md.video} filter={pick(videoFilter, ['support', 'supplement', 'errorType'])} onFilter={setVideoFilter} rows={videos} showCount />
        </FilterPart>
        <FilterPart>
          channel filter
        <InlineValueFilter metadata={md.channel} filter={pick(videoFilter, ['tags', 'lr'])} onFilter={setVideoFilter} rows={videos} showCount />
        </FilterPart>
      in period
      <FilterPart>
          <InlineDateRange
            range={dateRange}
            onChange={r => setQuery(rangeToQuery(r))} />
        </FilterPart>
        <FilterPart>
          from channel
        {channels && selectedChannels && selectedChannels.map(c => <Fragment key={c.channelId}>
          <ChannelLogo c={c} style={{ height: '2em' }} useTip={channelTip} />
          <CloseOutline className='clickable'
            onClick={() => {
              const keys = q.selectedKeys?.filter(k => bubbleKeyObject(k).channelId != c.channelId)
              return setQuery({ selectedKeys: keys?.length > 0 ? keys : null })
            }} />
        </Fragment>)}
          {channels && !q.selectedKeys && <ChannelSearch onSelect={c => {
            const keys = bubbleRows.filter(b => b.channelId == c.channelId).map(b => bubbleKeyString(b, groupCol))
            setQuery({ selectedKeys: keys })
          }} channels={values(channels)} sortBy='views' style={styles.normalFont} />}
        </FilterPart>
      </FilterHeader>
      {bubbleRows && <BubbleCharts<NarrativeChannel>
        rows={bubbleRows}
        bubbleWidth={width > 800 ? 800 : 300}
        selections={selections}
        dataCfg={{
          key: r => `${r.channelId}|${r[groupCol]}`,
          image: r => r.logoUrl,
          title: r => r.channelTitle,
          md: { ...md.channel, ...md.video }
        }}
        loading={loading}
        groupRender={(g, _) => <div style={{ maxWidth: '40em' }}><Markdown>{supportValues[g]?.desc}</Markdown></div>}
        titleSuffixRender={(g, rows) => {
          const fAdjusted = numFormat(sumBy(rows, r => r.viewsAdjusted))
          const fViews = numFormat(sumBy(rows, r => r.views))
          if (fViews == fAdjusted) return null
          return <span> (<b style={{ fontSize: '1.3em' }}>{fAdjusted}</b> bias-adjusted views <HelpTip useTip={helpTip}>
            <p><b>Bias-adjusted views</b> is an estimate of views adjusted for false positive &amp; false negative rates of the our model.</p>
            <ul style={{ marginTop: '1em', marginLeft: '2em', lineHeight: '2em' }}>
              <li><Tag label="manual" /> = 1</li>
              <li><SupportTag /> and uploaded before 2020-12-09 = 0.84 precision / 0.96 recall</li>
              <li><SupportTag /> and uploaded after 2020-12-09 = 0.68 precision / 0.97 recall</li>
              <li><DisputeTag /> and uploaded before 2020-12-09 = 0.84 precision / 0.94 recall</li>
              <li><DisputeTag /> and uploaded after 2020-12-09 = 0.80 precision / 0.97 recall</li>
            </ul>
          </HelpTip>)
          </span>
        }}
        onSelect={(r) => {
          setQuery({ selectedKeys: r == null ? null : [r.bubbleKey] })
        }}
        onOpenGroup={g => {
          setQuery({ openGroup: g })
        }}
        tipContent={r => <ChannelDetails channel={r} mode='min' />}
        style={{ marginBottom: '2em' }} />}
      <TextSection>
        <p><b>Videos</b> with the relevant captions for context. Change filters, or select channels above to filter this list.</p>
      </TextSection>
      <Videos channels={channels} videos={videoRows} groupChannels showTags showChannels showThumb loading={loading}
        defaultLimit={20}
        loadExtraOnVisible={async (vids) => {
          if (!idx?.captions) return []
          const res = await idx.captions.rowsWith(vids.map(v => pick(v, ['narrative', 'channelId', 'videoId'])), { andOr: 'or' })
          return res
        }}
        contentSubTitle={v => {
          const supportOpt = md.video.support.val[v.support]
          const supplementOpt = md.video.supplement.val[v.supplement]
          return <FlexRow>
            {v.support && <Tag label={supportOpt?.label ?? v.support} color={supportOpt?.color} />}
            {v.supplement && <Tag label={supplementOpt?.label ?? v.supplement} color={supplementOpt?.color} />}
          </FlexRow>
        }}
        highlightWords={['trump', 'Fraud', 'fraudulent', 'rigged', 'stole', 'stolen', 'steal', 'theft', 'cheat', 'cheated', 'election', 'vote', 'voted', 'ballot', 'ballots']} />

      <Tip {...helpTip.tipProps}>{helpTip.data}</Tip>
    </>}
  </ContainerDimensions></PageStyle>
}


