import React, { useEffect, useState, FunctionComponent as FC, Fragment } from 'react'
import Layout, { FlexRow, MinimalPage, NarrowSection, StyleProps, styles } from '../components/Layout'
import PurposeBanner from '../components/PurposeBanner'
import { dateFormat, delay, navigateNoHistory, numFormat, toJson } from '../common/Utils'
import { first, flatMap, groupBy, pick, pipe, uniq, indexBy, mapValues } from 'remeda'
import { Channel, getChannels, md } from '../common/Channel'
import ContainerDimensions from 'react-container-dimensions'
import { VennSet, vennSets } from '../common/Venn'
import { VideoCommon } from '../common/RecfluenceApi'
import { Video } from '../components/Video'
import { BlobIndex, blobIndex } from '../common/BlobIndex'
import { useQuery } from '../common/QueryString'
import { useLocation } from '@reach/router'
import { TextSection } from '../components/Markdown'
import { FilterHeader as FH, FilterPart as FP } from '../components/FilterCommon'
import { InlineValueFilter as FV } from '../components/ValueFilter'
import { entries, mapEntries, orderBy, takeRandom, values } from '../common/Pipe'
import { shuffle } from 'd3'
import { Popup } from '../components/Popup'
import PersonalizationBar, { BarQueryState, loadBarData, PersonalizationBarData } from '../components/PersonalizationBar'
import { isRecVideo, Rec, RecGroup, RecVideo, Watch, WatchKey } from '../common/Personalization'
import { PersonalizationVenn, RecVennKey } from '../components/PersonalizationVenn'
import { AccountVideos, PersonalizationHistory } from '../components/PersonalizationHistory'
import { PeriodSelect, periodString } from '../components/Period'
import { Spinner } from '../components/Spinner'
import { RotateContent } from '../components/RotateContent'
import { ChannelDetails, ChannelLogo, ChannelSearch } from '../components/Channel'
import { tableMd } from '../common/Metadata'
import { CloseOutline } from 'styled-icons/evaicons-outline'
import { parseISO } from 'date-fns'
import { Tip, useTip } from '../components/Tip'

interface QueryState extends BarQueryState {
  label?: string
  vennChannelIds?: string[]
  vennAccounts?: string[]
  vennLabel?: string
  vennDay?: string
  openHistory: string
}

