import React, { useEffect, useState, FunctionComponent as FC, useMemo } from "react"
import { groupBy, indexBy, pick, uniq } from 'remeda'
import { blobIndex, BlobIndex } from '../common/BlobIndex'
import { Channel, md } from '../common/Channel'
import { useQuery } from '../common/QueryString'
import { ChannelStats, VideoNarrative } from '../common/RecfluenceApi'
import { FilterHeader, FilterPart } from '../components/FilterCommon'
import { styles } from "../components/Style"
import { Videos } from '../components/Video'
import { useLocation } from '@reach/router'
import { delay, navigateNoHistory, toJson } from '../common/Utils'
import { filterIncludes, InlineValueFilter } from '../components/ValueFilter'
import ReactTooltip from 'react-tooltip'
import { DateRangeQueryState, DateRangeValue, InlineDateRange, rangeFromQuery, rangeToQuery } from '../components/DateRange'
import { entries, sumBy, values } from '../common/Pipe'
import { BubbleCharts } from '../components/BubbleChart'
import ContainerDimensions from 'react-container-dimensions'
import { ChannelDetails, ChannelLogo, ChannelSearch } from '../components/Channel'
import { BubblesSelectionState } from '../common/Bubble'
import { CloseOutline } from '@styled-icons/evaicons-outline'
import { Markdown, TextSection } from '../components/Markdown'
import { useTip } from './Tip'

export type NarrativeChannel = Channel & ChannelStats & NarrativeKey & { bubbleKey: string, support: string }

export type NarrativeKey = { narrative?: string, uploadDate?: string }
type NarrativeIdx = {
  videos: BlobIndex<VideoNarrative, NarrativeKey>,
  channels: BlobIndex<NarrativeChannel, NarrativeKey>,
}

const bubbleKeyString = <T extends { channelId: string }>(r: T, groupBy: keyof T) => `${r.channelId}|${r[groupBy]}`
const bubbleKeyObject = (key: string) => {
  if (!key) return { channelId: null, group: null }
  const [channelId, group] = key.split('|')
  return { channelId, group }
}

export interface NarrativeFilterState extends DateRangeQueryState, BubblesSelectionState<NarrativeChannel> {
  channelId?: string[]
  tags?: string[],
  lr?: string[],
  support?: string[],
  supplement?: string[],
  narrative?: string,
  errorType?: string[]
}


const groupCol = 'support'

export const useNarrative = (rawLocation?: boolean): UseNarrative => {
  const [idx, setIdx] = useState<NarrativeIdx>(null)
  const [q, setQuery] = useQuery<NarrativeFilterState>(rawLocation ? window.location : useLocation(), navigateNoHistory)
  const [videos, setVideos] = useState<(VideoNarrative)[]>(null)
  const [channels, setChannels] = useState<Record<string, NarrativeChannel>>(null)
  const [loading, setLoading] = useState(false)

  const setVideoFilter = (f: NarrativeFilterState) => setQuery(pick(f, ['tags', 'lr', 'support', 'channelId', 'supplement', 'errorType']))
  const bubbleFilter = pick(q, ['tags', 'lr', 'support', 'supplement', 'errorType'])
  const videoFilter = { ...bubbleFilter, bubbleKey: q.selectedKeys }


  const { narrative, dateRange, selectedChannels, videoRows, bubbleRows } = useMemo(() => {

    const narrative = q.narrative ?? idx?.videos.cols.narrative?.distinct[0] ?? ''
    const dateRange = rangeFromQuery(q, new Date(2020, 11 - 1, 3), new Date(2020, 11 - 1, 10))

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
          views: vids ? sumBy(vids, v => v.videoViews) : 0
        }) as NarrativeChannel
      })

    const videoRows = videos?.filter(v => filterIncludes(videoFilter, v))
    const selectedChannels = q.selectedKeys && channels && uniq(q.selectedKeys.map(k => bubbleKeyObject(k).channelId)).map(id => channels[id])

    return { narrative, dateRange, selectedChannels, videoRows, bubbleRows }
  }, [toJson(q), videos, channels, idx])

  useEffect(() => {
    Promise.all([
      blobIndex<VideoNarrative, NarrativeKey>('narrative_videos'),
      blobIndex<NarrativeChannel, NarrativeKey>('narrative_channels')
    ]).then(([videos, channels]) => setIdx({ videos, channels }))
  }, [])

  useEffect(() => { idx?.channels.rows({ narrative }).then(chans => setChannels(indexBy(chans, c => c.channelId))) }, [idx, q.narrative])

  useEffect(() => {
    if (!idx || !channels) return
    setLoading(true)
    idx.videos.rows(
      { narrative },
      { from: { uploadDate: dateRange.startDate.toISOString() }, to: { uploadDate: dateRange.endDate.toISOString() } }
    ).then(vids => {
      const vidsExtra = vids.map(v => {
        const c = channels[v.channelId]
        if (!c) return v
        const vExtra = { ...v, ...pick(c, ['tags', 'lr']) }
        vExtra.supplement = (['heur_chan', 'heur_tag'].includes(v.supplement)) ? v.supplement : 'manual'
        vExtra.bubbleKey = bubbleKeyString(vExtra, groupCol) //2nd step so key can be derived from other calculated cols
        return vExtra
      })
      setVideos(vidsExtra)
      setLoading(false)
      delay(200).then(() => ReactTooltip.rebuild())
    })
  }, [idx, channels, JSON.stringify(q)])

  var res = { loading, videoFilter, setVideoFilter, channels, selectedChannels, videoRows, bubbleRows, videos, dateRange, q, setQuery }
  return res
}

interface UseNarrative {
  loading: boolean
  videoFilter: NarrativeFilterState
  setVideoFilter: (f: NarrativeFilterState) => void
  channels: Record<string, NarrativeChannel>
  selectedChannels: NarrativeChannel[]
  videos: VideoNarrative[]
  videoRows: VideoNarrative[]
  bubbleRows: NarrativeChannel[]
  dateRange: DateRangeValue
  q: NarrativeFilterState
  setQuery: (values: Partial<NarrativeFilterState>) => void
}

const supportValues = md.video.support.val

export const NarrativeBubbles: FC<UseNarrative> = ({ videoFilter, setVideoFilter, videos, videoRows, dateRange, channels, selectedChannels, q, setQuery, bubbleRows, loading }) => {
  const selections: BubblesSelectionState<NarrativeChannel> = {
    groupBy: groupCol,
    colorBy: 'lr',
    measure: 'views',
    openGroup: q.openGroup,
    selectedKeys: q.selectedKeys
  }

  const tip = useTip<Channel>()

  return <ContainerDimensions>
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
        {channels && selectedChannels && selectedChannels.map(c => <>
          <ChannelLogo c={c} key={c.channelId} style={{ height: '2em' }} useTip={tip} />
          <CloseOutline className='clickable'
            onClick={() => {
              const keys = q.selectedKeys?.filter(k => bubbleKeyObject(k).channelId != c.channelId)
              return setQuery({ selectedKeys: keys?.length > 0 ? keys : null })
            }} />
        </>)}
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
      <Videos channels={channels} videos={videoRows} groupChannels showTags showChannels showThumb loading={loading} highlightWords={['election', 'fraud', 'dominion', 'trump']} />
    </>}
  </ContainerDimensions>
}