import React, { useEffect, useState, FunctionComponent as FC, Fragment, useMemo } from 'react'
import Layout from '../components/Layout'
import { FlexRow, MinimalPage, NarrowSection, StyleProps, styles } from '../components/Style'
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
import { FilterState, InlineValueFilter as FV } from '../components/ValueFilter'
import { entries, mapEntries, orderBy, takeRandom, values } from '../common/Pipe'
import PersonaBar, { BarFilter, BarStat, loadBarData, PersonaAllBarData, PersonaBarData, useBarData } from '../components/PersonaBar'
import { isRecVideo, Rec, RecGroup, RecVideo, Seen, SeenKey } from '../common/Personalization'
import { PersonaVenn, RecVennKey } from '../components/PersonaVenn'
import { PersonaSeen, useSeen, PersonaSeenPopup } from '../components/PersonaSeen'
import { PeriodSelect, periodString } from '../components/Period'
import { Spinner } from '../components/Spinner'
import { RotateContent } from '../components/RotateContent'
import { ChannelDetails, ChannelLogo, ChannelSearch } from '../components/Channel'
import { TableMd, tableMd, TableMdRun } from '../common/Metadata'
import { CloseOutline } from 'styled-icons/evaicons-outline'
import { parseISO } from 'date-fns'
import { Tip, useTip } from '../components/Tip'
import styled from 'styled-components'
import { Tab, Tabs } from '../components/Tab'

type PrefixAll<T, P extends string> = {
  [K in keyof T & string as `${P}${Capitalize<K>}`]: T[K]
}

// type BarFilterPrefix = 'rec' | 'feed'
// type BarFilters = { [K in `${BarFilterPrefix}${Capitalize<keyof BarFilter>}`]: BarFilter[`${keyof BarFilter}`] }

type QueryState = {
  label?: string
  vennChannelIds?: string[]
  vennAccounts?: string[]
  vennLabel?: string
  vennDay?: string
  openWatch: string
  openFeed: string
} & PrefixAll<BarFilter, 'rec'> & PrefixAll<BarFilter, 'feed'>

