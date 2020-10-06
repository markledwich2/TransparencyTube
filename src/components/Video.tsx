import React, { useState, useEffect, FunctionComponent } from 'react'
import { dateFormat, hoursFormat, numFormat } from '../common/Utils'
import { videoThumb, videoUrl } from '../common/Video'
import { Spinner } from './Spinner'
import { FlexCol, FlexRow, loadingFilter, StyleProps } from './Layout'
import { ChannelDetails, ChannelTitle } from './Channel'
import styled from 'styled-components'
import { Tip } from './Tooltip'
import ReactTooltip from 'react-tooltip'
import { ChannelStats, ChannelWithStats, getChannelStats, getVideoViews, VideoWithStats, ViewsIndexes } from '../common/RecfluenceApi'
import { Channel } from '../common/Channel'
import { StatsPeriod } from './Period'
import { VideoFilter, videoFilterIncludes } from './VideoFilter'

const tipId = 'video-tip'

interface VideosProps {
  channel?: Channel,
  channels?: Record<string, Channel>,
  onOpenChannel?: (c: ChannelWithStats) => void,
  indexes?: ViewsIndexes
  period: StatsPeriod
  videoFilter?: VideoFilter
}

export const Videos = ({ channel, channels, onOpenChannel, indexes, period, videoFilter }: VideosProps) => {

  const [videos, setVideos] = useState<VideoWithStats[]>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [limit, setLimit] = useState<number>(20)


  const index = channel ? indexes?.channelVideo : indexes?.video

  useEffect(() => {
    if (!index) return
    if (period) {
      setLoading(true)
      const periodFilter = channel ? { channelId: channel.channelId, ...period } : period
      getVideoViews(index, periodFilter, videoFilter, channels,
        ['videoId', 'videoTitle', 'channelId', 'channelTitle', 'uploadDate', 'views', 'durationSecs'], limit)
        .then(vids => {
          setVideos(vids)
          setLoading(false)
          ReactTooltip.rebuild()
        })
    }
  }, [channel, period, videoFilter, index, limit])

  const showMore = !loading && videos && videos.length >= limit

  return <div>
    {loading && videos == null && <Spinner />}
    <div style={{
      minHeight: '300px',
      filter: loading ? loadingFilter : null,
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center'
    }}>
      {videos?.length == 0 && <p style={{ margin: '3em 0', textAlign: 'center', color: 'var(--fg3)' }}>No videos</p>}
      {videos && videos.map((v, i) => <Video key={v.videoId} onOpenChannel={onOpenChannel}
        v={v}
        style={{ maxWidth: '100%' }}
        c={!channel && channels && channels[v.channelId]} />)}
    </div>
    <div style={{ textAlign: 'center', padding: '1em', fontWeight: 'bold', visibility: showMore ? null : 'hidden' }}>
      <a onClick={_ => setLimit(limit + 20)}>show more</a>
    </div>
    {channels && <Tip id={tipId} getContent={(id) => <ChannelDetails
      channel={channels[id] as ChannelWithStats}
      size='min'
      indexes={indexes}
      defaultPeriod={period}
    />} />}
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
    padding-top:0.3em;
    width:2em;
    height:2em;
    position:absolute;
    font-weight:bolder;
    background-color: #ddd;
    color:#333;
    text-align:center;
    border-radius: 50%;
    box-shadow: 0px 1px 6px 2px #444;
  }
  .duration {
    position:absolute;
    text-align:left;
    padding:0.1em 0.3em 0.2em 1.5em;
    background-color: rgba(0,0,0,0.5);
    color:#ddd;
    border-radius: 1em;
    font-weight:bold;
    
    left:1em;
    top:0.15em;
  }
`

interface VideoProps extends StyleProps {
  v: VideoWithStats,
  c?: Channel,
  onOpenChannel?: (c: Channel) => void,
  //onHover?: (hover: VideoHover) => void
}

export const Video = ({ v, style, c, onOpenChannel }: VideoProps) => {
  const fPeriodViews = numFormat(v.periodViews)
  const fViews = numFormat(v.views)

  return <VideoStyle style={style}>
    <FlexRow>
      <FlexRow style={{ flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <VideoA id={v.videoId}><img src={videoThumb(v.videoId, 'high')} style={{ height: '140px', width: '186px', marginTop: '1em' }} /></VideoA>
          {v.durationSecs && <div className='duration'>{hoursFormat(v.durationSecs / 60 / 60)}</div>}
          <div className='rank'>{v.rank}</div>
        </div>
        <FlexCol style={{ width: '28em', color: 'var(--fg1)' }} space='0.2em'>
          <VideoA id={v.videoId}><h4 style={{ color: 'var(--fg)' }}>{v.videoTitle}</h4></VideoA>
          <FlexRow space='0.7em' style={{ alignItems: 'baseline' }}>
            <div>
              <span><b style={{ fontSize: '1.3em', color: 'var(--fg)' }}>{fPeriodViews}</b></span>
              {fPeriodViews != fViews && <span style={{ fontSize: '1em' }}> / {numFormat(v.views)}</span>}
              &nbsp;views
            </div>
            <span>{dateFormat(v.uploadDate)}</span>
          </FlexRow>
          <span><b>{hoursFormat(v.watchHours)}</b> watched</span>
          {c && <div style={{ color: 'var(--fg2)', marginTop: '8px' }}>
            <ChannelTitle c={c as ChannelWithStats} logoStyle={{ height: '50px' }} titleStyle={{ fontSize: '1em' }}
              tipId={tipId} onLogoClick={onOpenChannel} showLr />
          </div>}
        </FlexCol>
      </FlexRow>
    </FlexRow>
  </VideoStyle>
}

const VideoA: FunctionComponent<{ id: string }> = ({ id, children }) => <a href={videoUrl(id)} target="tt_video">{children}</a>