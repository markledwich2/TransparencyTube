import React, { useState, FunctionComponent } from 'react'
import { dateFormat, hoursFormat, numFormat } from '../common/Utils'
import { videoThumb, videoUrl } from '../common/Video'
import { Spinner } from './Spinner'
import { FlexCol, FlexRow, loadingFilter, StyleProps } from './Layout'
import { ChannelDetails, ChannelTitle, Tag } from './Channel'
import styled from 'styled-components'
import { Tip } from './Tooltip'
import { ChannelWithStats, VideoViews, VideoCommon, VideoRemoved, isVideoViews, isVideoRemoved } from '../common/RecfluenceApi'
import { Channel } from '../common/Channel'
import { chunk, groupBy } from 'remeda'
import { entries, orderBy } from '../common/Pipe'

const tipId = 'video-tip'

interface VideosProps {
  channels?: Record<string, Channel>
  videos?: VideoCommon[]
  onOpenChannel?: (c: ChannelWithStats) => void
  showChannels?: boolean
  loading?: boolean
  showThumb?: boolean
  groupChannels?: boolean
  defaultLimit?: number
}

const chanVidChunk = 3

export const Videos = ({ onOpenChannel, videos, showChannels, channels, loading, showThumb, groupChannels, defaultLimit }: VideosProps) => {
  const [limit, setLimit] = useState(defaultLimit ?? 20)
  const [showAlls, setShowAlls] = useState<Record<string, boolean>>()

  if (!videos || !channels) return <Spinner />

  const groupedVids = groupChannels ? entries(groupBy(videos, v => v.channelId)).map(e => ({ channelId: e[0], vids: e[1] })) : null

  return <div>
    <div style={{
      minHeight: '300px',
      filter: loading ? loadingFilter : null,
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap'
    }}>
      {videos?.length == 0 && <p style={{ margin: '3em 0', textAlign: 'center', color: 'var(--fg3)' }}>No videos</p>}
      {groupedVids && groupedVids.slice(0, limit).map((g) => {
        const c = channels[g.channelId]
        const showAll = showAlls?.[g.channelId] ?? false
        const vidsToShow = showAll ? chunk(g.vids, chanVidChunk) : [g.vids.slice(0, chanVidChunk)]
        return vidsToShow.map((vids, i) => <div key={`${g.channelId}|${i}`}>
          {i == 0 && <VideoChannel c={c} onOpenChannel={onOpenChannel} />}
          {vids.map((v, i) => <Video key={v.videoId} onOpenChannel={onOpenChannel} showThumb={showThumb} v={v} />)}
          {i == vidsToShow.length - 1 && g.vids.length > chanVidChunk && <a onClick={_ => setShowAlls({ ...showAlls, [c.channelId]: !showAll })}>
            {showAll ? `show less` : `show all ${g.vids.length}`}
          </a>}
        </div>)
      })}
      {!groupedVids && videos && videos.slice(0, limit).map(v => <Video key={v.videoId} onOpenChannel={onOpenChannel} showThumb={showThumb}
        v={v}
        style={{ maxWidth: '100%' }}
        c={showChannels && channels && channels[v.channelId]} />)}
    </div>
    <div style={{ textAlign: 'center', padding: '1em', fontWeight: 'bold', visibility: videos?.length > limit ? null : 'hidden' }}>
      <a onClick={_ => setLimit(limit + 20)}>show more</a>
    </div>
    {showChannels && <Tip id={tipId} getContent={(id) => {
      if (!id || !channels[id]) return <></>
      return <ChannelTitle c={channels[id] as ChannelWithStats} />
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

interface VideoProps extends StyleProps {
  v: VideoRemoved | VideoViews | VideoCommon,
  c?: Channel,
  onOpenChannel?: (c: Channel) => void,
  showThumb?: boolean
}

export const Video = ({ v, style, c, onOpenChannel, showThumb }: VideoProps) => {
  const fPeriodViews = isVideoViews(v) ? numFormat(v.periodViews) : null
  const fViews = numFormat(v.videoViews)

  return <VideoStyle style={style}>
    <FlexRow>
      <FlexRow style={{ flexWrap: 'wrap' }}>
        {showThumb && <div style={{ position: 'relative' }}>
          <VideoA id={v.videoId}><img src={videoThumb(v.videoId, 'high')} style={{ height: '140px', width: '186px', marginTop: '1em' }} /></VideoA>
          {v.durationSecs && <div className='duration'>{hoursFormat(v.durationSecs / 60 / 60)}</div>}
          {isVideoViews(v) && <div className='rank'>{v.rank}</div>}
        </div>}
        <FlexCol style={{ width: '28em', color: 'var(--fg1)' }} space='0.2em'>
          <VideoA id={v.videoId}><h4 style={{ color: 'var(--fg)' }}>{v.videoTitle}</h4></VideoA>
          <FlexRow space='0.7em' style={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
            {fPeriodViews && <div><span><b style={{ fontSize: '1.3em', color: 'var(--fg)' }}>{fPeriodViews}</b></span>
              {fPeriodViews != fViews && <span style={{ fontSize: '1em' }}> / {numFormat(v.videoViews)}</span>}
              &nbsp;views
            </div>}
            {v.uploadDate && <span>{dateFormat(v.uploadDate, 'UTC')}</span>}
            {isVideoRemoved(v) && <>
              <Tag label={v.copyrightHolder ? `Copyright: ${v.copyrightHolder}` : v.errorType} />
              <span><b>{numFormat(v.videoViews)} views</b></span>
              <span>Last seen {dateFormat(v.lastSeen, 'UTC')}</span>
            </>}
          </FlexRow>
          {isVideoViews(v) && <span><b>{hoursFormat(v.watchHours)}</b> watched</span>}

          <VideoChannel c={c} onOpenChannel={onOpenChannel} />
        </FlexCol>
      </FlexRow>
    </FlexRow>
  </VideoStyle>
}

const VideoChannel = ({ c, onOpenChannel }: { c: Channel, onOpenChannel?: (c: Channel) => void }) => {
  if (!c) return <></>
  return <div style={{ color: 'var(--fg2)', marginTop: '8px' }}>
    <ChannelTitle c={c as ChannelWithStats} logoStyle={{ height: '50px' }} titleStyle={{ fontSize: '1em' }}
      tipId={tipId} onLogoClick={onOpenChannel} showLr />
  </div>
}

const VideoA: FunctionComponent<{ id: string }> = ({ id, children }) => <a href={videoUrl(id)} target="tt_video">{children}</a>