import { shuffle } from 'd3'
import { parseISO } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { first, flatMap, groupBy, indexBy, pick, pipe, range, sortBy, uniq } from 'remeda'
import { UseSeen, useSeen } from '../components/persona/PersonaSeen'
import { RecVennKey } from '../components/persona/PersonaVenn'
import { blobIndex, BlobIndex } from './BlobIndex'
import { Channel, getChannels, md } from './Channel'
import { ColumnMdRun, tableMd } from './Metadata'
import { mapEntries, entries, takeSample, values } from './Pipe'
import { VideoCommon } from './RecfluenceApi'
import { dateFormat, delay, toJson } from './Utils'
import { VennSet, vennSets } from './Venn'

export interface Rec {
  fromVideoId: string
  toVideoId: string
  day: string
  label: string
  accounts: string[]
  fromVideoTitle: string
  fromChannelId: string
  toVideoTitle: string
  toChannelId: string
  toChannelTitle: string
}

export interface Seen {
  account: string
  videoId: string
  videoTitle: string
  channelId: string
  channelTitle: string
  part?: 'featured'
  firstSeen: string
  lastSeen: string
  seenTotal: number
  percentile: number
}

export type SeenKey = Partial<Pick<Seen, 'part' | 'account'>>
export type RecVideo = Omit<Rec, 'fromVideoId' | 'fromVideoTitle' | 'day'> & { recs: Rec[], id: string }
export type RecGroup = Pick<Rec, 'toChannelId' | 'toChannelTitle'> & { id: string, groupAccounts: string[], videoRecs: RecVideo[] }
export const isRec = (o: any): o is Rec => o.fromVideoId !== undefined && o.toVideoId !== undefined
export const isRecVideo = (o: any): o is RecVideo => o.groupAccounts !== undefined && o.recs !== undefined
export const isRecGroup = (o: any): o is RecGroup => o.toChannelId !== undefined && o.videoRecs !== undefined


export interface UsePersona {
  chans: Record<string, Channel>
  recState: RecState
  recIdx: BlobIndex<Rec, RecVennKey>
  personaMd: {
    day: ColumnMdRun,
    label: ColumnMdRun,
    account: ColumnMdRun,
    groupAccounts: ColumnMdRun,
    toTag: ColumnMdRun,
  }
  loaded: boolean,
  watch: UseSeen
}

export const usePersona = (props?: { filter?: VennFilter, sampleFilter?: VennFilter, channelSample?: number, preLoadSamples?: number }): UsePersona => {
  const { channelSample, preLoadSamples, sampleFilter } = props

  const [recIdx, setRecIdx] = useState<BlobIndex<Rec, RecVennKey>>(null)
  const [chans, setChannels] = useState<Record<string, Channel>>()
  const [loaded, setLoaded] = useState(false)
  const watch = useSeen('us_watch')

  const channelShuffle = useMemo(
    () => chans ? shuffle(recIdx?.cols.fromChannelId.distinct ?? []).filter(c => chans[c]) : []
    , [recIdx, chans])
  const getSampleChannel = (i: number) => channelShuffle[i % channelShuffle.length]

  const filter = {
    ...(channelSample ? sampleFilter : null),
    ...props.filter,
    vennChannelIds: props.filter?.vennChannelIds ?? (channelSample ? [getSampleChannel(channelSample)] : undefined),
  }

  if ((!filter.vennLabel || filter.vennLabel == 'Other') && !filter.vennChannelIds?.length) {
    filter.vennChannelIds = [''] // dodgy protection against loading all recs
  }

  const recState = usePersonaRecs(recIdx, chans, filter)

  useEffect(() => {
    getChannels().then(chans => {
      console.log('usePersona loaded chans', chans.length)
      return setChannels(indexBy(chans, c => c.channelId))
    })
    blobIndex<Rec, RecVennKey>("us_recs").then(setRecIdx)
    delay(100).then(() => setLoaded(true))
  }, [])


  // pre-warm samples by pre-loading the files used and discarding the rows
  useEffect(() => {
    if (!preLoadSamples || !recIdx) return
    const f = vennToBlobFilter({ ...sampleFilter, vennChannelIds: range(0, preLoadSamples - 1).map(i => getSampleChannel(i)) })
    console.log('usePersona - loading samples', f)
    recIdx.rowsWith(f, { andOr: 'or' })
      .then(r => console.log('usePersona - loaded samples', { f, rows: r?.length }))
  }, [preLoadSamples, recIdx])

  const personaMd = useMemo(() => {
    return ({
      ...{
        account: md.channel.tags,
        groupAccounts: md.channel.tags,
        toTag: md.channel.tags
      },
      ...tableMd({
        label: { singleSelect: true, label: 'Collection', values: recIdx?.cols.label.distinct?.map(l => ({ value: l })) },
        day: {
          label: 'Day seen',
          singleSelect: true,
          sort: { getVal: (v) => parseISO(v.value.value), dir: 'desc' },
          values: recState?.availableDays.map(d => ({ value: d, label: d && dateFormat(d) }))
        }
      })
    })
  }, [recState, recIdx])

  return { chans, recState, recIdx, personaMd, loaded, watch }
}

