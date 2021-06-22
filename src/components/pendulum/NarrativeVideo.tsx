import { parseISO } from 'date-fns'
import React, { Fragment, useMemo, FunctionComponent as FC } from 'react'
import ContainerDimensions from 'react-container-dimensions'
import { Narrative2CaptionKey, NarrativeName, NarrativeVideo, VideoCaption } from '../../common/RecfluenceApi'
import { useNarrative, UseNarrativeProps, NarrativeFilterState } from '../NarrativeBubbles'
import { Tip, useTip } from '../Tip'
import { Video, Videos } from '../Video'
import { BarNode, BeeChart, BeehiveNode } from '../BeeChart'
import { pick, take, uniqBy } from 'remeda'
import { TextSection } from '../Markdown'
import { FilterHeader, FilterPart } from '../FilterCommon'
import { InlineDateRange, rangeFromQuery, rangeToQuery } from '../DateRange'
import { dateFormat, numFormat, toJson } from '../../common/Utils'
import { styles } from '../Style'
import { filterIncludes, FilterTableMd, InlineValueFilter } from '../ValueFilter'
import { ChannelLogo, ChannelSearch } from '../Channel'
import { CloseOutline } from '@styled-icons/evaicons-outline'
import { sumBy, values } from '../../common/Pipe'
import { md } from '../../common/Channel'
import { colMd } from '../../common/Metadata'
import { useWindowDim } from '../../common/Window'
import { pickFull } from '../../common/Pipe'
import styled from 'styled-components'

export const narrativeProps: { [index: string]: NarrativeVideoComponentProps } = {
  vaccinePersonal: {
    narratives: ['Vaccine Personal'],
    defaultFilter: { start: '2020-01-01', end: '2021-05-31' },
    narrativeIndexPrefix: 'narrative2',
    videoMap: (v) => ({ ...v, errorType: v.errorType ?? 'Available' }),
    words: ['vaccine', 'covid', 'coronavirus', 'SARS-CoV-2', 'vaccine', 'Wuhan flu', 'China virus', 'vaccinated', 'Pfizer', 'Moderna', 'BioNTech', 'AstraZeneca', 'Johnson \& Johnson', 'CDC', 'world health organization', 'Herd immunity', 'corona virus', 'kovid', 'covet', 'coven'],
    showCaptions: true
  },
  vaccineDna: {
    narratives: ['Vaccine DNA'],
    defaultFilter: { start: '2020-01-01', end: '2021-05-31' },
    narrativeIndexPrefix: 'narrative2',
    videoMap: (v) => ({ ...v, errorType: v.errorType ?? 'Available' }),
    words: ['dna'],
    showCaptions: true
  },
  '2020 Election Fraud': {},
  qanon: {
    narratives: ['QAnon'],
    defaultFilter: { start: '2020-05-01', end: '2021-06-1' },
    narrativeIndexPrefix: 'narrative2',
    videoMap: (v) => ({ ...v, errorType: v.errorType ?? 'Available' }),
    words: ['qanon', 'trump', 'august', 'reinstate', 'jfk'],
    maxVideos: 3000,
    showCaptions: true,
    showLr: false,
    showPlatform: true,
    sizeFactor: 1,
    ticks: 400
  },
  comcast: {
    narratives: ['comcast', '5g', 'netneutrality', 'Jews Control Media'],
    defaultFilter: { start: '2021-01-01', narrative: ['comcast'] },
    narrativeIndexPrefix: 'narrative2',
    videoMap: (v) => ({ ...v, errorType: v.errorType ?? 'Available' }),
    words: ['5g', 'verizon', 'comcast', 'net neutrality', 'Brian Roberts'], // we should have a unique in the index for this
    maxVideos: 2000,
    showCaptions: true,
    showLr: true,
    showPlatform: true,
    sizeFactor: 1,
    ticks: 150,
    colorBy: 'platform'
  }
}

const videoMd: FilterTableMd = {
  ...md.video,
  narrative: {
    ...md.video.narrative,
    singleSelect: true,
    hideAll: true,
    values: [
      {
        value: 'netneutrality',
        label: 'Net Neutrality',
      },
      {
        value: 'comcast',
        label: 'Comcast'
      },
      {
        value: '5g',
        label: '5G'
      },
      {
        value: 'Jews Control Media',
      }
    ]
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
}

export interface NarrativeVideoComponentProps extends UseNarrativeProps {
  colorBy?: keyof NarrativeVideo
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

  const colorMd = colMd(videoMd[colorBy] ?? md.channel[colorBy])
  const getColor = (v: NarrativeVideo) => colorMd.val[v[colorBy] as any]?.color ?? '#888'
  const { videoRows, channels, loading, idx, dateRange, dateRangeIdx, setQuery, q, videoFilter, setVideoFilter } = useNarrative(props) // ignore bubbles and go directly to video granularity
  const windowDim = useWindowDim()
  const selectRange = rangeFromQuery(q, null, 'selected-')
  const inSelectRange = (v: NarrativeVideo) => {
    const upload = parseISO(v.uploadDate)
    if (!selectRange.start) return null
    return selectRange.start <= upload && selectRange.end > upload
  }

  const { bubbles, videos, stats } = useMemo(() => {
    const bubbles = videoRows ? take(videoRows, props.maxVideos ?? 5000)
      .map(v => {
        return {
          id: v.videoId,
          groupId: v.channelId,
          data: v,
          value: v.videoViews,
          color: getColor(v),
          date: parseISO(v.uploadDate),
          img: channels[v.channelId]?.logoUrl,
          selected: q.channelId?.includes(v.channelId) ?? inSelectRange(v)
        }
      }) : null
    const videos = videoRows ? videoRows.filter(v => filterIncludes(pick(q, ['channelId']), v) && inSelectRange(v) != false) : null
    const stats = {
      views: videos ? sumBy(videos, v => v.videoViews) : null,
      mentions: videos ? sumBy(videos, v => sumBy(v.mentions?.filter(m => m.keywords.some(k => !q.keywords || q.keywords.includes(k))) ?? [], m => m.mentions)) : null,
      videos: videos?.length
    }
    return { bubbles, videos, stats }
  }, [videoRows, toJson(q)])

  const tip = useTip<NarrativeVideo>()
  const barTip = useTip<BarNode<BeehiveNode<NarrativeVideo>>>()

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

    <div>
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

    <TextSection style={{ margin: '1em' }}><p>Top viewed videos in context</p></TextSection>

    <Videos channels={channels} videos={videos}
      groupChannels showTags showChannels showThumb showPlatform={props.showPlatform}
      loading={loading}
      defaultLimit={Math.floor(windowDim.w / 100)}
      loadExtraOnVisible={async (vids) => {
        if (!idx?.captions || !props.showCaptions) return []
        const capsFilter = (s: VideoCaption) => videoFilter.keywords ? (videoFilter.keywords?.some(k => s.tags?.some(t => t == k)) ?? false) : true
        const res = await idx.captions.rowsWith(vids.map(v => pick(v, ['narrative', 'uploadDate']) as Narrative2CaptionKey), { andOr: 'or' })
          .then(caps => {
            console.log('caps filtering', { videoFilter, caps })
            return caps.map(v => ({ ...v, captions: v.captions?.filter(capsFilter) }))
          })
        return res
      }}
      highlightWords={props.words}
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