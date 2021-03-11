import React, { useState, FunctionComponent as FC, PropsWithChildren, useEffect, CSSProperties, useMemo } from 'react'
import { dateFormat, hoursFormat, numFormat, secondsFormat } from '../common/Utils'
import { videoThumb, videoUrl } from '../common/Video'
import { Spinner } from './Spinner'
import { FlexCol, FlexRow, loadingFilter, StyleProps } from './Layout'
import { ChannelDetails, ChannelTitle, Tag } from './Channel'
import styled from 'styled-components'
import { ToolTip } from './Tooltip'
import { ChannelWithStats, VideoViews, VideoCommon, VideoRemoved, isVideoViews, isVideoError, isVideoNarrative, VideoNarrative, VideoCaption } from '../common/RecfluenceApi'
import { Channel, channelUrl, md } from '../common/Channel'
import { flatMap, groupBy, indexBy, map, pipe, take } from 'remeda'
import { entries, minBy, orderBy, sumBy } from '../common/Pipe'
import ContainerDimensions from 'react-container-dimensions'
import { colMd } from '../common/Metadata'
import Highlighter from "react-highlight-words"
import ReactTooltip from 'react-tooltip'
import { Tip, useTip, UseTip } from './Tip'


export interface VideoId { videoId: string }

interface VideosProps<T extends VideoCommon, TExtra extends VideoId> {
  channels?: Record<string, Channel>
  videos?: T[]
  onOpenChannel?: (c: ChannelWithStats) => void
  showChannels?: boolean
  loading?: boolean
  showThumb?: boolean
  groupChannels?: boolean
  showTags?: boolean
  defaultLimit?: number
  highlightWords?: string[]
  loadCaptions?: (videoId: string) => Promise<VideoCaption[]>
  loadExtraOnVisible?: (v: T[]) => Promise<TExtra[]>
  contentBelow?: (v: (T & Partial<TExtra>)) => JSX.Element
  videoStyle?: CSSProperties
}

interface VideoGroup<T extends VideoCommon, TExtra extends VideoId> {
  channelId: string,
  channel: Channel,
  vidsToShow: (T & Partial<TExtra>)[],
  showAll: boolean,
  showLessVisible: boolean,
  showAllVisible: boolean,
  totalVids: number,
  showChannel: boolean
}

const chanVidChunk = 3, multiColumnVideoWidth = 400, videoPadding = 16

