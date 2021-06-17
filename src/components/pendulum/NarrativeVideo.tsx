import { parseISO } from 'date-fns'
import React, { Fragment, useMemo, FunctionComponent as FC, useState } from 'react'
import ContainerDimensions from 'react-container-dimensions'
import { NarrativeCaption, NarrativeName, NarrativeVideo, VideoCaption } from '../../common/RecfluenceApi'
import { useNarrative, UseNarrativeProps, NarrativeFilterState } from '../NarrativeBubbles'
import { Tip, useTip } from '../Tip'
import { Video, Videos } from '../Video'
import { BeeChart } from '../BeeChart'
import { pick } from 'remeda'
import { TextSection } from '../Markdown'
import { FilterHeader, FilterPart } from '../FilterCommon'
import { InlineDateRange, rangeToQuery } from '../DateRange'
import { assign, toJson } from '../../common/Utils'
import { styles } from '../Style'
import { filterIncludes, InlineValueFilter } from '../ValueFilter'
import { ChannelLogo, ChannelSearch } from '../Channel'
import { CloseOutline } from '@styled-icons/evaicons-outline'
import { values } from '../../common/Pipe'
import { md } from '../../common/Channel'
import { colMd } from '../../common/Metadata'
import { useWindowDim } from '../../common/Window'


const narrativeProps: { [index in NarrativeName]: UseNarrativeProps & {
  words?: string[],
  showLr?: boolean, showCaptions?: boolean, showPlatform?: boolean, sizeFactor?: number, ticks?: number
} } = {
  'Vaccine Personal': {
    defaultRange: { startDate: new Date(2020, 1 - 1, 1), endDate: new Date(2021, 5 - 1, 31) },
    narrativeIndexPrefix: 'narrative2',
    videoMap: (v) => ({ ...v, errorType: v.errorType ?? 'Available' }),
    words: ['vaccine', 'covid', 'coronavirus', 'SARS-CoV-2', 'vaccine', 'Wuhan flu', 'China virus', 'vaccinated', 'Pfizer', 'Moderna', 'BioNTech', 'AstraZeneca', 'Johnson \& Johnson', 'CDC', 'world health organization', 'Herd immunity', 'corona virus', 'kovid', 'covet', 'coven'],
    showCaptions: true
  },
  'Vaccine DNA': {
    defaultRange: { startDate: new Date(2020, 1 - 1, 1), endDate: new Date(2021, 5 - 1, 31) },
    narrativeIndexPrefix: 'narrative2',
    videoMap: (v) => ({ ...v, errorType: v.errorType ?? 'Available' }),
    words: ['dna'],
    showCaptions: true
  },
  '2020 Election Fraud': {},
  QAnon: {
    defaultRange: { startDate: new Date(2021, 5 - 1, 1), endDate: new Date(2021, 6 - 1, 6) },
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
    defaultRange: { startDate: new Date(2019, 0, 1), endDate: new Date(2021, 7 - 1, 6) },
    narrativeIndexPrefix: 'narrative2',
    videoMap: (v) => ({ ...v, errorType: v.errorType ?? 'Available' }),
    words: ['5g', 'verizon', 'comcast'], // we should have a unique in the index for this
    maxVideos: 3000,
    showCaptions: true,
    showLr: false,
    showPlatform: true,
    sizeFactor: 1,
    ticks: 400
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
  const nProps = { ...narrativeProps[narrative], narrative }
  sizeFactor ??= nProps.sizeFactor ?? 1
  narrative ??= 'Vaccine Personal'
  colorBy ??= 'errorType'

  const colorMd = colMd(md.video[colorBy] ?? md.channel[colorBy])
  const getColor = (v: NarrativeVideo) => colorMd.val[v[colorBy] as any]?.color ?? '#888'
  const { videoRows, channels, loading, idx, dateRange, setQuery, q, videoFilter, setVideoFilter } = useNarrative(nProps) // ignore bubbles and go directly to video granularity
  const windowDim = useWindowDim()

  const { bubbles, videos } = useMemo(() => {
    const bubbles = videoRows?.map(v => ({
      id: v.videoId,
      groupId: v.channelId,
      data: v,
      value: v.videoViews,
      color: getColor(v),
      date: parseISO(v.uploadDate),
      img: channels[v.channelId]?.logoUrl,
      selected: q.channelId?.includes(v.channelId)
    }))
    const videos = videoRows?.filter(v => filterIncludes(pick(q, ['channelId']), v)) // already filtered except for channelId because we want videoRows without that filter
    return { bubbles, videos }
  }, [videoRows, toJson(q)])

  var tip = useTip<NarrativeVideo>()

  const [flipX, setFlipX] = useState(false)

  return <>
    <TextSection style={{ margin: '1em' }}>
      <p>Video <b>bubbles</b> sized by <b>views</b>, arranged by <b>upload date</b> and colored by <b>{colorMd.label}</b></p>
    </TextSection>

    <FilterHeader style={{ marginBottom: '2em', marginLeft: '1em' }}>
      <FilterPart>
        Uploaded <InlineDateRange range={dateRange} inputRange={nProps.defaultRange} onChange={r => setQuery(rangeToQuery(r))} />
      </FilterPart>
      <FilterPart>
        video
        <InlineValueFilter metadata={md.video} filter={pick(videoFilter, ['errorType', 'keywords', 'tags'])} onFilter={setVideoFilter} rows={videos} showCount />
      </FilterPart>
      <FilterPart>
        channel
        <InlineValueFilter metadata={md.video} filter={pick(videoFilter, ['channelTags', 'lr', 'platform'])} onFilter={setVideoFilter} rows={videos} showCount />
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

    <div>
      <ContainerDimensions>
        {({ width }) => <BeeChart
          w={width - 5}
          nodes={bubbles}
          onSelect={(n) => { setQuery({ channelId: n ? [n.channelId] : null }) }}
          tip={tip}
          bubbleSize={windowDim.h / 1200 * sizeFactor}
          ticks={nProps.ticks}
          flipX={flipX}
        />}
      </ContainerDimensions>
    </div>

    <Tip {...tip.tipProps}>
      {tip.data && <Video v={tip.data} c={channels[tip.data.channelId]} showChannel showThumb />}
    </Tip>

    <TextSection style={{ margin: '1em' }}><p>Top viewed videos in context</p></TextSection>

    <Videos channels={channels} videos={videos}
      groupChannels showTags showChannels showThumb showPlatform={nProps.showPlatform}
      loading={loading}
      defaultLimit={Math.floor(windowDim.w / 300)}
      loadExtraOnVisible={async (vids) => {
        if (!idx?.captions || !nProps.showCaptions) return []
        const capsFilter = (c: VideoCaption) => videoFilter.keywords ? videoFilter.keywords?.some(k => c.tags?.some(t => t == k)) ?? false : true
        const res = await idx.captions.rowsWith(vids.map(v => pick(v, ['narrative', 'channelId', 'videoId'])), { andOr: 'or' })
          .then(caps => {
            console.log('caps filtering', { videoFilter, caps })
            return caps.map(v => ({ ...v, captions: v.captions?.filter(capsFilter) }))
          })
        return res
      }}
      highlightWords={nProps.words}
    />
  </>
}