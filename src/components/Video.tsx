import { subDays } from 'date-fns'
import React, { useState, useEffect, FunctionComponent } from 'react'
import { ChannelStats, ChannelMeasures } from '../common/Channel'
import { dateFormat, numFormat, preloadImages } from '../common/Utils'
import { videoThumb, videoUrl } from '../common/Video'
import { EsVideo, getChannelVideos } from '../common/YtApi'
import { InlineSelect, Opt } from './InlineSelect'
import { Spinner } from './Spinner'
import { FlexCol, FlexRow, StyleProps } from './Layout'
import { ChannelInfo, ChannelTitle } from './Channel'
import styled from 'styled-components'
import { Tip } from './Tooltip'
import ReactTooltip from 'react-tooltip'

const periodOptions: (Opt<string> & { from?: Date })[] = [
  { value: 'all', label: 'of all Time', from: null },
  { value: 'views1', label: 'uploaded within 2 days', from: subDays(Date.now(), 2) },
  { value: 'views7', label: 'uploaded within 7 days', from: subDays(Date.now(), 7) },
  { value: 'views30', label: 'uploaded within 30 days', from: subDays(Date.now(), 30) },
  { value: 'views365', label: 'uploaded within 365 days', from: subDays(Date.now(), 365) },
]

const tipId = 'video-tip'

export const Videos = ({ channel, channels, onOpenChannel }: { channel?: ChannelStats, channels?: Record<string, ChannelStats>, onOpenChannel?: (c: ChannelStats) => void }) => {
  const [period, setPeriod] = useState<keyof ChannelMeasures | string>('views7')
  const [videos, setVideos] = useState<EsVideo[]>()
  const [loading, setLoading] = useState<boolean>(false)
  const [limit, setLimit] = useState<number>(20)

  useEffect(() => {
    const go = async () => {
      setLoading(loading)
      const from = periodOptions.find(v => v.value == period)?.from
      const videos = await getChannelVideos(channel?.channelId, from,
        ['videoId', 'videoTitle', 'channelId', 'channelTitle', 'uploadDate', 'views'], limit)
      //await preloadImages(videos.map(v => videoThumb(v.videoId, 'high')))
      setLoading(false)
      setVideos(videos)
      ReactTooltip.rebuild()
    }
    go()
  }, [channel, period, limit])

  return <>
    <h3 style={{ padding: '1em 0' }}>
      Top videos {!channel && 'across all channels'} <InlineSelect value={period} options={periodOptions} onChange={v => setPeriod(v)} />
    </h3>
    <div style={{
      minHeight: '300px',
      filter: loading ? 'blur(3px)' : null,
      display: 'flex',
      flexDirection: channel ? 'column' : 'row',
      flexWrap: channel ? null : 'wrap',
      alignItems: 'center'
    }}>
      {videos?.length == 0 && <p style={{ margin: '3em 0', textAlign: 'center', color: 'var(--fg3)' }}>No videos</p>}
      {videos && videos.map((v, i) => <Video key={v.videoId} onOpenChannel={onOpenChannel}
        v={v} rank={i + 1}
        style={{ width: '700px', maxWidth: '100%' }}
        c={!channel && channels && channels[v.channelId]} />)}
    </div>
    {videos && videos.length >= limit && <div style={{ textAlign: 'center', padding: '1em', fontWeight: 'bold' }}><a onClick={_ => setLimit(limit + 20)}>show more</a></div>}
    {channels && <Tip id={tipId} getContent={(id) => <ChannelInfo channel={channels[id]} size='min' />} />}
  </>
}

const VideoStyle = styled.div`
  display:flex;
  margin:0 10px 15px;
  flex-direction:row;
  .rank {
    font-size:1.5em;
    color:var(--fg3);
    font-weight:bolder;
    text-align: right;
    line-height:70px;
  }
`

interface VideoProps extends StyleProps {
  v: EsVideo, rank: number, c?: ChannelStats, onOpenChannel?: (c: ChannelStats) => void
}

const Video = ({ v, rank, style, c, onOpenChannel }: VideoProps) => <VideoStyle style={style}>
  <FlexRow>
    <div className='rank' style={{ minWidth: rank < 100 ? '30px' : null }}>{rank}</div>
    <FlexRow style={{ flexWrap: 'wrap' }}>
      <VideoA id={v.videoId}><img src={videoThumb(v.videoId, 'high')} style={{ height: '140px' }} /></VideoA>
      <div style={{ maxWidth: '25em' }} >
        <VideoA id={v.videoId}><h4 style={{ color: 'var(--fg)' }}>{v.videoTitle}</h4></VideoA>
        <FlexRow space='2em' style={{ alignItems: 'baseline' }}>
          <span><b style={{ fontSize: '1.3em' }}>{numFormat(v.views)}</b> views</span>
          <span>{dateFormat(v.uploadDate)}</span>
        </FlexRow>
        {c && <div style={{ color: 'var(--fg2)', marginTop: '8px' }}>
          <ChannelTitle c={c} logoStyle={{ height: '50px' }} titleStyle={{ fontSize: '1em' }} tipId={tipId} onLogoClick={onOpenChannel} showLr />
        </div>}
      </div>
    </FlexRow>
  </FlexRow>
</VideoStyle>

const VideoA: FunctionComponent<{ id: string }> = ({ id, children }) => <a href={videoUrl(id)} target="tt_video">{children}</a>