const PersonalizationPage = () => {
  const [recIdx, setRecIdx] = useState<BlobIndex<Rec, RecVennKey>>(null)
  const [watchIdx, setWatchIdx] = useState<BlobIndex<Watch, WatchKey>>(null)
  const [rs, setRecState] = useState<RecState>()
  const [q, setQuery] = useQuery<QueryState>(useLocation(), navigateNoHistory)
  const [chans, setChannels] = useState<Record<string, Channel>>()
  const [watches, setWatches] = useState<Record<string, Watch[]>>(null)
  const [barData, setBarData] = useState<PersonalizationBarData>({ recs: [], tags: [] })
  const chanTip = useTip<Channel>()

  useEffect(() => {
    getChannels().then(chans => setChannels(indexBy(chans, c => c.channelId)))
    blobIndex<Watch, WatchKey>("us_watch").then(setWatchIdx)
    blobIndex<Rec, RecVennKey>("us_recs").then(setRecIdx)
    delay(2000).then(() => loadBarData().then(setBarData))
  }, [])

  useEffect(() => {
    if (!watchIdx) return;
    (async () => {
      const rawWatches = await watchIdx.rowsWith([], {
        parallelism: 4,
        // complete when we have at least one video for each account
        isComplete: (rs) => entries(groupBy(rs, r => r.account)).length >= watchIdx.cols.account.distinct.length,
        order: 'desc'
      })
      const watches = mapValues(groupBy(rawWatches, r => r.account), ws => shuffle(ws))
      setWatches(watches)
    })()
  }, [watchIdx])

  const recFilter = pick(q, vennFilterKeys)
  useEffect(() => {
    if (!recIdx) return
    loadRecData(recIdx, recFilter, chans).then(setRecState)
  }, [recIdx, toJson(recFilter)])

  const months = uniq(barData.recs.map(r => r.month))
  const barPeriods = uniq(months.map(m => dateFormat(m, 'UTC', 'yyyy'))).map(y => ({ type: 'y', value: `${y}` }))
    .concat(months.map(m => ({ type: 'm', value: m })))

  const recMd = {
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
        values: rs?.availableDays.map(d => ({ value: d, label: d && dateFormat(d) }))
      }
    })
  }

  const barFilterProps = { metadata: recMd, rows: barData?.recs }
  const vennFilterProps = { metadata: recMd, rows: rs?.recs }

  return <Layout>
    <PurposeBanner>
      <p>YouTube's recommended videos are tailored for each user taking into account watch history. We created 15 personas, each with their own watch history to see how YouTube's personalization works. </p>
    </PurposeBanner>
    <MinimalPage>
      <TextSection style={{ marginBottom: '1em', marginTop: '2em' }}>
        Here is a <b>history of videos watched by each persona</b>. Personas watch video's in channels with a matching classification (e.g. The socialist persona watched only videos in Socialist channels). Each day, a list of videos was selected at random, proportional to views within the previous 7 days.
      </TextSection>

      {watches ? <PersonalizationHistory watches={watches} onShowHistory={a => setQuery({ openHistory: a })} channels={chans} />
        : <div style={{ marginBottom: '100vh' }}><Spinner /></div>}

      {rs?.sets && <>
        <TextSection style={{ marginBottom: '1em', marginTop: '5em' }}>
          Bellow is a venn diagram showing the overlap of recommendation shown to the different personas from the same videos.
        </TextSection>

        <NarrowSection>
          <FH>
            <FP>Recommendations seen by personas <FV metadata={recMd}
              filter={{ groupAccounts: rs.filter.vennAccounts }}
              onFilter={f => setQuery({ vennAccounts: f.groupAccounts })}
              rows={rs?.groups} />
            </FP>
            <FP>
              in video collection <FV {...vennFilterProps} filter={{ label: rs?.filter?.vennLabel }} onFilter={f => setQuery({ vennLabel: f.label })} />
            </FP>
            {chans && <FP>from channel
              <SelectWithChannelSearch ids={rs?.filter.vennChannelIds}
                onSelect={ids => setQuery({ vennChannelIds: ids?.length ? ids : undefined })}
                channels={chans}
                style={{ marginLeft: '1em' }}
              />
              {rs.availableChannelIds && <FP><button
                style={{ ...styles.centerH, display: 'block' }}
                onClick={() => {
                  return setQuery({ vennChannelIds: [takeRandom(rs.availableChannelIds)], vennLabel: undefined, vennDay: undefined })
                }}
              >Random</button></FP>
              }
            </FP>}
            <FP>on day<FV {...vennFilterProps} filter={{ day: rs?.filter?.vennDay }}
              onFilter={f => setQuery({ vennDay: f.day })} /></FP>
          </FH>
        </NarrowSection>

        {rs?.fromVideos && <FlexRow style={{ marginBottom: '1em', alignItems: 'center', justifyContent: 'center' }}>
          <div><div style={{ marginBottom: '1em' }}>Showing recommendations from <b>{numFormat(rs.fromVideos.length)}</b> videos</div>
            <RotateContent
              data={rs.fromVideos}
              getDelay={() => 4000 + Math.random() * 1000}
              style={{ maxWidth: '100%' }}
              template={(v) => {
                if (!v) return
                const c = chans?.[v.channelId] ?? { channelId: v.channelId, channelTitle: v.channelTitle }
                return <Video v={v} c={c} showThumb showChannel useTip={chanTip} />
              }} />
          </div>
        </FlexRow>}

        <div style={{ margin: '0 auto', maxWidth: '1000px' }}>
          <ContainerDimensions>
            {({ width, height }) => {
              return <PersonalizationVenn channels={chans} sets={rs.sets} width={width} height={height} videos={rs.byId} />
            }}
          </ContainerDimensions>
        </div>
      </>}

      {barData && <>
        <NarrowSection>
          <TextSection style={{ marginTop: '5em', marginBottom: '1em', }}>
            See how recommendations are personalized overall
        </TextSection>
          <FH>
            <span>Recommendations seen by </span>
            <FP><FV {...barFilterProps} filter={{ account: q.barAccounts }} onFilter={(f) => setQuery({ barAccounts: f.account })} /></FP>
            <FP>recommended video tags <FV {...barFilterProps} filter={{ toTag: q.barTags }} onFilter={(f) => setQuery({ barTags: f.toTag })} /></FP>
            <FP>in <PeriodSelect periods={barPeriods} showAll onPeriod={p => setQuery({ barPeriod: periodString(p) })} /></FP>
          </FH>
        </NarrowSection>
        <PersonalizationBar data={barData} q={q} />
      </>}
    </MinimalPage>
    <Popup isOpen={q.openHistory != null} onRequestClose={() => setQuery({ openHistory: null })}>
      {q.openHistory && <AccountVideos idx={watchIdx} channels={chans} account={q.openHistory} />}
    </Popup>
    <Tip {...chanTip.tipProps} ><ChannelDetails channel={chanTip.data} mode='min' /></Tip>
  </Layout>
}
export default PersonalizationPage

