import { subDays } from 'date-fns'
import React, { useState, useEffect, FunctionComponent } from 'react'
import { ChannelStats, ChannelMeasures } from '../common/Channel'
import { dateFormat, numFormat, preloadImages } from '../common/Utils'
import { videoThumb, videoUrl } from '../common/Video'
import { EsVideo, getChannelVideos } from '../common/YtApi'
import { InlineSelect, Option } from './InlineSelect'
import { Spinner } from './Spinner'
import { FlexCol, FlexRow, StyleProps } from './Layout'
import { ChannelTitle } from './Channel'
import styled from 'styled-components'

const periodOptions: (Option<string> & { from?: Date })[] = [
  { value: 'all', label: 'of all Time', from: null },
  { value: 'views7', label: 'uploaded within 7 days', from: subDays(Date.now(), 7) },
  { value: 'views30', label: 'uploaded within 30 days', from: subDays(Date.now(), 30) },
  { value: 'views365', label: 'uploaded within 365 days', from: subDays(Date.now(), 365) },
]

export const Videos = ({ channel, channels }: { channel?: ChannelStats, channels?: Record<string, ChannelStats> }) => {
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
      await preloadImages(videos.map(v => videoThumb(v.videoId)))
      setLoading(false)
      setVideos(videos)
    }
    go()
  }, [channel, period, limit])

  return <>
    <h3 style={{ padding: '1em 0' }}>
      Top videos {!channel && 'across all channels'} <InlineSelect value={period} options={periodOptions} onChange={v => setPeriod(v)} />
    </h3>
    <div style={{
      overflowY: 'scroll',
      minHeight: '300px',
      filter: loading ? 'blur(3px)' : null,
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap'
    }}>
      {videos?.length == 0 && <p style={{ margin: '3em 0', textAlign: 'center', color: 'var(--fg3)' }}>No videos</p>}
      {videos && videos.map((v, i) => <Video key={v.videoId}
        v={v} rank={i + 1}
        style={{ width: '700px', maxWidth: '90vw' }}
        c={!channel && channels && channels[v.channelId]} />)}

      {loading && <Spinner size='2em' style={{ position: 'absolute' }} />}
    </div>
    {videos && <div><a onClick={_ => setLimit(limit + 20)}>show more</a></div>}
  </>
}

const VideoStyle = styled.div`
  display:'flex';
`

const Video = ({ v, rank, style, c }: { v: EsVideo, rank: number, c?: ChannelStats } & StyleProps) => <VideoStyle
  style={{ margin: '0 10px 15px', ...style }}>
  <FlexRow >
    <div style={{
      fontSize: '1.5em', color: 'var(--fg3)', fontWeight: 'bolder', textAlign: 'right', lineHeight: '70px', minWidth: rank < 100 ? '30px' : null
    }}>{rank}</div>
    <VideoA id={v.videoId}><img src={videoThumb(v.videoId)} style={{ height: '120px' }} /></VideoA>
    <div style={{ maxWidth: '40em' }} >
      <VideoA id={v.videoId}><h4 style={{ color: 'var(--fg)' }}>{v.videoTitle}</h4></VideoA>
      <FlexRow space='2em'>
        <span><b>{numFormat(v.views)}</b> views</span>
        <span>{dateFormat(v.uploadDate)}</span>
      </FlexRow>
      {c && <div style={{ color: 'var(--fg2)', marginTop: '8px' }}>
        <ChannelTitle c={c} logoStyle={{ height: '50px' }} titleStyle={{ fontSize: '1em' }} />
      </div>}
    </div>
  </FlexRow>
</VideoStyle>

const VideoA: FunctionComponent<{ id: string }> = ({ id, children }) => <a href={videoUrl(id)} target="tt_video">{children}</a>