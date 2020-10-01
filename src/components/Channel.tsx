import React, { CSSProperties, useContext, useEffect, useState } from 'react'
import { indexBy } from 'remeda'
import styled from 'styled-components'
import { Channel, channelMd, ColumnMd, measureFormat } from '../common/Channel'
import { numFormat } from '../common/Utils'
import { EsChannel, getChannel } from '../common/EsApi'
import { FlexCol } from './Layout'
import { Spinner } from './Spinner'
import { Videos } from './Video'
import { ChannelWithStats, ViewsIndexes } from '../common/RecfluenceApi'

export const Description = styled.div`
  max-height:5em;
  overflow: hidden;
  color:var(--fg2);
`

export interface ChannelTipProps {
  channel: ChannelWithStats
  size: 'min' | 'max'
  indexes: ViewsIndexes
}

export const ChannelInfo = ({ channel, size, indexes }: ChannelTipProps) => {
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
    <ChannelTitle c={c} showMetrics={['channelViews', 'subs', 'views', 'watchHours']} showLr />
    <div style={{ overflowY: 'scroll' }}>
      <Description>
        {!e
          ? <Spinner />
          : <p>{e.description}</p>
        }
      </Description>
      {size == 'max' && <Videos channel={c} indexes={indexes} />}
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
  c: ChannelWithStats
  showMetrics?: (keyof ChannelWithStats)[]
  showLr?: boolean
  tipId?: string
  logoStyle?: CSSProperties
  titleStyle?: CSSProperties
  onLogoClick?: (c: Channel) => void
}

export const ChannelTitle = ({ c, showMetrics, showLr, logoStyle, titleStyle, tipId, onLogoClick }: ChannelTitleProps) => {
  const tags = indexBy(channelMd.tags, t => t.value)
  const lr = channelMd.lr.find(i => i.value == c.lr)
  const metrics = showMetrics?.map(d => channelMd.measures.find(m => d == m.value)) ?? []


  //interaction. this doesn't cause updates to other components. Need to look at something like this  https://kentcdodds.com/blog/how-to-use-react-context-effectively
  //const faded = inter.hover.value ? c[inter.hover.col] != inter.hover.value : false
  //console.log('faded', faded)
  //style={{ opacity: faded ? 0.5 : null }}
  return <ChannelTitleStyle >
    <div><img src={c.logoUrl} data-for={tipId} data-tip={c.channelId}
      onClick={_ => onLogoClick ? onLogoClick(c) : window.open(`https://www.youtube.com/channel/${c.channelId}`, 'yt')}
      // onMouseOver={_ => {
      //   inter.hover = { col: 'lr', value: c.lr }
      // }}
      className='logo'
      style={{ height: '100px', margin: '5px 5px', clipPath: 'circle()', ...logoStyle }} /></div>
    <div>
      <h2 style={{ marginBottom: '4px', ...titleStyle }}>{c.channelTitle}</h2>
      {showMetrics && <div style={{ marginBottom: '.5em' }}>
        {metrics.map(m => <Metric key={m.value} col={m} value={c[m.value]} />)}
      </div>}
      <TagDiv style={{ marginBottom: '1em' }} >
        {showLr && lr && <Tag label={lr.label} color={lr.color} style={{ marginRight: '1em' }} />}
        {c.tags.map(t => <Tag key={t} label={tags[t]?.label ?? t} color={tags[t]?.color ?? 'var(--bg2)'} />)}
      </TagDiv>
    </div>
  </ChannelTitleStyle>
}

const Metric = ({ col, value }: { col: ColumnMd<string>, value: number }) => {
  const fmt = col.format ?? numFormat
  return <span style={{ marginRight: '1em' }}><b>{fmt(value)}</b> {col.label ?? col.value}</span>
}

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