export const usePersonaRecs = (recIdx: BlobIndex<Rec, RecVennKey>, chans: Record<string, Channel>, filter: VennFilter) => {
  const [recState, setRecState] = useState<RecState>()
  useEffect(() => {
    if (!recIdx) return
    loadRecData(recIdx, filter, chans).then(r => {
      setRecState(r)
    })
  }, [recIdx, toJson(filter), chans])
  return recState
}

export interface VennFilter {
  vennChannelIds?: string[]
  vennAccounts?: string[]
  vennLabel?: string
  vennDay?: string
}


export interface RecState {
  groups: RecGroup[]
  recs: Rec[]
  sets: VennSet<RecGroup>[]
  byId: Record<string, RecVideo>
  fromVideos: (VideoCommon & { days: string[] })[]
  availableChannelIds: string[]
  availableDays: string[]
  filter: VennFilter
}


const vennToBlobFilter = (filter: VennFilter) => filter?.vennChannelIds?.length
  ? filter.vennChannelIds.map(c => ({ label: filter?.vennLabel ?? null, fromChannelId: c }))
  : [{ label: filter?.vennLabel }]


export const loadRecData = async (recIdx: BlobIndex<Rec, Pick<Rec, never>>, filter?: VennFilter, chans?: Record<string, Channel>): Promise<RecState> => {
  filter = {
    vennAccounts: ['Fresh', 'PartisanLeft', 'PartisanRight'],
    vennLabel: first(recIdx.cols.label.distinct) ?? '',
    ...filter
  }
  const accountFilter = (acc: string[]) => acc.filter(a => filter.vennAccounts.includes(a))
  const renameAccounts = (acc: string[]) => acc.map(a => a == 'MainstreamNews' ? 'Mainstream News' : a)


  if (!filter.vennLabel && !filter.vennChannelIds)
    debugger
  const blobFilter = vennToBlobFilter(filter)
  //console.log('loadRecData', blobFilter)

  let rawRecs = await recIdx.rowsWith(blobFilter, { andOr: 'or' })

  const availableDaysWorking = mapEntries(groupBy(rawRecs, r => r.day), (g, day) =>
  ({
    day, videos: uniq(g.filter(r => accountFilter(r.accounts).length == filter.vennAccounts.length)
      .map(r => r.fromVideoId)).length
  }))

  const availableDays = sortBy(availableDaysWorking, [v => v.videos, 'desc'], [v => v.day, 'desc']).map(v => v.day)
  // const dayExists = filter.vennDay && availableDays.includes(filter.vennDay)
  // // vennDay: null -> All, undefined or no overlap -> first, date > videos with that date
  // const vennDay = dayExists
  //   ? filter.vennDay
  //   : (filter.vennDay === null ? null : (availableDays.length == 1 ? first(availableDays) : null))
  // const filteredRecs = rawRecs.filter(r => vennDay == null || vennDay == r.day)

  const recs = rawRecs
    .map(r => ({ ...r, accounts: renameAccounts(r.accounts) }))
    .map(r => ({ ...r, groupAccounts: accountFilter(r.accounts).sort() }))
  const groups = entries(
    groupBy(recs, r => `${r.groupAccounts.join(':')}|${r.toChannelId}`)
  ).map(([id, recs]) => {
    const r = recs[0]
    const group = {
      ...pick(r, ['toChannelId', 'toChannelTitle']),
      accounts: pipe(recs, flatMap(r => r.accounts), uniq()).sort(),
      groupAccounts: r.groupAccounts, id
    }

    // group recs to the same videos
    const videoRecs = mapEntries(groupBy(recs.map(r => ({ ...r, id: `${id}|${r.toVideoId}` })), r => r.id), (recs, id) => {
      const { day, fromVideoId, fromVideoTitle, ...r } = recs[0]
      const recVideo: RecVideo = { ...r, recs, id }
      return recVideo
    })
    return { id, ...group, videoRecs }
  })

  const sets = vennSets(groups, {
    getKey: (r) => r.id,
    getSets: (r) => r.groupAccounts,
    getSize: (r) => isRecVideo(r) ? r.recs.length * r.groupAccounts.length : null,
    getChildren: (r) => r.videoRecs
  })

  const byId = pipe(
    flatMap(groups, r => r.videoRecs),
    indexBy(r => r.id)
  )

  const fromVideos = mapEntries(groupBy(rawRecs, d => d.fromVideoId), (recs) => {
    const r = recs[0]
    const v = ({
      videoId: r.fromVideoId,
      videoTitle: r.fromVideoTitle,
      channelId: r.fromChannelId,
      channelTitle: r.fromChannelId && chans?.[r.fromChannelId]?.channelTitle,
      days: uniq(recs.map(r => r.day))
    })
    return v
  })

  const availableChannelIds = recIdx?.cols.fromChannelId?.distinct.filter(id => chans?.[id])
  return {
    recs, groups, sets, byId, fromVideos, availableChannelIds, availableDays,
    filter
  }
}