export const Videos = <T extends VideoCommon, TExtra extends VideoId>({ onOpenChannel, videos, showChannels, channels, loading, showThumb,
  groupChannels, showTags, defaultLimit, highlightWords,
  loadCaptions, loadExtraOnVisible, contentBelow, style, videoStyle }: StyleProps & VideosProps<T, TExtra>) => {

  const [limit, setLimit] = useState(defaultLimit ?? 40)
  const [showAlls, setShowAlls] = useState<Record<string, boolean>>({})
  const [extras, setExtras] = useState<Record<string, TExtra>>({})
  const chanTip = useTip<Channel>()

  const { groupedVids, groupedVidsTotal } = useMemo(() => {
    let groupedVids: VideoGroup<T, TExtra>[] = null
    let groupedVidsTotal: number = null
    if (groupChannels && videos) {
      var groupedVidsRaw = groupChannels && pipe(
        entries(groupBy(videos, v => v.channelId)).map(e => ({ channelId: e[0], vids: orderBy(e[1], v => v.videoViews, 'desc') })),
        orderBy(g => sumBy(g.vids, v => v.videoViews), 'desc'),
      )
      groupedVidsTotal = groupedVidsRaw.length
      if (groupedVidsTotal > 1) groupedVidsRaw = take(groupedVidsRaw, limit)
      const singleChannel = groupedVidsRaw.length == 1
      groupedVids = groupedVidsRaw && map(groupedVidsRaw, g => {
        const showAll = showAlls?.[g.channelId] || singleChannel
        const vidsToShow = (showAll ? g.vids : g.vids.slice(0, chanVidChunk)).map(v => {
          const e = extras[v.videoId]
          return e ? { ...v, ...e } : v as T & Partial<TExtra>
        })
        return ({
          ...g,
          channel: channels?.[g.channelId],
          showAll,
          showLessVisible: !singleChannel && showAll && g.vids.length > chanVidChunk,
          showAllVisible: !singleChannel && !showAll && vidsToShow.length < g.vids.length,
          vidsToShow,
          showChannel: true,
          totalVids: g.vids.length
        })
      })

      if (singleChannel) { // collapse videos into their own groups
        const g = groupedVids[0]
        groupedVids = g.vidsToShow.map((v, i) => ({ ...g, vidsToShow: [v], showChannel: i == 0 }))
      }
    }
    return { groupedVids, groupedVidsTotal }
  }, [limit, showAlls, extras, videos, channels, groupChannels])



  useEffect(() => { ReactTooltip.rebuild() }, [videos?.length, limit])

  // load extra's for visible videos
  useEffect(() => {
    if (!loadExtraOnVisible || !groupedVids) return
    const toLoad = flatMap(groupedVids, g => g.vidsToShow).filter(v => !extras[v.videoId])
    if (toLoad.length > 0)
      loadExtraOnVisible(toLoad).then(es => {
        if (!es) return
        const newExtras = indexBy(es, e => e.videoId)
        setExtras({ ...extras, ...newExtras })
      })
  }, [videos?.length, limit, showAlls])

  return <div style={style}> {useMemo(() => {
    if (!videos) return <Spinner />
    const showMore = (groupedVidsTotal ?? videos?.length) > limit
    return <><div style={{
      filter: loading ? loadingFilter : null,
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      width: '100%'
    }}>
      {videos?.length == 0 && <p style={{ margin: '3em 0', textAlign: 'center', color: 'var(--fg3)' }}>No videos</p>}
      {groupedVids &&
        <ContainerDimensions>
          {({ width }) => {
            const numCols = Math.max(Math.floor(width / multiColumnVideoWidth), 1)
            const videoWidth = width / numCols - videoPadding
            // flex doesn't do a column wrap. Se we do this ourselves
            var colGroups: VideoGroup<T, TExtra>[][] = [...Array(numCols)].map(_ => [...new Array(0)])

            groupedVids.forEach(g => {
              var colG = minBy(colGroups, cg => sumBy(cg, g => g.vidsToShow.length))
              colG.push(g)
            })

            return <FlexRow space={numCols == 1 ? '0' : '1em'}>
              {colGroups.map((colGroup, i) => <FlexCol key={i}>{colGroup.map(g => {
                const { vidsToShow, channelId, channel, showAll, showAllVisible, showLessVisible, totalVids, showChannel } = g
                return vidsToShow.map((v, i) => <div key={`${channelId}|${i}`}>
                  {i == 0 && showChannel && <VideoChannel
                    c={channel}
                    onOpenChannel={onOpenChannel}
                    v={v}
                    highlightWords={highlightWords}
                    showTags={showTags}
                    useTip={chanTip} />}
                  <Video
                    key={v.videoId}
                    onOpenChannel={onOpenChannel}
                    showThumb={showThumb}
                    v={v}
                    style={{ width: (videoWidth), ...videoStyle }}
                    highlightWords={highlightWords}
                    loadCaptions={loadCaptions}
                    children={contentBelow?.(v)} />
                  {i == vidsToShow.length - 1 && (showAllVisible || showLessVisible) &&
                    <a onClick={_ => setShowAlls({ ...showAlls, [channelId]: !showAll })}>
                      {showLessVisible ? `show less videos` : `show all ${totalVids} videos`}
                    </a>}
                </div>)
              })}
              </FlexCol>
              )}
            </FlexRow>
          }}
        </ContainerDimensions>}
      {!groupedVids && videos && videos.slice(0, limit).map(v => <Video
        key={v.videoId}
        onOpenChannel={onOpenChannel}
        showThumb={showThumb}
        showChannel={showChannels}
        v={v}
        style={{ width: '40em', maxWidth: '100%', ...videoStyle }}
        c={showChannels && channels && channels[v.channelId]}
        useTip={chanTip}
        children={contentBelow?.(v as T & Partial<TExtra>)} />)}
    </div>
      {showMore && <div style={{ textAlign: 'center', padding: '1em', fontWeight: 'bold', visibility: videos?.length > limit ? null : 'hidden' }}>
        <a onClick={_ => setLimit(limit + 200)}>show more</a>
      </div>}
    </>
  }, [videos, groupedVids, loading, limit])}
    {showChannels && <Tip {...chanTip.tipProps}>{chanTip.data && <ChannelDetails channel={chanTip.data as ChannelWithStats} mode='min' />}</Tip>}
  </div>
}

const VideoStyle = styled.div`
  display:flex;
  margin-bottom: 0.5em;
  flex-direction:row;
  .rank {
    font-size:1em;
    left:0px;
    top:0px;
    padding:0.3em 0.2em;
    min-width:2em;
    height:2em;
    position:absolute;
    font-weight:bolder;
    background-color: #ddd;
    color:#333;
    text-align:center;
    border-radius: 2em;
    box-shadow: 0px 1px 6px 2px #444;
  }
  .duration {
    position:absolute;
    text-align:left;
    padding:0.1em 0.5em;
    background-color: rgba(0,0,0,0.7);
    color:#ddd;
    border-radius: 1em;
    font-weight:normal;
    right:0.5em;
    top:0.15em;
  }
`

const BMetric = styled.b`
  font-size:1.3em;
  color:var(--fg);
`

type VideoTypes = VideoRemoved | VideoViews | VideoCommon | VideoNarrative

interface VideoProps extends StyleProps {
  v: VideoTypes,
  c?: Channel,
  onOpenChannel?: (c: Channel) => void,
  showThumb?: boolean
  showChannel?: boolean
  highlightWords?: string[]
  loadCaptions?: (videoId: string) => Promise<VideoCaption[]>
  useTip?: UseTip<Channel>
}

