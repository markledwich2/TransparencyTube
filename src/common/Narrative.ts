import React, { useEffect, useState, useMemo } from "react"
import { groupBy, indexBy, pick, pipe, uniq, omit } from 'remeda'
import { blobIndex, IndexCol } from './BlobIndex'
import { md } from './Channel'
import { useQuery } from './QueryString'
import { NarrativeVideo, NarrativeCaption, NarrativeIdx, NarrativeChannel, NarrativeKey, NarrativeName, Narrative2CaptionKey } from './RecfluenceApi'
import { assign, toJson } from './Utils'
import { filterIncludes } from '../components/ValueFilter'
import { DateRangeQueryState, DateRangeValue, rangeFromQuery } from '../components/DateRange'
import { entries, min, orderBy, sumBy } from './Pipe'
import { Tag } from '../components/Channel'
import { BubblesSelectionState } from './Bubble'
import styled from 'styled-components'
import { parseISO } from 'date-fns'


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
    groupBy?: string
  }

export interface UseNarrativeProps {
  narratives?: NarrativeName[]
  defaultFilter?: NarrativeFilterState
  narrativeIndexPrefix?: string
  maxVideos?: number
  videoMap?: (v: NarrativeVideo) => NarrativeVideo
  showLr?: boolean
}

const defaultProps: UseNarrativeProps = {
  videoMap: (v) => ({ ...v, errorType: v.errorType ?? 'Available' }),
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
  const dateRangeIdx = idxColDateRange(idx?.videos?.cols.uploadDate)
  const dateRange = rangeFromQuery(q, dateRangeIdx)

  const { selectedChannels, videoRows, bubbleRows } = useMemo(() => {
    const { videos, channels } = vidChans
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
              supplement: (['heur_chan', 'heur_tag'].includes(v.supplement)) ? v.supplement : 'manual'
            }
            return r
          })
          setVidChans({ videos: vidsExtra, channels: newChans })
          setLoading(false)
        })
      })
  }, [idx, JSON.stringify({ ...pick(q, ['narrative']), ...dateRange })])

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



