import React, { useState, FunctionComponent, PropsWithChildren } from 'react'
import { dateFormat, hoursFormat, numFormat, secondsFormat } from '../common/Utils'
import { videoThumb, videoUrl } from '../common/Video'
import { Spinner } from './Spinner'
import { FlexCol, FlexRow, loadingFilter, StyleProps } from './Layout'
import { ChannelDetails, ChannelTitle, Tag } from './Channel'
import styled from 'styled-components'
import { Tip } from './Tooltip'
import { ChannelWithStats, VideoViews, VideoCommon, VideoRemoved, isVideoViews, isVideoRemoved } from '../common/RecfluenceApi'
import { Channel, channelUrl, md } from '../common/Channel'
import { groupBy, indexBy, pipe } from 'remeda'
import { entries, minBy, orderBy, sumBy } from '../common/Pipe'
import ContainerDimensions from 'react-container-dimensions'
import { colMd } from '../common/Metadata'
import Highlighter from "react-highlight-words"
import { isVideoNarrative, VideoNarrative } from '../pages/narratives'

const tipId = 'video-tip'

interface VideosProps {
  channels?: Record<string, Channel>
  videos?: VideoCommon[]
  onOpenChannel?: (c: ChannelWithStats) => void
  showChannels?: boolean
  loading?: boolean
  showThumb?: boolean
  groupChannels?: boolean
  showTags?: boolean
  defaultLimit?: number
  highlightWords?: string[]
}

const chanVidChunk = 3
const videoWidth = 400

export const Videos = ({ onOpenChannel, videos, showChannels, channels, loading, showThumb, groupChannels, showTags, defaultLimit, highlightWords }: VideosProps) => {
  const [limit, setLimit] = useState(defaultLimit ?? 20)
  const [showAlls, setShowAlls] = useState<Record<string, boolean>>()

  if (!videos) return <Spinner />

  const groupedVids = groupChannels && pipe(
    entries(groupBy(videos, v => v.channelId)).map(e => ({ channelId: e[0], vids: e[1] })),
    orderBy(g => sumBy(g.vids, v => v.videoViews), 'desc')
  )

  return <div>
    <div style={{
      minHeight: '300px',
      filter: loading ? loadingFilter : null,
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      width: '100%'
    }}>
      {videos?.length == 0 && <p style={{ margin: '3em 0', textAlign: 'center', color: 'var(--fg3)' }}>No videos</p>}
      {groupedVids &&
        <ContainerDimensions >
          {({ width }) => {
            const numCols = Math.max(Math.floor(width / videoWidth), 1)
            // flex doesn't do a column wrap. Se we do this ourselves
            var colGroups: {
              channelId: string,
              channel: Channel,
              vidsToShow: VideoCommon[],
              showAll: boolean,
              showLess: boolean,
              totalVids: number,
              showChannel: boolean
            }[][] =
              [...Array(numCols)].map(_ => [...new Array(0)])

            const addVids = (channelId: string, vids: VideoCommon[], showChannel: boolean = true) => {
              const channel = channels[channelId]
              const showAll = showAlls?.[channelId] ?? false
              const showLess = vids.length > chanVidChunk
              const vidsToShow = showAll ? vids : vids.slice(0, chanVidChunk)
              const colG = minBy(colGroups, cg => sumBy(cg, g => g.vidsToShow.length))
              colG.push({ channelId: channelId, channel, vidsToShow, showAll, showLess, totalVids: vids.length, showChannel })
            }

            if (groupedVids.length == 1) { // just one channel so lets show all its videos in colulumns
              const g = groupedVids[0]
              g.vids.forEach((v, i) => addVids(g.channelId, [v], i == 0))
            }
            else groupedVids.slice(0, limit).forEach(g => addVids(g.channelId, g.vids))


            return <FlexRow>
              {colGroups.map((colGroup, i) => <FlexCol key={i}>{colGroup.map(g => {
                const { vidsToShow, channelId, channel, showAll, showLess, totalVids, showChannel } = g
                return vidsToShow.map((v, i) => <div key={`${channelId}|${i}`}>
                  {i == 0 && showChannel && <VideoChannel
                    c={channel}
                    onOpenChannel={onOpenChannel}
                    v={v}
                    highlightWords={highlightWords}
                    showTags={showTags} />}
                  <Video
                    key={v.videoId}
                    onOpenChannel={onOpenChannel}
                    showThumb={showThumb}
                    v={v}
                    style={{ width: (videoWidth) }}
                    highlightWords={highlightWords}
                  />
                  {i == vidsToShow.length - 1 && (showLess || showAll) &&
                    <a onClick={_ => setShowAlls({ ...showAlls, [channelId]: !showAll })}>
                      {showAll ? `show less videos` : `show all ${totalVids} videos`}
                    </a>}
                </div>)
              })}
              </FlexCol>
              )}
            </FlexRow>
          }}
        </ContainerDimensions>
      }
      {!groupedVids && videos && videos.slice(0, limit).map(v => <Video
        key={v.videoId}
        onOpenChannel={onOpenChannel}
        showThumb={showThumb}
        showChannel
        v={v}
        style={{ width: '45em', maxWidth: '100%' }}
        c={showChannels && channels && channels[v.channelId]} />)}
    </div>
    <div style={{ textAlign: 'center', padding: '1em', fontWeight: 'bold', visibility: videos?.length > limit ? null : 'hidden' }}>
      <a onClick={_ => setLimit(limit + 40)}>show more</a>
    </div>
    {showChannels && <Tip id={tipId} getContent={(id) => {
      if (!id || !channels[id]) return <></>
      return <ChannelDetails channel={channels[id] as ChannelWithStats} mode='min' />
    }} />}
  </div>
}