const vennFilterKeys: (keyof VennFilter)[] = ['vennLabel', 'vennChannelIds', 'vennAccounts', 'vennDay']
type VennFilter = Pick<QueryState, 'vennLabel' | 'vennChannelIds' | 'vennAccounts' | 'vennDay'>

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
export const loadRecData = async (recIdx: BlobIndex<Rec, Pick<Rec, never>>, filter: VennFilter, chans?: Record<string, Channel>): Promise<RecState> => {
  const vennAccounts = filter.vennAccounts ?? ['Fresh', 'PartisanLeft', 'PartisanRight']
  const vennLabel = filter.vennLabel ?? (filter.vennChannelIds ? undefined : first(recIdx.cols.label.distinct)) // filter by label if there aren't other filters
  const accountFilter = (acc: string[]) => acc.filter(a => vennAccounts.includes(a))
  const renameAccounts = (acc: string[]) => acc.map(a => a == 'MainstreamNews' ? 'Mainstream News' : a)

  const rawRecs = await recIdx.rows({ fromChannelId: filter.vennChannelIds, label: vennLabel })
  const availableDaysWorking = pipe(
    mapEntries(groupBy(rawRecs, r => r.day), (g, day) =>
    ({
      day, videos: uniq(g.filter(r => accountFilter(r.accounts).length == vennAccounts.length)
        .map(r => r.fromVideoId)).length
    })),
    orderBy(v => [v.videos, v.day], ['desc', 'desc'])
  )
  const availableDays = availableDaysWorking.map(v => v.day)
  const dayExists = filter.vennDay && availableDays.includes(filter.vennDay)
  // vennDay: null -> All, undefined or no overlap -> first, date > videos with that date
  const vennDay = dayExists ? filter.vennDay : (filter.vennDay === null ? null : first(availableDays))
  const filteredRecs = rawRecs.filter(r => vennDay == null || vennDay == r.day)

  const recs = filteredRecs
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

  const fromVideos = mapEntries(groupBy(filteredRecs, d => d.fromVideoId), (recs) => {
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
    filter: { vennLabel, vennChannelIds: filter.vennChannelIds, vennAccounts, vennDay }
  }
}

export const SelectWithChannelSearch: FC<{
  channels: Record<string, Channel>,
  ids: string[],
  onSelect: (select: string[]) => void,
  multiSelect?: boolean
} & StyleProps> = ({ channels, ids, onSelect, multiSelect, style }) => {
  return <div style={{ display: 'flex', alignItems: 'center', ...style }}>
    {channels && ids?.map(id => {
      const chan = channels[id]
      return chan && <Fragment key={id}>
        <ChannelLogo c={chan} tipId='searchChannel' style={{ height: '3em' }} />
        <CloseOutline style={{ verticalAlign: 'middle' }} className='clickable' onClick={() => onSelect(ids.filter(c => c != id))} />
      </Fragment>
    })}
    {channels && (multiSelect || !ids?.length) && <ChannelSearch onSelect={c => {
      onSelect(uniq((ids ?? []).concat([c.channelId])))
    }} channels={values(channels)} sortBy='channelViews' style={styles.normalFont} />}
  </div>
}