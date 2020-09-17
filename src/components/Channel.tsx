import React, { useEffect, useState } from 'react'
import { indexBy } from 'remeda'
import styled from 'styled-components'
import { ChannelStats, ChannelMeasures, channelMd } from '../common/Channel'
import { EsChannel, getChannel } from '../common/YtApi'
import { Spinner } from './Spinner'
import { compactInteger } from 'humanize-plus'

export const FlexRow = styled.div<{ space?: string }>`
  display:flex;
  flex-direction: row;
  > * {
    padding-right: ${p => p.space ?? '0.6em'};
  }
`

export const Description = styled.div`
  width:30em;
  max-height:5em;
  overflow: hidden;
`

export interface ChannelTipProps {
  channel: ChannelStats
  measure: keyof ChannelMeasures
}
export const ChannelInfo = ({ channel, measure }: ChannelTipProps) => {
  const [esChannels, setEsChannels] = useState<EsChannel[]>([])

  useEffect(() => {
    if (!channel || esChannels.find(e => e.channelId == channel.channelId)) return
    let canceled = false //https://medium.com/hackernoon/avoiding-race-conditions-when-fetching-data-with-react-hooks-220d6fd0f663
    getChannel(channel.channelId).then(c => {
      if (!canceled)
        setEsChannels(esChannels.concat(c))
    })
    return () => (canceled = true)
  }, [channel])

  if (!channel) return
  const c = channel
  const e = esChannels.find(e => e.channelId == c.channelId)
  const tags = indexBy(channelMd.tag, t => t.value)
  const lr = channelMd.lr.find(i => i.value == c.lr)

  const metrics = (['subs', 'channelViews', 'views7'] as (keyof ChannelMeasures)[])
    .map(d => channelMd.measures.find(m => d == m.value))

  return <>
    <FlexRow style={{ minWidth: '30em' }}>
      <a href={`https://www.youtube.com/channel/${c.channelId}`} target="blank">
        <img src={c.logoUrl} style={{ height: '7em', marginRight: '1em', clipPath: 'circle()' }} />
      </a>
      <div>
        <h2 style={{ marginBottom: '0.1em' }}>{channel.channelTitle}</h2>
        <div style={{ marginBottom: '.5em' }}>{metrics.map(m => <Metric label={m.label} value={c[m.value]} />)}</div>
        <TagDiv style={{ marginBottom: '1em' }} >
          {lr && <Tag label={lr.label} color={lr.color} style={{ marginRight: '1em' }} />}
          {c.tags.map(t => <Tag key={t} label={tags[t]?.label ?? t} color={tags[t]?.color ?? 'var(--bg2)'} />)}
        </TagDiv>
        <Description>
          {!e
            ? <Spinner size='4em' />
            : <p>{e.description}</p>
          }
        </Description>
      </div>
    </FlexRow>
  </>
}

const Metric = ({ label: name, value }: { label: string, value: number }) =>
  <span style={{ marginRight: '1em' }}><b>{compactInteger(value)}</b> {name}</span>

const TagDiv = styled.div`
    color: #fff;
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