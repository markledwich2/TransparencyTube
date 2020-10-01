import React, { useState, useEffect, FunctionComponent, useContext } from 'react'
import { dateFormat, hoursFormat, numFormat } from '../common/Utils'
import { periodLabel, videoThumb, videoUrl } from '../common/Video'
import { InlineSelect } from './InlineSelect'
import { Spinner } from './Spinner'
import { FlexCol, FlexRow, StyleProps } from './Layout'
import { ChannelInfo, ChannelTitle } from './Channel'
import styled from 'styled-components'
import { Tip } from './Tooltip'
import ReactTooltip from 'react-tooltip'
import { ChannelWithStats, getVideoViews, StatsPeriod, VideoWithStats, ViewsIndexes } from '../common/RecfluenceApi'
import { first, map, pipe } from 'remeda'
import { sortBy } from '../common/Pipe'
import { Channel, periodOptions } from '../common/Channel'

const tipId = 'video-tip'

interface VideosProps {
  channel?: ChannelWithStats,
  channels?: Record<string, Channel>,
  onOpenChannel?: (c: ChannelWithStats) => void,
  indexes?: ViewsIndexes
}
export const Videos = ({ channel, channels, onOpenChannel, indexes }: VideosProps) => {
  const [period, setPeriod] = useState<StatsPeriod>(null)
  const [videos, setVideos] = useState<VideoWithStats[]>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [limit, setLimit] = useState<number>(20)

  const index = channel ? indexes?.channelVideo : indexes?.video

  useEffect(() => {
    const go = async () => {
      if (!index) return
      if (!period)
        setPeriod(first(indexes.periods))
      setLoading(true)
      if (period) {
        const filter = channel ? { channelId: channel.channelId, ...period } : period
        const videoViews = await getVideoViews(index, filter,
          ['videoId', 'videoTitle', 'channelId', 'channelTitle', 'uploadDate', 'views'], limit)
        setVideos(videoViews)
      }
      setLoading(false)
      ReactTooltip.rebuild()
    }
    go()
  }, [channel, period, limit, index])


  return <>
    <h3 style={{ padding: '1em 0' }}>
      Top videos by views {!channel && 'across all channels'}
      <InlineSelect value={period} options={periodOptions(indexes.periods)} onChange={v => setPeriod(v)} />
    </h3>
    {loading && videos == null && <Spinner />}
    <div style={{
      minHeight: '300px',
      filter: loading ? 'blur(2px)' : null,
      display: 'flex',
      flexDirection: channel ? 'column' : 'row',
      flexWrap: channel ? null : 'wrap',
      alignItems: 'center'
    }}>
      {videos?.length == 0 && <p style={{ margin: '3em 0', textAlign: 'center', color: 'var(--fg3)' }}>No videos</p>}
      {videos && videos.map((v, i) => <Video key={v.videoId} onOpenChannel={onOpenChannel}
        v={v} rank={i + 1}
        style={{ maxWidth: '100%' }}
        c={!channel && channels && channels[v.channelId]} />)}
    </div>
    {!loading && videos && videos.length >= limit && <div style={{ textAlign: 'center', padding: '1em', fontWeight: 'bold' }}>
      <a onClick={_ => setLimit(limit + 20)}>show more</a>
    </div>}
    {channels && <Tip id={tipId} getContent={(id) => <ChannelInfo channel={channels[id] as ChannelWithStats} size='min' indexes={indexes} />} />}
  </>
}

const VideoStyle = styled.div`
  display:flex;
  margin:0 10px 15px;
  flex-direction:row;
  .rank {
    font-size:1.2em;
    left:0px;
    top:0px;
    padding-top:2px;
    width:1.7em;
    height:1.7em;
    position:absolute;
    font-weight:bolder;
    background-color: #ddd;
    color:#000;
    text-align:center;
    border-radius: 50%;
    box-shadow: 0px 1px 6px 2px #444;
  }
  .duration {
    right:0px;
    bottom:0px;
    position:absolute;
    font-weight:bold;
    background-color: rgba(0,0,0,0.7);
    color:var(--fg1);
  }
`

interface VideoProps extends StyleProps {
  v: VideoWithStats,
  rank: number,
  c?: Channel,
  onOpenChannel?: (c: Channel) => void,
  //onHover?: (hover: VideoHover) => void
}

const Video = ({ v, rank, style, c, onOpenChannel }: VideoProps) => {
  const fPeriodViews = numFormat(v.periodViews)
  const fViews = numFormat(v.views)

  return <VideoStyle style={style}>
    <FlexRow>
      <FlexRow style={{ flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <VideoA id={v.videoId}><img src={videoThumb(v.videoId, 'high')} style={{ height: '140px' }} /></VideoA>
          <div className='rank'>{rank}</div>
          {v.duration_secs && <div className='duration'>{hoursFormat(v.duration_secs * 60)}</div>}
        </div>
        <FlexCol style={{ width: '28em', color: 'var(--fg1)' }} space='0.2em'>
          <VideoA id={v.videoId}><h4 style={{ color: 'var(--fg)' }}>{v.videoTitle}</h4></VideoA>
          <FlexRow space='0.7em' style={{ alignItems: 'baseline' }}>
            <div>
              <span><b style={{ fontSize: '1.3em' }}>{fPeriodViews}</b></span>
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