const VideoStyle = styled.div`
  display:flex;
  margin:0 10px 15px;
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

interface VideoProps extends StyleProps {
  v: VideoRemoved | VideoViews | VideoCommon | VideoNarrative,
  c?: Channel,
  onOpenChannel?: (c: Channel) => void,
  showThumb?: boolean
  showChannel?: boolean
  highlightWords?: string[]
}

const errorTypeMd = indexBy(colMd(md, 'errorType', 'video').values, c => c.value)
const vidCaptionChunk = 3

export const Video = ({ v, style, c, onOpenChannel, showChannel, showThumb, highlightWords }: VideoProps) => {

  const [showAllCaps, setShowAllCaps] = useState(false)

  const fPeriodViews = isVideoViews(v) ? numFormat(v.periodViews) : null
  const fViews = numFormat(v.videoViews)
  const errorTypeOpt = isVideoRemoved(v) ? errorTypeMd[v.errorType] : null

  const captions = isVideoNarrative(v) ?
    showAllCaps ? v.captions : v.captions.slice(0, vidCaptionChunk)
    : null

  const showAllCapsAction: boolean | null = !isVideoNarrative(v) || captions == null
    ? null
    : v.captions.length <= vidCaptionChunk ? null : !showAllCaps

  return <VideoStyle style={style}>
    <FlexRow>
      <FlexRow style={{ flexWrap: 'wrap' }}>
        {showThumb && <div style={{ position: 'relative' }}>
          <VideoA id={v.videoId}><img src={videoThumb(v.videoId, 'high')} style={{ height: '140px', width: '186px', marginTop: '1em' }} /></VideoA>
          {v.durationSecs && <div className='duration'>{hoursFormat(v.durationSecs / 60 / 60)}</div>}
          {isVideoViews(v) && v.rank && <div className='rank'>{v.rank}</div>}
        </div>}
        <FlexCol style={{ color: 'var(--fg1)', maxWidth: '31em' }} space='0.2em'>
          <VideoA id={v.videoId}><h4 style={{ color: 'var(--fg)' }}>
            {highlightWords ? <Highlighter
              searchWords={highlightWords}
              autoEscape
              caseSensitive={false}
              textToHighlight={v.videoTitle ?? ""}
            /> : v.videoTitle}
          </h4></VideoA>
          <FlexRow space='0.7em' style={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
            {fPeriodViews && <div><BMetric>{fPeriodViews}</BMetric>
              {fPeriodViews != fViews && <span style={{ fontSize: '1em' }}> / {numFormat(v.videoViews)}</span>}
              &nbsp;views
            </div>}
            {!fPeriodViews && <div><BMetric>{fViews}</BMetric> views</div>}
            {v.uploadDate && <span>{dateFormat(v.uploadDate, 'UTC')}</span>}
            {isVideoRemoved(v) && <>
              <Tag label={v.copyrightHolder ? `Copyright: ${v.copyrightHolder}` : errorTypeOpt?.label ?? v.errorType} color={errorTypeOpt?.color} />
              <span><b>{numFormat(v.videoViews)} views</b></span>
              <span>Last seen {dateFormat(v.lastSeen, 'UTC')}</span>
            </>}
          </FlexRow>
          {isVideoViews(v) && <span><b>{hoursFormat(v.watchHours)}</b> watched</span>}
          {isVideoNarrative(v) && captions && <>
            <div>{captions.map((s, i) => <div key={i} style={{ marginBottom: '0.3em' }}>
              <VideoA id={v.videoId} style={{ paddingRight: '0.5em' }} offset={s.offset}>{secondsFormat(s.offset, 2)}</VideoA>{s.caption}</div>)}
              {showAllCapsAction != null && <a onClick={_ => setShowAllCaps(showAllCapsAction)}>
                {showAllCapsAction ? `show all ${v.captions.length} captions` : `show less captions`}
              </a>}
            </div>
          </>}
          {showChannel && <VideoChannel c={c} v={v} onOpenChannel={onOpenChannel} highlightWords={highlightWords} showTags={!isVideoRemoved(v)} />}
        </FlexCol>
      </FlexRow>
    </FlexRow>
  </VideoStyle>
}


interface VideoChannelProps {
  c: Channel
  v: VideoCommon,
  onOpenChannel?: (c: Channel) => void
  highlightWords?: string[]
  showTags?: boolean
}
const VideoChannel = ({ c, v, onOpenChannel, highlightWords, showTags }: VideoChannelProps) => {
  if (!c) return v?.channelTitle ? <a href={channelUrl(v.channelId)} target='yt'><h3>{v.channelTitle}</h3></a> : <></>
  return <div style={{ color: 'var(--fg2)', marginTop: '8px' }}>
    <ChannelTitle c={c as ChannelWithStats} logoStyle={{ height: '60px' }} titleStyle={{ fontSize: '1em' }}
      tipId={tipId} onLogoClick={onOpenChannel} highlightWords={highlightWords} showTags={showTags} />
  </div>
}

const VideoA = ({ id, children, offset, style }: PropsWithChildren<{ id: string, offset?: number } & StyleProps>) =>
  <a href={videoUrl(id, offset)} target="tt_video" style={style}>{children}</a>