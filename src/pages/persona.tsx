import React, { useEffect, useState, FunctionComponent as FC, useMemo } from 'react'
import Layout from '../components/Layout'
import { FlexRow, MinimalPage, NarrowSection, styles } from '../components/Style'
import PurposeBanner from '../components/PurposeBanner'
import { dateFormat, numFormat, toJson } from '../common/Utils'
import { pick, uniq, indexBy } from 'remeda'
import { Channel, getChannels, md } from '../common/Channel'
import ContainerDimensions from 'react-container-dimensions'
import { Video } from '../components/Video'
import { BlobIndex, blobIndex } from '../common/BlobIndex'
import { useQuery } from '../common/QueryString'
import { TextSection } from '../components/Markdown'
import { FilterHeader as FH, FilterPart as FP } from '../components/FilterCommon'
import { InlineValueFilter as FV } from '../components/ValueFilter'
import { takeRandom } from '../common/Pipe'
import PersonaBar, { BarFilter, BarStat, PersonaBarData, useBarData } from '../components/persona/PersonaBar'
import { loadRecData, Rec, RecState } from '../common/Persona'
import { PersonaVenn, RecVennKey } from '../components/persona/PersonaVenn'
import { PersonaSeen, useSeen, PersonaSeenPopup } from '../components/persona/PersonaSeen'
import { PeriodSelect, periodString } from '../components/Period'
import { RotateContent } from '../components/RotateContent'
import { ChannelDetails } from '../components/Channel'
import { tableMd, TableMdRun } from '../common/Metadata'

import { parseISO } from 'date-fns'
import { Tip, useTip } from '../components/Tip'
import styled from 'styled-components'
import { Tab, Tabs } from '../components/Tab'
import { PrefixAll } from '../common/Types'
import { SelectWithChannelSearch } from '../components/persona/SelectWithChannelSearch'



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
  const [q, setQuery] = useQuery<QueryState>()
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