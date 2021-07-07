import { tableMd, TableMdRun } from './Metadata'
import { useEffect, useState, useMemo } from "react"
import { indexBy, pick, pipe, uniq, omit } from 'remeda'
import { blobIndex, idxColDateRange } from './BlobIndex'
import { md } from './Channel'
import { useQuery } from './QueryString'
import { NarrativeVideo, NarrativeCaption, NarrativeIdx, NarrativeChannel, NarrativeKey, NarrativeName, Narrative2CaptionKey } from './RecfluenceApi'
import { assign, toJson } from './Utils'
import { filterIncludes, FilterTableMd } from '../components/ValueFilter'
import { DateRangeQueryState, DateRangeValue, rangeFromQuery } from '../components/DateRange'
import { orderBy } from './Pipe'
import { BubblesSelectionState } from './Bubble'
import { NarrativeVideoComponentProps } from '../components/pendulum/NarrativeVideo'


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

export const getVideoMd = (props: NarrativeVideoComponentProps, idx: NarrativeIdx): FilterTableMd => tableMd({
  ...md.video,
  narrative: {
    ...md.video.narrative,
    singleSelect: true,
    hideAll: true,
    values: (props.narratives ?? idx?.videos?.cols.narrative.distinct)?.map(n => ({ value: n, label: narrativeCfg[n]?.label ?? n }))
  },
  keywords: {
    ...md.video.keywords,
  },
  ...props.md
})

const idxVersion = "v2.3"

export const narrativeProps = {
  'Vaccine Personal': {
    narratives: ['Vaccine Personal'],
    defaultFilter: { start: '2020-01-01', end: '2021-05-31' },
    words: ['vaccine', 'covid', 'coronavirus', 'SARS-CoV-2', 'vaccine', 'Wuhan flu', 'China virus', 'vaccinated', 'Pfizer', 'Moderna', 'BioNTech', 'AstraZeneca', 'Johnson \& Johnson', 'CDC', 'world health organization', 'Herd immunity', 'corona virus', 'kovid', 'covet', 'coven'],
    sizeFactor: 1,
    colorBy: 'errorType',
    ticks: 150
  } as NarrativeVideoComponentProps,
  'Vaccine DNA': {
    narratives: ['Vaccine DNA'],
    defaultFilter: { start: '2020-01-01', end: '2021-05-31' },
    words: ['dna'],
    colorBy: 'errorType',
    sizeFactor: 1.7,
  } as NarrativeVideoComponentProps,
  '2020 Election Fraud': {
    narratives: ['2020 Election Fraud'],
    defaultFilter: { start: '2020-11-03', end: '2021-01-31' },
    showLr: true,
    maxVideos: 1500,
    sizeFactor: 0.5,
    groupBy: 'tags',
    colorBy: 'errorType',
    md: {
      tags: {
        label: 'Support',
        values: [
          { value: 'support', label: 'Supporting', color: '#56b881', desc: `Videos that support the narrative being pushed by President Trump that the 2020 presidential election was rigged, stolen, and/or impacted by significant fraud. This includes cases in which significant “election fraud” claims are made during a speech or interview, but not challenged afterwards. This also includes language that clearly insinuates or implies that this narrative is true.` },
          { value: 'dispute', label: 'Disputing', color: '#aa557f', desc: `Videos that dispute the narrative being pushed by President Trump that the 2020 presidential election was rigged, stolen, and/or impacted by significant fraud. If significant “election fraud” is mentioned during a speech or interview, the dispute might be made clear after the speaker is finished or through text on the screen. Easily interpreted forms of insinuation and parody count as well.` },
          { value: 'other', label: 'Other', desc: `This covers cases where “election fraud” is being discussed, but in a manner that does not clear dispute or support the narrative that it has had a significant impact on the 2020 election.` },
          { value: 'unrelated_political', label: 'Unrelated Politics', color: '#6ec9e0', desc: `Political video's unrelated to this narrative` }
        ]
      }
    }
  } as NarrativeVideoComponentProps,
  qanon: {
    narratives: ['QAnon'],
    defaultFilter: { start: '2020-05-01', end: '2021-06-1' },
    words: ['qanon', 'trump', 'august', 'reinstate', 'jfk'],
    maxVideos: 3000,
    showLr: false,
    showPlatform: true,
    sizeFactor: 1,
    ticks: 400
  } as NarrativeVideoComponentProps,
  comcast: {
    narratives: ['comcast', '5g', 'netneutrality', 'Jews Control Media', 'Comcast Exec', 'Brian Roberts'],
    defaultFilter: { start: '2021-01-01', narrative: ['comcast'] },
    filterRange: { start: '2019-01-01' },
    words: ['comcast', 'verizon'],
    maxVideos: 2000,
    showLr: true,
    showPlatform: true,
    sizeFactor: 1,
    ticks: 150,
    colorBy: 'platform',
    md: {
      keywords: {
        values: [
          { value: 'non-connectivity' },
          { value: 'connectivity' }
        ]
      }
    }
  } as NarrativeVideoComponentProps,
  maccas: {
    defaultFilter: { start: '2020-01-01', narrative: ['maccas'] },
    filterRange: { start: '2019-01-01' },
    narratives: [`maccas`, 'maccas-ceo', 'maccas-veg', 'maccas-union', 'maccas-unhealthy', 'maccas-fired'],
    words: [`McDonald's`, 'Maccas', `Macca's`, 'Mickey D', 'Golden Arches', 'Mickey Deez'],
  } as NarrativeVideoComponentProps,
  qMilitary: {
    defaultFilter: { start: '2020-11-03', narrative: ['QAnon - Military in Control'] },
    filterRange: { start: '2020-11-03' }
  } as NarrativeVideoComponentProps
}

