import { parseISO } from 'date-fns'
import React, { Fragment, useMemo, FunctionComponent as FC } from 'react'
import ContainerDimensions from 'react-container-dimensions'
import { Narrative2CaptionKey, NarrativeName, NarrativeVideo, VideoCaption } from '../../common/RecfluenceApi'
import { useNarrative, UseNarrativeProps, NarrativeFilterState } from '../../common/Narrative'
import { Tip, useTip } from '../Tip'
import { Video, Videos } from '../Video'
import { BarNode, BeeChart, BeehiveNode } from '../BeeChart'
import { flatMap, pick, omit, take, uniqBy } from 'remeda'
import { TextSection } from '../Markdown'
import { FilterHeader, FilterPart } from '../FilterCommon'
import { InlineDateRange, rangeFromQuery, rangeToQuery } from '../DateRange'
import { dateFormat, numFormat, toJson } from '../../common/Utils'
import { loadingFilter, styles } from '../Style'
import { filterIncludes, FilterTableMd, InlineValueFilter } from '../ValueFilter'
import { ChannelLogo, ChannelSearch } from '../Channel'
import { CloseOutline } from '@styled-icons/evaicons-outline'
import { min, sumBy, values } from '../../common/Pipe'
import { md } from '../../common/Channel'
import { colMd } from '../../common/Metadata'
import { useWindowDim } from '../../common/Window'
import { pickFull } from '../../common/Pipe'
import styled from 'styled-components'

export const narrativeProps: { [index: string]: NarrativeVideoComponentProps } = {
  vaccinePersonal: {
    narratives: ['Vaccine Personal'],
    defaultFilter: { start: '2020-01-01', end: '2021-05-31' },
    words: ['vaccine', 'covid', 'coronavirus', 'SARS-CoV-2', 'vaccine', 'Wuhan flu', 'China virus', 'vaccinated', 'Pfizer', 'Moderna', 'BioNTech', 'AstraZeneca', 'Johnson \& Johnson', 'CDC', 'world health organization', 'Herd immunity', 'corona virus', 'kovid', 'covet', 'coven'],
    showCaptions: true
  },
  vaccineDna: {
    narratives: ['Vaccine DNA'],
    defaultFilter: { start: '2020-01-01', end: '2021-05-31' },
    words: ['dna'],
    showCaptions: true
  },
  '2020 Election Fraud': {
    narratives: ['2020 Election Fraud'],
    defaultFilter: { start: '2020-11-03', end: '2021-01-31' },
    showLr: true,
    maxVideos: 2000,
    groupBy: 'tags',
    colorBy: 'channelTags'
  },
  qanon: {
    narratives: ['QAnon'],
    defaultFilter: { start: '2020-05-01', end: '2021-06-1' },
    words: ['qanon', 'trump', 'august', 'reinstate', 'jfk'],
    maxVideos: 3000,
    showCaptions: true,
    showLr: false,
    showPlatform: true,
    sizeFactor: 1,
    ticks: 400
  },
  comcast: {
    narratives: ['comcast', '5g', 'netneutrality', 'Jews Control Media', 'Comcast Exec', 'Brian Roberts'],
    defaultFilter: { start: '2021-01-01', narrative: ['comcast'] },
    words: ['comcast', 'verizon'],
    maxVideos: 2000,
    showCaptions: true,
    showLr: true,
    showPlatform: true,
    sizeFactor: 1,
    ticks: 150,
    colorBy: 'platform'
  }
}

const narrativeCfg: { [index: string]: { label?: string, highlight?: string[] } } = {
  netneutrality: {
    label: 'Net Neutrality',
    highlight: ['net neutrality']
  },
  comcast:
  {
    label: 'Comcast'
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
  }
}


const getVideoMd = (props: NarrativeVideoComponentProps): FilterTableMd => ({
  ...md.video,
  narrative: {
    ...md.video.narrative,
    singleSelect: true,
    hideAll: true,
    values: props.narratives.map(n => ({ value: n, label: narrativeCfg[n]?.label ?? n }))
  },
  keywords: {
    ...md.video.keywords,
    values: [
      {
        value: 'non-connectivity',
      },
      {
        value: 'connectivity',
      }
    ]
  }
})

