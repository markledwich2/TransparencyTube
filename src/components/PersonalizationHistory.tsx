import React, { FunctionComponent as FC, CSSProperties, useEffect, useState } from 'react'
import { FlexRow } from '../components/Layout'
import { dateFormat } from '../common/Utils'
import { pipe, sortBy } from 'remeda'
import { Channel, md } from '../common/Channel'
import styled from 'styled-components'
import { VideoA, Videos } from '../components/Video'
import { ChannelDetails, ChannelTitle } from '../components/Channel'
import { entries, orderBy } from '../common/Pipe'
import { RotateContent } from '../components/RotateContent'
import { videoThumb } from '../common/Video'
import { Watch, WatchKey } from '../common/Personalization'
import { BlobIndex } from '../common/BlobIndex'
import { AccountTag } from './PersonalizationBar'
import { Tip, UseTip, useTip } from './Tip'

const tagMd = md.channel.tags.val

interface PersonalizationHistoryProps {
  watches: Record<string, Watch[]>
  onShowHistory: (account: string) => void
  channels: Record<string, Channel>
}
export const PersonalizationHistory: FC<PersonalizationHistoryProps> = ({ watches, onShowHistory, channels }) => {
  const tip = useTip<Channel>()
  console.log('PersonalizationHistory tip', { ...tip })
  return <>
    <div style={{ display: 'flex', flexWrap: 'wrap', fontSize: '1rem', justifyContent: 'center' }}>
      {watches && sortBy(entries(watches), ([account, _]) => tagMd[account]?.label).map(([account, ws]) => {
        const size = { w: '300px', h: '320px' }
        return <div key={account} style={{ margin: '1em' }}>
          <FlexRow style={{ marginBottom: '0.6em', alignItems: 'center' }}>
            <AccountTag account={account} />
            <a onClick={() => onShowHistory(account)}>history</a>
          </FlexRow>
          <RotateContent
            data={ws}
            getDelay={() => 4000 + Math.random() * 1000}
            style={{ maxWidth: '100%' }}
            template={(w: Watch) => {
              if (!w)
                return <></>
              const c = channels?.[w.channelId] ?? { channelId: w.channelId, channelTitle: w.channelTitle }
              return <VideoTile w={w} c={c} size={size} useTip={tip} />
            }} />
        </div>
      })}
    </div>
    <Tip {...tip.tipProps} ><ChannelDetails channel={tip.data} mode='min' /></Tip>
  </>
}

const videoOverlayStyle: CSSProperties = {
  fontSize: '0.9em',
  left: '0px',
  top: '0px',
  padding: "0.2em 0.8em 0em",
  minWidth: '2em',
  height: '2em',
  position: 'absolute',
  fontWeight: 'bolder',
  backgroundColor: 'rgba(250, 250, 250, 0.9)',
  color: '#333',
  textAlign: 'center',
  borderRadius: '2em',
  boxShadow: '0px 1px 6px 2px #444'
}

const VideoTileStyle = styled.div`
  position: relative;
  .title {
    position:absolute;
    width:100%;
    top: 195px;
    left: 0px;
    background-color: rgba(0, 0, 0, 0.8);
    height: 45px;
    overflow:hidden;
    font-weight:bold;
  }
  .channel {
    margin-top:15px;
    color: var(--fg2);
  }
`
interface VideoTileProps {
  w: Watch
  size: { w: string, h: string }
  c: Channel
  useTip?: UseTip<Channel>
}

const VideoTile: FC<VideoTileProps> = ({ w, size, c, useTip }) => <VideoTileStyle>
  <VideoA id={w.videoId}><img src={videoThumb(w.videoId, 'high')} style={{ width: size.w }} /></VideoA>
  <div className="title">{w.videoTitle}</div>
  {c && <ChannelTitle className='channel' c={c} titleStyle={{ fontSize: '1rem' }} logoStyle={{ width: '50px' }} useTip={useTip} />}
  <div style={videoOverlayStyle}>watched on {dateFormat(w.updated)}</div>
</VideoTileStyle>

interface AccountVideosProps {
  account: string
  idx: BlobIndex<Watch, WatchKey>
  channels: Record<string, Channel>
}
export const AccountVideos: FC<AccountVideosProps> = ({ account, idx, channels }) => {
  const [watch, setWatch] = useState<Watch[]>(null)

  useEffect(() => {
    if (!account || !idx) {
      setWatch(null)
      return
    }
    idx.rows().then(ws => {
      const accountVids = pipe(ws.filter(w => w.account == account), orderBy(w => w.updated, 'desc'))
      return setWatch(accountVids)
    })
  }, [account, idx])

  return watch && channels && <Videos videos={watch} channels={channels}
    showChannels showThumb showTags
    videoStyle={{ position: 'relative' }}
    contentBelow={v => <span style={videoOverlayStyle}>watched {dateFormat(v.updated)}</span>}
  />
}