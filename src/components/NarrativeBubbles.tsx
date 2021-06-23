import React, { useEffect, useState, useMemo } from "react"
import { groupBy, indexBy, pick, pipe, uniq, omit } from 'remeda'
import { blobIndex, IndexCol } from '../common/BlobIndex'
import { md } from '../common/Channel'
import { useQuery } from '../common/QueryString'
import { NarrativeVideo, NarrativeCaption, NarrativeIdx, NarrativeChannel, NarrativeKey, NarrativeName, Narrative2CaptionKey } from '../common/RecfluenceApi'
import { assign, toJson } from '../common/Utils'
import { filterIncludes } from '../components/ValueFilter'
import { DateRangeQueryState, DateRangeValue, rangeFromQuery } from '../components/DateRange'
import { entries, orderBy, sumBy } from '../common/Pipe'
import { Tag } from '../components/Channel'
import { BubblesSelectionState } from '../common/Bubble'
import styled from 'styled-components'
import { parseISO } from 'date-fns'


const bubbleKeyString = <T extends { channelId: string }>(r: T, groupBy: keyof T) => `${r.channelId}|${r[groupBy]}`
const bubbleKeyObject = (key: string) => {
  if (!key) return { channelId: null, group: null }
  const [channelId, group] = key.split('|')
  return { channelId, group }
}

export type NarrativeFilterState = DateRangeQueryState<''> & DateRangeQueryState<'select-'>
  & BubblesSelectionState<NarrativeChannel>
  & {
    narrative?: string[]
    channelId?: string[]
    tags?: string[]
    channelTags?: string[]
    lr?: string[]
    platform?: string[]
    support?: string[]
    supplement?: string[]
    errorType?: string[]
    keywords?: string[]
  }

const groupCol = 'support'

export interface UseNarrativeProps {
  narratives?: NarrativeName[]
  defaultFilter?: NarrativeFilterState
  narrativeIndexPrefix?: string
  maxVideos?: number
  videoMap?: (v: NarrativeVideo) => NarrativeVideo
  showLr?: boolean
}

const defaultProps: UseNarrativeProps = {
  narratives: ['2020 Election Fraud'],
  defaultFilter: { start: '2020-11-03', end: '2021-01-31' },
  narrativeIndexPrefix: 'narrative',
  showLr: true
}

const idxVersion = "v2.3"

export const idxColDateRange = (col: IndexCol<any>): DateRangeValue => ({ start: col?.min && parseISO(col.min), end: col?.max && parseISO(col.max) })

export const useNarrative = (props: UseNarrativeProps): UseNarrative => {
  const { defaultFilter, narratives, narrativeIndexPrefix, videoMap, showLr } = assign(defaultProps, props)
  const [idx, setIdx] = useState<NarrativeIdx>(null)
  const [q, setQuery] = useQuery<NarrativeFilterState>({ defaultState: defaultFilter })
  const [vidChans, setVidChans] = useState<{ videos?: (NarrativeVideo)[], channels?: Record<string, NarrativeChannel> }>({ videos: null, channels: null })
  const [loading, setLoading] = useState(false)

  const setVideoFilter = (f: NarrativeFilterState) => setQuery(pick(f, ['narrative', 'tags', 'channelTags', 'lr', 'platform', 'support', 'channelId', 'supplement', 'errorType', 'keywords']))
  const bubbleFilter = pick(q, ['narrative', 'tags', 'channelTags', 'lr', 'support', 'platform', 'supplement', 'errorType', 'keywords'])
  const videoFilter = { ...bubbleFilter, bubbleKey: q.selectedKeys }


  const selectedNarratives = q.narrative ?? narratives ?? []

  const { dateRange, dateRangeIdx, selectedChannels, videoRows, bubbleRows } = useMemo(() => {
    const dateRangeIdx = idxColDateRange(idx?.videos?.cols.uploadDate)
    const dateRange = rangeFromQuery(q, dateRangeIdx)

    const { videos, channels } = vidChans

    // aggregate videos into channel/group-by granularity. Use these rows for bubbles
    const bubbleRows = videos && entries(
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

    const videoRows = videos ? pipe(
      videos.filter(v => filterIncludes(videoFilter, v, false)),
      orderBy(v => v.videoViews, 'desc')
    ) : null
    const selectedChannels = q.selectedKeys && channels && uniq(q.selectedKeys.map(k => bubbleKeyObject(k).channelId)).map(id => channels[id])
    return { narratives, dateRange, dateRangeIdx, selectedChannels, videoRows, bubbleRows }
  }, [toJson(omit(q, ['narrative', 'start', 'end'])), vidChans, idx])

  useEffect(() => {
    Promise.all([
      blobIndex<NarrativeVideo, NarrativeKey>(`${narrativeIndexPrefix}_videos`, true, idxVersion),
      blobIndex<NarrativeChannel, NarrativeKey>(`${narrativeIndexPrefix}_channels`, true, idxVersion),
      blobIndex<NarrativeCaption, Narrative2CaptionKey>(`${narrativeIndexPrefix}_captions`, false, idxVersion)
    ]).then(([videos, channels, captions]) => setIdx({ videos, channels, captions }))
  }, [])


  useEffect(() => {
    if (!idx) return
    setLoading(true)
    idx.channels.rows(...selectedNarratives.map(n => ({ narrative: n })))
      .then(chans => {
        const newChans = indexBy(showLr ? chans : chans.map(c => ({ ...c, lr: null })), c => c.channelId)
        idx.videos.rowsWith(
          selectedNarratives.map(n => ({ from: { narrative: n, uploadDate: dateRange.start?.toISOString() }, to: { narrative: n, uploadDate: dateRange.end?.toISOString() } })),
          { andOr: 'or' }
        ).then(vids => {
          const vidsExtra = vids.map(v => {
            v = videoMap ? videoMap(v) : v
            let r = { videoViews: null, videoViewsAdjusted: null, ...v } // for metrics, ensure null instead of undefined to make it easier to work with
            const c = newChans[v.channelId]
            if (!c) return r
            r = {
              ...r,
              platform: c.platform,
              lr: showLr ? c.lr : null,
              channelTags: c.tags, // channelTags because there is a conflict
              supplement: (['heur_chan', 'heur_tag'].includes(v.supplement)) ? v.supplement : 'manual',
              bubbleKey: bubbleKeyString(r, groupCol) //2nd step so key can be derived from other calculated cols
            }
            return r
          })
          setVidChans({ videos: vidsExtra, channels: newChans })
          setLoading(false)
        })
      })

  }, [idx, JSON.stringify(pick(q, ['narrative', 'start', 'end']))])

  var res = { loading, videoFilter, setVideoFilter, channels: vidChans.channels, selectedChannels, videoRows, bubbleRows, dateRange, dateRangeIdx, q, setQuery, idx }
  return res
}

interface UseNarrative {
  loading: boolean
  videoFilter: NarrativeFilterState
  setVideoFilter: (f: NarrativeFilterState) => void
  channels: Record<string, NarrativeChannel>
  selectedChannels: NarrativeChannel[]
  videoRows: NarrativeVideo[]
  bubbleRows: NarrativeChannel[]
  dateRange: DateRangeValue
  dateRangeIdx: DateRangeValue
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