export interface NarrativeVideoComponentProps extends UseNarrativeProps {
  colorBy?: keyof NarrativeVideo
  groupBy?: Extract<keyof NarrativeVideo, string>
  showLr?: boolean
  showCaptions?: boolean
  showPlatform?: boolean
  sizeFactor?: number
  ticks?: number
  words?: string[]
}

export const NarrativeVideoComponent: FC<NarrativeVideoComponentProps> = ({ sizeFactor, colorBy, ...props }) => {
  sizeFactor ??= 1
  colorBy ??= 'platform'

  props = { words: [], narrativeIndexPrefix: 'narrative2', maxVideos: 3000, ...props }

  const videoMd = getVideoMd(props)
  const colorMd = colMd(videoMd[colorBy] ?? md.channel[colorBy])
  const getColor = (v: NarrativeVideo) => colorMd.val[v[colorBy] as any]?.color ?? '#888'
  const { channels, videoRows, loading, idx, dateRange, dateRangeIdx, setQuery, q, videoFilter, setVideoFilter } = useNarrative(props) // ignore bubbles and go directly to video granularity
  const windowDim = useWindowDim()
  const selectRange = rangeFromQuery(q, null, 'selected-')
  const inSelectRange = (v: NarrativeVideo) => {
    const upload = v.uploadDate ? parseISO(v.uploadDate) : null
    if (!selectRange.start || !upload) return null
    return selectRange.start <= upload && selectRange.end > upload
  }

  const { bubbles, videos, stats } = useMemo(() => {
    const bubbles = videoRows?.map(v => ({
      id: v.videoId,
      group: props.groupBy ? v[props.groupBy] as string : null,
      data: v,
      value: v.videoViews,
      color: getColor(v),
      date: v.uploadDate ? parseISO(v.uploadDate) : null,
      img: channels[v.channelId]?.logoUrl,
      selected: q.channelId?.includes(v.channelId) ?? inSelectRange(v)
    }))
    const videos = videoRows ? videoRows.filter(v => filterIncludes(pick(q, ['channelId']), v) && inSelectRange(v) != false) : null
    const stats = {
      views: videos ? sumBy(videos, v => v.videoViews) : null,
      mentions: videos ? sumBy(videos, v => sumBy(v.mentions?.filter(m => m.keywords.some(k => !q.keywords || q.keywords.includes(k))) ?? [], m => m.mentions)) : null,
      videos: videos?.length
    }
    return { bubbles, videos, stats }
  }, [videoRows, channels]) // videRows will update with new data form indexes, so ignore those on q to keep showing existing data until it's ready 

  const tip = useTip<NarrativeVideo>()
  const barTip = useTip<BarNode<BeehiveNode<NarrativeVideo>>>()
  const highlight = props.words.concat(flatMap(q.narrative ?? [], n => narrativeCfg[n]?.highlight ?? []))

  return <>
    <TextSection style={{ margin: '1em' }}>
      <p>Video <b>bubbles</b> sized by <b>views</b>, arranged by <b>upload date</b> and colored by <b>{colorMd.label}</b></p>
    </TextSection>

    <FilterHeader style={{ marginBottom: '2em', marginLeft: '1em' }}>
      <FilterPart>
        Uploaded <InlineDateRange
          range={dateRange}
          inputRange={dateRangeIdx}
          onChange={r => setQuery(rangeToQuery(r))} />
      </FilterPart>
      <FilterPart>
        <InlineValueFilter metadata={videoMd} filter={pickFull(videoFilter, ['narrative'])} onFilter={setVideoFilter} rows={videoRows} display='buttons' />
        <InlineValueFilter metadata={videoMd} filter={pickFull(videoFilter, ['errorType', 'keywords'])} onFilter={setVideoFilter} rows={videoRows} showCount />
      </FilterPart>
      <FilterPart>
        channel
        <InlineValueFilter metadata={videoMd} filter={pickFull(videoFilter, ['channelTags', 'lr', 'platform'])} onFilter={setVideoFilter} rows={videoRows} showCount />
      </FilterPart>
      <FilterPart>
        {channels && q.channelId && q.channelId.map(c => <Fragment key={c}>
          <ChannelLogo c={channels[c]} style={{ height: '2em' }} />
          <CloseOutline className='clickable'
            onClick={() => {
              const keys = q.channelId?.filter(k => k != c)
              return setQuery({ channelId: keys?.length > 0 ? keys : null })
            }} />
        </Fragment>)}
        {channels && !q.channelId && <ChannelSearch
          style={styles.normalFont}
          onSelect={c => setQuery({ channelId: [c.channelId] })}
          channels={values(channels)} sortBy='views' placeholder='channel search' />}
      </FilterPart>
    </FilterHeader>

    <TextSection style={{ margin: '1em' }}>
      <Num num={stats.videos} label='videos' />
      <Num num={stats.mentions} label='mentions' />
      <Num num={stats.views} label='views' />
    </TextSection>

    <div style={{ filter: loading ? loadingFilter : null }}>
      <ContainerDimensions>
        {({ width }) => <BeeChart
          w={width - 5}
          nodes={bubbles}
          onSelect={(n) => setQuery({
            channelId: n?.data?.channelId ? [n?.data?.channelId] : null,
            ...rangeToQuery(n?.dateRange, 'selected-')
          })}
          selectedRange={rangeFromQuery(q, null, 'selected-')}
          tip={tip}
          barTip={barTip}
          bubbleSize={windowDim.h / 1200 * sizeFactor}
          ticks={props.ticks}
          maxBubbles={props.maxVideos}
        />}
      </ContainerDimensions>
    </div>

    <Tip {...tip.tipProps}>
      {tip.data && <Video v={tip.data} c={channels[tip.data.channelId]} showChannel showThumb />}
    </Tip>

    <Tip {...barTip.tipProps}>
      {barTip.data && <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ marginBottom: '0.5em' }}>
          <Subtle style={{ marginRight: '0.5em' }}>Week of</Subtle>
          <NumStyle style={{ fontSize: '1.5em' }}>{dateFormat(barTip.data.date)}</NumStyle>
        </span>
        <Num num={barTip.data.data.length} label='videos' />
        <Num num={barTip.data.value} label='views' />
        <Num num={uniqBy(barTip.data.data, d => d.data.channelId).length} label='channels' />
      </div>}
    </Tip>

    {videos && <TextSection style={{ margin: '1em' }}><p>Top viewed videos in context</p></TextSection>}

    <Videos channels={channels} videos={videos}
      groupChannels showTags showChannels showThumb showPlatform={props.showPlatform}
      loading={loading}
      defaultLimit={Math.floor(windowDim.w / 100)}
      loadExtraOnVisible={async (vids) => {
        if (!idx?.captions || !props.showCaptions) return []
        const capsFilter = (s: VideoCaption) => videoFilter.keywords ? (videoFilter.keywords?.some(k => s.tags?.some(t => t == k)) ?? false) : true
        const res = await idx.captions.rowsWith(vids.map(v => pick(v, ['narrative', 'uploadDate']) as Narrative2CaptionKey), { andOr: 'or' })
          .then(caps => caps.map(v => ({ ...v, captions: v.captions?.filter(capsFilter) })))
        return res
      }}
      highlightWords={highlight}
    />
  </>
}

const NumStyle = styled.span`
  font-size:2em;
  font-weight:bold;
`

const Subtle = styled.span`
  color:var(--fg2);
`

const Num: FC<{ num: number, label: string }> = ({ num, label }) => <>
  {!num ? <></> : <span style={{ paddingRight: '1em' }}>
    <span style={{ fontSize: '1.5em', fontWeight: 'bolder' }}>{numFormat(num)}</span>
    <Subtle> {label}</Subtle>
  </span>}
</>