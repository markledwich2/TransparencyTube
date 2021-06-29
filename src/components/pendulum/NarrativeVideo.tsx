import { parseISO } from 'date-fns'
import React, { Fragment, useMemo, FunctionComponent as FC } from 'react'
import ContainerDimensions from 'react-container-dimensions'
import { Narrative2CaptionKey, NarrativeVideo, VideoCaption } from '../../common/RecfluenceApi'
import { useNarrative, UseNarrativeProps, narrativeCfg, narrativeProps, getVideoMd } from '../../common/Narrative'
import { Tip, UseTip, useTip } from '../Tip'
import { Video, Videos } from '../Video'
import { BarNode, BeeChart, BeehiveNode } from '../BeeChart'
import { flatMap, pick, uniqBy } from 'remeda'
import { Markdown, TextSection } from '../Markdown'
import { FilterHeader, FilterPart } from '../FilterCommon'
import { InlineDateRange, rangeFromQuery, rangeToQuery } from '../DateRange'
import { dateFormat, numFormat } from '../../common/Utils'
import { loadingFilter, styles } from '../Style'
import { filterIncludes, InlineValueFilter } from '../ValueFilter'
import { ChannelLogo, ChannelSearch, Tag } from '../Channel'
import { CloseOutline } from '@styled-icons/evaicons-outline'
import { sumBy, values } from '../../common/Pipe'
import { md } from '../../common/Channel'
import { colMd, ColumnMd, ColumnMdRun, TableMd } from '../../common/Metadata'
import { useWindowDim } from '../../common/Window'
import { pickFull } from '../../common/Pipe'
import styled from 'styled-components'
import { HelpTip } from '../HelpTip'
import { RouteComponentProps } from '@reach/router'

export interface NarrativeVideoComponentProps extends UseNarrativeProps {
  narrative?: Extract<keyof typeof narrativeProps, string>,
  colorBy?: Extract<keyof NarrativeVideo, string>
  groupBy?: Extract<keyof NarrativeVideo, string>
  showLr?: boolean
  showCaptions?: boolean
  showPlatform?: boolean
  sizeFactor?: number
  ticks?: number
  words?: string[]
  md?: TableMd
  groupTitleSuffix?: (group: string, rows: NarrativeVideo[]) => JSX.Element
}

export const NarrativeVideoComponent: FC<RouteComponentProps<NarrativeVideoComponentProps>> = ({ narrative, ...props }) => {
  props = {
    colorBy: 'platform',
    sizeFactor: 1,
    words: [],
    narrativeIndexPrefix: 'narrative2',
    maxVideos: 3000,
    showCaptions: true,
    ... (narrative ? narrativeProps[narrative] : {}),
    ...props
  }
  const { colorBy, groupBy } = props
  const videoMd = getVideoMd(props)
  const colorMd = colorBy && colMd(videoMd[colorBy] ?? md.channel[colorBy])
  const groupMd = groupBy && colMd(videoMd[groupBy] ?? md.channel[groupBy])
  const getColor = (v: NarrativeVideo) => colorMd.val[v[colorBy] as any]?.color ?? '#888'
  const { channels, videoRows, loading, idx, dateRange, dateRangeIdx, setQuery, q, videoFilter, setVideoFilter } = useNarrative(props) // ignore bubbles and go directly to video granularity
  const windowDim = useWindowDim()
  const selectRange = rangeFromQuery(q, null, 'selected-')
  const inSelectRange = (v: NarrativeVideo) => {
    const upload = v.uploadDate ? parseISO(v.uploadDate) : null
    if (!selectRange.start || !upload) return null
    return selectRange.start <= upload && selectRange.end > upload
  }

  const { bubbles, videos } = useMemo(() => {
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
    return { bubbles, videos }
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
        {props.narratives?.length > 1 && <InlineValueFilter metadata={videoMd} filter={pickFull(videoFilter, ['narrative'])} onFilter={setVideoFilter} rows={videoRows} display='buttons' />}
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
          bubbleSize={windowDim.h / 1200 * props.sizeFactor}
          ticks={props.ticks}
          maxBubbles={props.maxVideos}
          groupRender={(g, videos) => <GroupTitle group={g} videos={videos} keywords={q.keywords} md={groupMd} suffix={props.groupTitleSuffix} />}
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
        const res = await idx.captions.rowsWith(vids.map(v => pick(v as NarrativeVideo, ['narrative', 'uploadDate']) as Narrative2CaptionKey), { andOr: 'or' })
          .then(caps => caps.map(v => ({ ...v, captions: v.captions?.filter(capsFilter) })))
        return res
      }}
      highlightWords={highlight}
      contentSubTitle={v => v[groupBy] && <ColTag data={v} md={groupMd} />}
    />
  </>
}

const ColTag: FC<{ data: Record<any, any> | string, md: ColumnMdRun }> = ({ data, md }) => {
  const v = typeof data == "string" ? data : data[md.name] as string
  const vMd = v && md && md.val[v]
  return v && vMd ? <Tag key={v} color={vMd?.color}>{vMd?.label}</Tag> : <></>
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
    <span style={{ fontSize: '1.2em', fontWeight: 'bolder' }}>{numFormat(num)}</span>
    <Subtle> {label}</Subtle>
  </span>}
</>


const GroupTitle = ({ group, md, videos, keywords, suffix }: {
  group: string
  md?: ColumnMdRun
  videos: NarrativeVideo[]
  keywords?: string[]
  suffix?: (group: string, rows: NarrativeVideo[]) => JSX.Element
}) => {
  const groupTip = useTip<{}>()

  const stats = {
    views: videos ? sumBy(videos, v => v?.videoViews ?? 0) : null,
    mentions: videos ? sumBy(videos, v => sumBy(v.mentions?.filter(m => m.keywords.some(k => !keywords || keywords.includes(k))) ?? [], m => m.mentions)) : null,
    videos: videos?.length
  }

  const groupMd = md?.val[group]

  return <div style={{}}>
    <TextSection style={{ margin: '0.2em' }}>
      <span style={{ paddingRight: '0.5em', fontWeight: 'bold' }}><ColTag data={group} md={md} /></span>
      {groupMd?.desc && <span style={{ paddingRight: '1em' }}><HelpTip useTip={groupTip}><Markdown>{groupMd?.desc}</Markdown></HelpTip></span>}
      <Num num={stats.videos} label='videos' />
      <Num num={stats.mentions} label='mentions' />
      <Num num={stats.views} label='views' />
      {suffix && suffix(group, videos)}
    </TextSection>
  </div>
}
