import { parseISO } from 'date-fns'
import React, { Fragment, useMemo, FunctionComponent as FC, useState } from 'react'
import ContainerDimensions from 'react-container-dimensions'
import { NarrativeCaption, NarrativeName, NarrativeVideo, VideoCaption } from '../../common/RecfluenceApi'
import { useNarrative, UseNarrativeProps, NarrativeFilterState } from '../NarrativeBubbles'
import { Tip, useTip } from '../Tip'
import { Video, Videos } from '../Video'
import { BeeChart } from '../BeeChart'
import { pick, take } from 'remeda'
import { TextSection } from '../Markdown'
import { FilterHeader, FilterPart } from '../FilterCommon'
import { InlineDateRange, rangeFromQuery, rangeToQuery } from '../DateRange'
import { assign, numFormat, toJson } from '../../common/Utils'
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

const narrativeProps: { [index in NarrativeName]: UseNarrativeProps & {
  words?: string[],
  showLr?: boolean, showCaptions?: boolean, showPlatform?: boolean, sizeFactor?: number, ticks?: number
} } = {
  'Vaccine Personal': {
    defaultFilter: { start: '2020-01-01', end: '2021-05-31' },
    narrativeIndexPrefix: 'narrative2',
    videoMap: (v) => ({ ...v, errorType: v.errorType ?? 'Available' }),
    words: ['vaccine', 'covid', 'coronavirus', 'SARS-CoV-2', 'vaccine', 'Wuhan flu', 'China virus', 'vaccinated', 'Pfizer', 'Moderna', 'BioNTech', 'AstraZeneca', 'Johnson \& Johnson', 'CDC', 'world health organization', 'Herd immunity', 'corona virus', 'kovid', 'covet', 'coven'],
    showCaptions: true
  },
  'Vaccine DNA': {
    defaultFilter: { start: '2020-01-01', end: '2021-05-31' },
    narrativeIndexPrefix: 'narrative2',
    videoMap: (v) => ({ ...v, errorType: v.errorType ?? 'Available' }),
    words: ['dna'],
    showCaptions: true
  },
  '2020 Election Fraud': {},
  QAnon: {
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
  Comcast: {
    defaultFilter: { start: '2019-01-01', tags: ['comcast'] },
    narrativeIndexPrefix: 'narrative2',
    videoMap: (v) => ({ ...v, errorType: v.errorType ?? 'Available' }),
    words: ['5g', 'verizon', 'comcast', 'net neutrality', 'Brian Roberts'], // we should have a unique in the index for this
    maxVideos: 2000,
    showCaptions: true,
    showLr: false,
    showPlatform: true,
    sizeFactor: 1,
    ticks: 150
  }
}

const videoMd: FilterTableMd = {
  ...md.video,
  tags: {
    ...md.video.tags,
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
      }
    ]
  }
}

export interface NarrativeVideoComponentProps {
  narrative?: NarrativeName
  sizeFactor?: number
  colorBy?: keyof NarrativeVideo
  showFlipX?: boolean
  videoFilter?: (keyof NarrativeFilterState)[]
}

export const NarrativeVideoComponent: FC<NarrativeVideoComponentProps> = ({ narrative, sizeFactor, colorBy, showFlipX }) => {
  const props = { ...narrativeProps[narrative], narrative }
  sizeFactor ??= props.sizeFactor ?? 1
  narrative ??= 'Vaccine Personal'
  colorBy ??= 'errorType'

  const colorMd = colMd(videoMd[colorBy] ?? md.channel[colorBy])
  const getColor = (v: NarrativeVideo) => colorMd.val[v[colorBy] as any]?.color ?? '#888'
  const { videoRows, channels, loading, idx, dateRange, setQuery, q, videoFilter, setVideoFilter } = useNarrative(props) // ignore bubbles and go directly to video granularity
  const windowDim = useWindowDim()

  const { bubbles, videos, stats } = useMemo(() => {
    const bubbles = videoRows && take(videoRows, props.maxVideos ?? 5000)
      .map(v => ({
        id: v.videoId,
        groupId: v.channelId,
        data: v,
        value: v.videoViews,
        color: getColor(v),
        date: parseISO(v.uploadDate),
        img: channels[v.channelId]?.logoUrl,
        selected: q.channelId?.includes(v.channelId)
      }))
    const videos = videoRows && videoRows.filter(v => filterIncludes(pick(q, ['channelId']), v)) // already filtered except for channelId because we want videoRows without that filter
    console.log('narrative component new data', { videoLength: videos?.length, q })
    const stats = {
      views: videos && sumBy(videos, v => v.videoViews),
      mentions: videos && sumBy(videos, v => sumBy(v.mentions.filter(m => m.keywords.some(k => !q.keywords || q.keywords.includes(k))), m => m.mentions)),
      videos: videos?.length
    }
    return { bubbles, videos, stats }
  }, [videoRows, toJson(q)])

  var tip = useTip<NarrativeVideo>()
  const [flipX, setFlipX] = useState(false)

  return <>
    <TextSection style={{ margin: '1em' }}>
      <p>Video <b>bubbles</b> sized by <b>views</b>, arranged by <b>upload date</b> and colored by <b>{colorMd.label}</b></p>
    </TextSection>

    <FilterHeader style={{ marginBottom: '2em', marginLeft: '1em' }}>
      <FilterPart>
        Uploaded <InlineDateRange range={dateRange} inputRange={rangeFromQuery(props.defaultFilter)} onChange={r => setQuery(rangeToQuery(r))} />
      </FilterPart>
      <FilterPart>
        <InlineValueFilter metadata={videoMd} filter={pickFull(videoFilter, ['tags'])} onFilter={setVideoFilter} rows={videoRows} display='buttons' />
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

      {showFlipX && <><input type='checkbox' checked={flipX} onChange={e => setFlipX(e.target.checked)} /><b>flip X</b></>}
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
          onSelect={(n) => { setQuery({ channelId: n ? [n.channelId] : null }) }}
          tip={tip}
          bubbleSize={windowDim.h / 1200 * sizeFactor}
          ticks={props.ticks}
          flipX={flipX}
        />}
      </ContainerDimensions>
    </div>

    <Tip {...tip.tipProps}>
      {tip.data && <Video v={tip.data} c={channels[tip.data.channelId]} showChannel showThumb />}
    </Tip>

    <TextSection style={{ margin: '1em' }}><p>Top viewed videos in context</p></TextSection>

    <Videos channels={channels} videos={videos}
      groupChannels showTags showChannels showThumb showPlatform={props.showPlatform}
      loading={loading}
      defaultLimit={Math.floor(windowDim.w / 300)}
      loadExtraOnVisible={async (vids) => {
        if (!idx?.captions || !props.showCaptions) return []
        const capsFilter = (c: VideoCaption) => videoFilter.keywords ? videoFilter.keywords?.some(k => c.tags?.some(t => t == k)) ?? false : true
        const res = await idx.captions.rowsWith(vids.map(v => pick(v, ['narrative', 'channelId', 'videoId'])), { andOr: 'or' })
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

const Num: FC<{ num: number, label: string }> = ({ num, label }) => <>
  {num && <span style={{ paddingRight: '1em' }}><span style={{ fontSize: '1.5em', fontWeight: 'bolder' }}>{numFormat(num)}</span> {label}</span>}
</>