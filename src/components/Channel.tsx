import React, { CSSProperties, useEffect, useState } from 'react'
import { indexBy } from 'remeda'
import styled from 'styled-components'
import { ChannelStats, ChannelMeasures, channelMd } from '../common/Channel'
import { numFormat } from '../common/Utils'
import { EsChannel, getChannel } from '../common/YtApi'
import { FlexCol, FlexRow } from './Layout'
import { Spinner } from './Spinner'
import { Videos } from './Video'

export const Description = styled.div`
  max-height:5em;
  overflow: hidden;
  color:var(--fg2);
`

export interface ChannelTipProps {
  channel: ChannelStats
  size: 'min' | 'max'
}

export const ChannelInfo = ({ channel, size }: ChannelTipProps) => {
  const [channelEx, setChannelEx] = useState<EsChannel>(null)

  useEffect(() => {
    if (!channel) return
    let canceled = false //https://medium.com/hackernoon/avoiding-race-conditions-when-fetching-data-with-react-hooks-220d6fd0f663
    getChannel(channel.channelId, ['channelId', 'description']).then(c => {
      if (canceled) return
      setChannelEx(c)
    })
    return () => (canceled = true)
  }, [channel])

  if (!channel) return <></>
  const c = channel
  const exIsSame = channelEx?.channelId == c.channelId
  const e = exIsSame ? channelEx : null

  return <FlexCol style={{ maxWidth: '45em', width: '100%', maxHeight: '100%' }}>
    <ChannelTitle c={c} showMetrics showLr />
    <div style={{ overflowY: 'scroll' }}>
      <Description>
        {!e
          ? <Spinner size='4em' />
          : <p>{e.description}</p>
        }
      </Description>
      {size == 'max' && <Videos channel={c} />}
    </div>
  </FlexCol>
}


const ChannelTitleStyle = styled.div`
  display: flex;
  > * {
    padding-right: '5px'
  }
  .logo {
    :hover {
      cursor: pointer;  
    }
  }
`

export interface ChannelTitleProps {
  c: ChannelStats
  showMetrics?: boolean
  showLr?: boolean
  tipId?: string
  logoStyle?: CSSProperties
  titleStyle?: CSSProperties
  onLogoClick?: (c: ChannelStats) => void
}

export const ChannelTitle = ({ c, showMetrics, showLr, logoStyle, titleStyle, tipId, onLogoClick }: ChannelTitleProps) => {
  const tags = indexBy(channelMd.tags, t => t.value)
  const lr = channelMd.lr.find(i => i.value == c.lr)
  const metrics = (['subs', 'channelViews', 'views7'] as (keyof ChannelMeasures)[])
    .map(d => channelMd.measures.find(m => d == m.value))

  return <ChannelTitleStyle>
    <div><img src={c.logoUrl} data-for={tipId} data-tip={c.channelId}
      onClick={_ => onLogoClick ? onLogoClick(c) : window.open(`https://www.youtube.com/channel/${c.channelId}`, 'yt')}
      className='logo'
      style={{ height: '100px', margin: '5px 5px', clipPath: 'circle()', ...logoStyle }} /></div>
    <div>
      <h2 style={{ marginBottom: '4px', ...titleStyle }}>{c.channelTitle}</h2>
      {showMetrics && <div style={{ marginBottom: '.5em' }}>
        {metrics.map(m => <Metric key={m.value} label={m.label} value={c[m.value]} />)}
      </div>}
      <TagDiv style={{ marginBottom: '1em' }} >
        {showLr && lr && <Tag label={lr.label} color={lr.color} style={{ marginRight: '1em' }} />}
        {c.tags.map(t => <Tag key={t} label={tags[t]?.label ?? t} color={tags[t]?.color ?? 'var(--bg2)'} />)}
      </TagDiv>
    </div>
  </ChannelTitleStyle>
}

const Metric = ({ label: name, value }: { label: string, value: number }) =>
  <span style={{ marginRight: '1em' }}><b>{numFormat(value)}</b> {name}</span>

const TagDiv = styled.div`
    color: #eee;
    > * {
        margin-right:0.3em;
        margin-bottom:0.2em;
    }
`

const TagStyle = styled.span`
  display: inline-block;
  background-color: rgb(66, 66, 66);
  font-size: 0.9em;
  font-weight: bold;
  line-height: 1.6;
  border-radius: 5px;
  padding: 1px 6px;
  white-space:nowrap;
`

export const Tag = ({ color, label, style }: { color?: string, label: string, style?: React.CSSProperties }) =>
  <TagStyle style={{ ...style, backgroundColor: color }}>{label}</TagStyle>