export const Video: FC<VideoProps> = ({ v, style, c, onOpenChannel, showChannel, showThumb, highlightWords, loadCaptions, children, useTip }) => {
  const [loadedCaps, setLoadedCaps] = useState<VideoCaption[]>(null)

  const fPeriodViews = isVideoViews(v) ? numFormat(v.periodViews) : null
  const fViews = numFormat(v.videoViews)
  const errorTypeOpt = isVideoError(v) ? md.video.errorType.val[v.errorType] : null
  const supportOpt = isVideoNarrative(v) ? md.video.support.val[v.support] : null
  const supplementOpt = isVideoNarrative(v) ? md.video.supplement.val[v.supplement] : null

  const captions = orderBy(v?.captions ?? loadedCaps ?? [], cap => cap.offsetSeconds, 'asc')
  const showLoadCaptions = captions?.length <= 0 && loadCaptions && !(isVideoError(v) && !v.hasCaptions)

  return <VideoStyle style={style}>
    <FlexRow style={{ flexWrap: 'wrap' }}>
      {showThumb && <div style={{ position: 'relative' }}>
        <VideoA id={v.videoId}><img src={videoThumb(v.videoId, 'high')} style={{ height: '140px', width: '186px', marginTop: '1em' }} /></VideoA>
        {v.durationSecs && <div className='duration'>{hoursFormat(v.durationSecs / 60 / 60)}</div>}
        {isVideoViews(v) && v.rank && <div className='rank'>{v.rank}</div>}
      </div>}
      <FlexCol style={{ color: 'var(--fg1)', maxWidth: '27em' }} space='0.2em'>
        <VideoA id={v.videoId}><h4 style={{ color: 'var(--fg)' }}>
          {highlightWords ? <Highlighter
            searchWords={highlightWords}
            autoEscape
            caseSensitive={false}
            textToHighlight={v.videoTitle ?? ""}
          /> : v.videoTitle}
        </h4></VideoA>
        <FlexRow style={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
          {fPeriodViews && <div><BMetric>{fPeriodViews}</BMetric>
            {fPeriodViews != fViews && <span style={{ fontSize: '1em' }}> / {numFormat(v.videoViews)}</span>}
            &nbsp;views
          </div>}
          {!fPeriodViews && fViews && <div><BMetric>{fViews}</BMetric> views</div>}
          {v.uploadDate && <span>{dateFormat(v.uploadDate, 'UTC')}</span>}
          {isVideoError(v) && <>
            <Tag label={v.copyrightHolder ? `Copyright: ${v.copyrightHolder}` : errorTypeOpt?.label ?? v.errorType} color={errorTypeOpt?.color} />
            <span><b>{numFormat(v.videoViews)} views</b></span>
            <span>Last seen {dateFormat(v.lastSeen, 'UTC')}</span>
          </>}
        </FlexRow>
        {isVideoViews(v) && <span><b>{hoursFormat(v.watchHours)}</b> watched</span>}
        {isVideoNarrative(v) && <FlexRow>
          {v.support && <Tag label={supportOpt?.label ?? v.support} color={supportOpt?.color} />}
          {v.supplement && <Tag label={supplementOpt?.label ?? v.supplement} color={supplementOpt?.color} />}
        </FlexRow>}
        {(captions || showLoadCaptions) &&
          <div style={{ overflowY: 'auto', maxHeight: loadCaptions ? '60vh' : '15em' }}>{captions?.map((s, i) => <div key={i} style={{ marginBottom: '0.3em' }}>
            <VideoA id={v.videoId} style={{ paddingRight: '0.5em' }} offset={s.offsetSeconds}>{secondsFormat(s.offsetSeconds, 2)}</VideoA>{s.caption}</div>)}
            {showLoadCaptions && <a onClick={_ => loadCaptions(v.videoId)?.then(caps => setLoadedCaps(caps))}>show captions</a>}
          </div>
        }
        {showChannel && <VideoChannel c={c} v={v} onOpenChannel={onOpenChannel} highlightWords={highlightWords} showTags={!isVideoError(v)} useTip={useTip} />}
        {children}
      </FlexCol>
    </FlexRow>
  </VideoStyle>
}

interface VideoChannelProps {
  c: Channel
  v: VideoCommon,
  onOpenChannel?: (c: Channel) => void
  highlightWords?: string[]
  showTags?: boolean
  useTip?: UseTip<Channel>
}
const VideoChannel = ({ c, v, onOpenChannel, highlightWords, showTags, useTip }: VideoChannelProps) => {
  c ??= { channelId: v.channelId, channelTitle: v.channelTitle, logoUrl: v.channelLogo }
  //if (!c) return v?.channelTitle ? <a href={channelUrl(v.channelId)} target='yt'><h3>{v.channelTitle}</h3></a> : <></>
  return <div style={{ color: 'var(--fg2)', marginTop: '8px' }}>
    <ChannelTitle c={c as ChannelWithStats} logoStyle={{ height: '60px' }} titleStyle={{ fontSize: '1em' }}
      onLogoClick={onOpenChannel} highlightWords={highlightWords} showTags={showTags} useTip={useTip} />
  </div>
}

export const VideoA = ({ id, children, offset, style }: PropsWithChildren<{ id: string, offset?: number } & StyleProps>) =>
  <a href={videoUrl(id, offset)} target="tt_video" style={style}>{children}</a>