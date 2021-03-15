import React, { FunctionComponent as FC, CSSProperties, useEffect, useState } from 'react'
import { FlexRow, StyleProps } from './Style'
import { dateFormat, numFormat } from '../common/Utils'
import { groupBy, pipe, sortBy } from 'remeda'
import { Channel, md } from '../common/Channel'
import styled from 'styled-components'
import { VideoA, Videos } from './Video'
import { ChannelDetails, ChannelTitle, Tag } from './Channel'
import { entries, orderBy } from '../common/Pipe'
import { RotateContent } from './RotateContent'
import { videoThumb } from '../common/Video'
import { Seen as Seen, SeenKey } from '../common/Personalization'
import { blobIndex, BlobIndex } from '../common/BlobIndex'
import { AccountTag } from './PersonaBar'
import { Tip, UseTip, useTip } from './Tip'
import { Popup } from './Popup'
import { UnparsedSyntheticReference } from 'typescript'
import numeral from 'numeral'

const tagMd = md.channel.tags.val

export const PersonaSeen: FC<{
  seen: UseSeen
  showSeen: (account: string) => void
  channels: Record<string, Channel>
  verb: string
} & StyleProps> = ({ seen, showSeen, channels, verb, style }) => {
  const tip = useTip<Channel>()
  const { featuredSeen } = seen
  return <>
    <div style={{ display: 'flex', flexWrap: 'wrap', fontSize: '1rem', justifyContent: 'center', ...style }}>
      {featuredSeen && sortBy(entries(featuredSeen), ([account, _]) => tagMd[account]?.label).map(([account, ws]) => {
        return <div key={account} style={{ margin: '1em' }}>
          <FlexRow style={{ marginBottom: '0.6em', alignItems: 'center' }}>
            <AccountTag account={account} />
            <a onClick={() => showSeen(account)}>show all</a>
          </FlexRow>
          <RotateContent
            data={ws}
            getDelay={() => 4000 + Math.random() * 1000}
            style={{ maxWidth: '100%', width: '300px', height: '400px' }}
            template={(w: Seen) => {
              if (!w)
                return <></>
              const c = channels?.[w.channelId] ?? { channelId: w.channelId, channelTitle: w.channelTitle }
              return <VideoTile s={w} c={c} useTip={tip} verb={verb} />
            }} />
        </div>
      })}
    </div>
    <Tip {...tip.tipProps} ><ChannelDetails channel={tip.data} mode='min' /></Tip>
  </>
}

const VideoTile: FC<{
  s: Seen
  c: Channel
  useTip?: UseTip<Channel>
  verb: string
}> = ({ s, c, useTip, verb }) => <VideoTileStyle data-videoId={s.videoId}>
  <VideoA id={s.videoId}><img src={videoThumb(s.videoId, 'high')} style={{ height: '230px' }} /></VideoA>
  <div className="title">{s.videoTitle}</div>
  {c && <ChannelTitle className='channel' c={c} titleStyle={{ fontSize: '1rem' }} logoStyle={{ height: '50px' }} useTip={useTip} />}
  <SeenVideoExtra s={s} verb={verb} />
</VideoTileStyle>

interface AccountVideosProps {
  account: string
  useSeen: UseSeen
  channels: Record<string, Channel>
}
export const SeenVideos: FC<AccountVideosProps & { verb: string }> = ({ account, useSeen, channels, verb }) => {
  const [seen, setSeen] = useState<Seen[]>(null)

  useEffect(() => {
    if (!account || !useSeen.idx) {
      setSeen(null)
      return
    }
    useSeen.accountSeen(account).then(setSeen)
  }, [account, useSeen])

  return seen && channels && <Videos videos={seen} channels={channels}
    showChannels showThumb showTags
    videoStyle={{ position: 'relative' }}
    contentBelow={s => <SeenVideoExtra s={s} verb={verb} />}
  />
}

const SeenVideoExtra: FC<{ s: Seen, verb: string }> = ({ s, verb }) => <>
  <div style={videoOverlayStyle}>{verb} {s.seenTotal} times</div>
  <div className="detail">seen <Tag>{dateFormat(s.firstSeen)}</Tag> - <Tag>{dateFormat(s.lastSeen)}</Tag></div>
</>

export const PersonaSeenPopup: FC<AccountVideosProps & { verb: string, isOpen: boolean, onClose: () => void }> =
  ({ verb, channels, account, useSeen, isOpen, onClose }) => <Popup isOpen={isOpen} onRequestClose={onClose}>
    {isOpen && <SeenVideos useSeen={useSeen} channels={channels} account={account} verb={verb} />}
  </Popup>

export interface UseSeen {
  idx?: BlobIndex<Seen, SeenKey>
  /** Featured-seen by account */
  featuredSeen?: Record<string, Seen[]>
  accountSeen: (account: string) => Promise<Seen[]>
}

export const useSeen = (name: string): UseSeen => {
  const [seen, setSeen] = useState<Pick<UseSeen, 'idx' | 'featuredSeen'>>({})
  useEffect(() => {
    (async () => {
      const idx = await blobIndex<Seen, SeenKey>(name)
      const featuredSeen = groupBy(await idx.rows({ part: 'featured' }), r => r.account)
      setSeen({ idx, featuredSeen })
    })()
  }, [])
  return { ...seen, accountSeen: account => seen.idx?.rows({ account }) }
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
  .detail {  }
  .channel {
    margin-top:15px;
    color: var(--fg2);
  }
`