const PersonaPage = () => {
  const [recIdx, setRecIdx] = useState<BlobIndex<Rec, RecVennKey>>(null)

  const [rs, setRecState] = useState<RecState>()
  const [q, setQuery] = useQuery<QueryState>(useLocation(), navigateNoHistory)
  const [chans, setChannels] = useState<Record<string, Channel>>()

  const watch = useSeen('us_watch')
  const feed = useSeen('us_feed')

  const barData = useBarData() //2000
  const chanTip = useTip<Channel>()

  useEffect(() => {
    getChannels().then(chans => setChannels(indexBy(chans, c => c.channelId)))
    blobIndex<Rec, RecVennKey>("us_recs").then(setRecIdx)
  }, [])

  const recFilter = pick(q, vennFilterKeys)
  useEffect(() => {
    if (!recIdx) return
    loadRecData(recIdx, recFilter, chans).then(setRecState)
  }, [recIdx, toJson(recFilter)])

  const barMd = useMemo(() => ({
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
  }), [rs, recIdx])

  const vennFilterProps = { metadata: barMd, rows: rs?.recs }
  const commonBarData = pick(barData, ['tags', 'months'])
  const barRecs = { stats: barData.recs, ...commonBarData }
  const barFeeds = { stats: barData.feeds, ...commonBarData }

  return <Layout>
    <PurposeBanner>
      <p>YouTube's recommended videos are tailored for each user taking into account watch history. We created 15 personas, each with their own watch history to see how YouTube's personalization works. </p>
    </PurposeBanner>
    <MinimalPage>
      <TS>
        <h2>Video's Watched</h2>
        Personas only watch video's from their own group (i.e. The socialist persona watched only videos in Socialist channels). Each day, 50 recent videos were watched randomly proportional to views.
      </TS>

      <PersonaSeen seen={watch} verb='watched' showSeen={openWatch => setQuery({ openWatch })} channels={chans} style={{ minHeight: '100vh' }} />

      <Tabs titleStyle={{ textTransform: 'uppercase', marginLeft: '1em' }}>
        <Tab label='Recommendations'>
          {rs?.sets && <>
            <TS>
              The venn diagram shows the overlap of recommendation shown to personas from the same videos.
            </TS>

            <NarrowSection>
              <FH>
                <FP>Recommendations seen by personas <FV metadata={barMd}
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
                  return <PersonaVenn channels={chans} sets={rs.sets} width={width} height={height} videos={rs.byId} />
                }}
              </ContainerDimensions>
            </div>
          </>}

          {barRecs && <>
            <NarrowSection>
              <TS style={{ marginTop: '5em', marginBottom: '1em', }}>
                See how recommendations are personalized overall
          </TS>
            </NarrowSection>

            <BarFilters
              noun='Recommendations' verb='recommended'
              data={barRecs}
              md={barMd}
              filter={{ accounts: q.vennAccounts }}
              onFilter={f => setQuery({ recAccounts: f.accounts, recPeriod: f.period, recTags: f.tags })}
            />
            <PersonaBar data={barRecs} filter={{ accounts: q.recAccounts, period: q.recPeriod, tags: q.recTags }} />
          </>}
        </Tab>
        <Tab label='Home Page'>
          <TS>
            Each day, personas refresh their home page many times, and we collect the videos that were shown. Bellow are the videos that were shown to the persona the most times.
          </TS>

          <PersonaSeen seen={feed} verb='seen' showSeen={openFeed => setQuery({ openFeed })} channels={chans} />

          {barFeeds && <>
            <TS>
              For each persona, this the portion of home page videos to different political categories.
            </TS>
            <NarrowSection>
              <BarFilters
                noun='Home page videos' verb='seen'
                data={barFeeds}
                md={barMd}
                filter={{ accounts: q.feedAccounts }}
                onFilter={f => setQuery({ feedAccounts: f.accounts, feedPeriod: f.period, feedTags: f.tags })}
              />
            </NarrowSection>
            <PersonaBar data={barFeeds} filter={{ accounts: q.feedAccounts, period: q.feedPeriod, tags: q.feedTags }} />
          </>}
        </Tab>
      </Tabs>

    </MinimalPage>

    <PersonaSeenPopup verb='watched' isOpen={q.openWatch != null} onClose={() => setQuery({ openWatch: undefined })} account={q.openWatch} channels={chans} useSeen={watch} />
    <PersonaSeenPopup verb='seen' isOpen={q.openFeed != null} onClose={() => setQuery({ openFeed: undefined })} account={q.openFeed} channels={chans} useSeen={feed} />
    <Tip {...chanTip.tipProps} ><ChannelDetails channel={chanTip.data} mode='min' /></Tip>
  </Layout>
}
export default PersonaPage


const BarFilters: FC<{ noun: string, verb: string, data: PersonaBarData, md: Partial<TableMdRun<BarStat>>, filter: BarFilter, onFilter: (f: Partial<BarFilter>) => void }> =
  ({ noun, verb, data, md, filter, onFilter }) => {
    const months = uniq(data.stats.map(r => r.month))
    const barPeriods = uniq(months.map(m => dateFormat(m, 'UTC', 'yyyy'))).map(y => ({ type: 'y', value: `${y}` }))
      .concat(months.map(m => ({ type: 'm', value: m })))

    const barFilterProps = { metadata: md, rows: data?.stats }
    return <>
      <FH>
        <span>{noun} seen by </span>
        <FP><FV {...barFilterProps} filter={{ account: filter.accounts }} onFilter={f => onFilter({ accounts: f.account })} /></FP>
        <FP>{verb} video tags <FV {...barFilterProps} filter={{ toTag: filter.tags }} onFilter={f => onFilter({ tags: f.toTag })} /></FP>
        <FP>in <PeriodSelect periods={barPeriods} showAll onPeriod={p => onFilter({ period: periodString(p) })} /></FP>
      </FH>
    </>
  }


const TS = styled(TextSection)`
  margin-top: 6em;
  margin-bottom: 3em;
`

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
        <ChannelLogo c={chan} style={{ height: '3em' }} />
        <CloseOutline style={{ verticalAlign: 'middle' }} className='clickable' onClick={() => onSelect(ids.filter(c => c != id))} />
      </Fragment>
    })}
    {channels && (multiSelect || !ids?.length) && <ChannelSearch onSelect={c => {
      onSelect(uniq((ids ?? []).concat([c.channelId])))
    }} channels={values(channels)} sortBy='channelViews' style={styles.normalFont} />}
  </div>
}