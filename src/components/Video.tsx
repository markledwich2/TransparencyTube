import { subDays } from 'date-fns'
import React, { useState, useEffect, FunctionComponent } from 'react'
import { ChannelStats, ChannelMeasures } from '../common/Channel'
import { dateFormat, numFormat, preloadImages } from '../common/Utils'
import { videoThumb, videoUrl } from '../common/Video'
import { EsVideo, getChannelVideos } from '../common/YtApi'
import { InlineSelect, Option } from './InlineSelect'
import { Spinner } from './Spinner'
import { FlexRow, StyleProps } from './layout'

const periodOptions: (Option<string> & { from?: Date })[] = [
  { value: 'all', label: 'of all Time', from: null },
  { value: 'views7', label: 'uploaded within 7 days', from: subDays(Date.now(), 7) },
  { value: 'views30', label: 'uploaded within 30 days', from: subDays(Date.now(), 30) },
  { value: 'views365', label: 'uploaded within 365 days', from: subDays(Date.now(), 365) },
]

export const Videos = ({ channel }: { channel: ChannelStats }) => {
  const [period, setPeriod] = useState<keyof ChannelMeasures | string>('views7')
  const [videos, setVideos] = useState<EsVideo[]>()

  useEffect(() => {
    const go = async () => {
      setVideos(null)
      const from = periodOptions.find(v => v.value == period)?.from
      const videos = await getChannelVideos(channel.channelId, from, ['videoId', 'videoTitle', 'uploadDate', 'views'], 10)
      await preloadImages(videos.map(v => videoThumb(v.videoId)))
      setVideos(videos)
    }
    go()
  }, [channel, period])

  return <>
    <div style={{ padding: '1em 0' }}>
      Top videos <InlineSelect value={period} options={periodOptions} onChange={v => setPeriod(v)} />
    </div>
    <div style={{ overflowY: 'scroll', minHeight: '300px', width: '100%' }}>
      {videos == null && <Spinner size='2em' />}
      {videos?.length == 0 && <p style={{ margin: '3em 0', textAlign: 'center', color: 'var(--fg3)' }}>No videos</p>}
      {videos && videos.map((v, i) => <Video key={v.videoId} v={v} rank={i + 1} />)}
    </div>
  </>
}

const Video = ({ v, rank }: { v: EsVideo, rank: number }) => <FlexRow style={{ marginBottom: '15px' }}>
  <div style={{
    fontSize: '1.5em', color: 'var(--bg2)', fontWeight: 'bolder',
    width: '1.5em', textAlign: 'right', lineHeight: '70px'
  }}>{rank}</div>
  <VideoA id={v.videoId}><img src={videoThumb(v.videoId)} style={{ height: '70px' }} /></VideoA>
  <div style={{ maxWidth: '40em' }} >
    <VideoA id={v.videoId}><h4>{v.videoTitle}</h4></VideoA>
    <FlexRow space='2em'>
      <span><b>{numFormat(v.views)}</b> views</span>
      <span>{dateFormat(v.uploadDate)}</span>
    </FlexRow>
  </div>
</FlexRow>

const VideoA: FunctionComponent<{ id: string }> = ({ id, children }) => <a href={videoUrl(id)} target="tt_video">{children}</a>