export const narrativeCfg: { [index: string]: { label?: string, highlight?: string[] } } = {
  'netneutrality': {
    label: 'Net Neutrality',
    highlight: ['net neutrality']
  },
  comcast:
  {
    label: 'Comcast',

  },
  'Jews Control Media': {
    label: 'Anti-semitism: Media Control',
    highlight: ['globalist', 'cabal', 'jewish', 'jew', 'jews', 'israel', 'zion', 'hebrew', 'zog']
  },
  '5g': { label: '5G' },
  'Comcast Exec': {
    highlight: ['ceo', 'executive', 'cfo', 'leadership', 'brian', 'roberts', 'robert', 'clo', 'cavanagh', 'reid', 'armstrong', 'cohen']
  },
  'Brian Roberts': {
    highlight: ['brian', 'roberts', 'robert', 'robert\'s']
  },
  '2020 Election Fraud': {},
  'maccas': {
    label: `McDonald's`
  },
  'maccas-ceo': {
    label: 'CEO',
    highlight: ['easterbrook', 'ceo']
  },
  'maccas-veg': {
    label: 'Veg',
    highlight: ['veg', 'vegetarian', 'vegan']
  },
  'maccas-union': {
    label: 'Union',
    highlight: ['union', 'strike', 'striking']
  },
  'maccas-unhealthy': {
    label: 'Unhealthy'
  },
  'maccas-fired': {
    label: 'CEO fired'
  }
}

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

  const { selectedChannels, videoRows } = useMemo(() => {
    const { videos, channels } = vidChans
    const videoRows = videos ? pipe(
      videos.filter(v => filterIncludes(videoFilter, v, false)),
      orderBy(v => v.videoViews, 'desc')
    ) : null
    const selectedChannels = q.selectedKeys && channels && uniq(q.selectedKeys.map(k => bubbleKeyObject(k).channelId)).map(id => channels[id])
    return { selectedChannels, videoRows }
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

  var res = { loading, videoFilter, setVideoFilter, channels: vidChans.channels, selectedChannels, videoRows, dateRange, dateRangeIdx, q, setQuery, idx }
  return res
}

interface UseNarrative {
  loading: boolean
  videoFilter: NarrativeFilterState
  setVideoFilter: (f: NarrativeFilterState) => void
  channels: Record<string, NarrativeChannel>
  selectedChannels: NarrativeChannel[]
  videoRows: NarrativeVideo[]
  dateRange: DateRangeValue
  dateRangeIdx: DateRangeValue
  q: NarrativeFilterState
  setQuery: (values: Partial<NarrativeFilterState>) => void
  idx: NarrativeIdx
}



