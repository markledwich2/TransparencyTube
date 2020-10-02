import React, { CSSProperties, useContext, useEffect, useState } from 'react'
import { indexBy } from 'remeda'
import styled from 'styled-components'
import { Channel, channelMd, ColumnMd, measureFormat, periodOptions } from '../common/Channel'
import { hoursFormat, numFormat } from '../common/Utils'
import { EsChannel, getChannel } from '../common/EsApi'
import { FlexCol, FlexRow, loadingFilter, StyleProps } from './Layout'
import { Spinner } from './Spinner'
import { Videos } from './Video'
import { ChannelStats, ChannelWithStats, getChannelStats, StatsPeriod, ViewsIndexes } from '../common/RecfluenceApi'
import { InlineSelect } from './InlineSelect'


export interface ChannelTipProps {
  channel: ChannelWithStats
  size: 'min' | 'max'
  indexes: ViewsIndexes
  defaultPeriod: StatsPeriod
}

export const ChannelInfo = ({ channel, size, indexes, defaultPeriod }: ChannelTipProps) => {
  const [channelEx, setChannelEx] = useState<EsChannel>(null)
  const [period, setPeriod] = useState(defaultPeriod)
  const [showDesc, setShowDesc] = useState(false)
  const [stats, setStats] = useState<ChannelStats>(channel)
  const [statsLoading, setStatsLoading] = useState(false)

  useEffect(() => {
    if (!channel) return
    let canceled = false //https://medium.com/hackernoon/avoiding-race-conditions-when-fetching-data-with-react-hooks-220d6fd0f663
    getChannel(channel.channelId, ['channelId', 'description']).then(c => {
      if (canceled) return
      setChannelEx(c)
    })
    return () => (canceled = true)
  }, [channel])

  useEffect(() => {
    if (size != 'max' || (stats?.periodType == period.periodType && stats?.periodValue == period.periodValue))
      return
    setStatsLoading(true)
    getChannelStats(indexes.channelStats, period, channel.channelId).then(c => {
      setStats(c)
      setStatsLoading(false)
    })
  }, [period])

  if (!channel) return <></>
  const c = channel
  const exIsSame = channelEx?.channelId == c.channelId
  const e = exIsSame ? channelEx : null
  const desc = showDesc ? e?.description : e?.description?.substr(0, 300)

  return <FlexCol style={{ maxWidth: '45em', width: '100%', maxHeight: '100%' }}>
    <ChannelTitle c={{ ...c, ...period, ...stats }} showLr statsLoading={statsLoading} />
    <FlexCol space='1em' style={{ overflowY: 'auto' }}>
      <div style={{ color: 'var(--fg3)' }}>
        {!e
          ? <Spinner />
          : <p>{desc}
            {size == 'max' && e.description?.length > 300 && <span>...
              <a onClick={_ => setShowDesc(!showDesc)}>{showDesc ? 'less' : 'more'}</a>
            </span>}
          </p>
        }
      </div>

      {size == 'max' && <>
        <h3>Top videos <InlineSelect value={period} options={periodOptions(indexes.periods)} onChange={v => setPeriod(v)} /></h3>
        <Videos channel={c} indexes={indexes} period={period} />
      </>}
    </FlexCol>
  </FlexCol>
}


const ChannelTitleStyle = styled.div`
  display: flex;
  max-width: 40em;
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
  statsLoading?: boolean
  showLr?: boolean
  tipId?: string
  logoStyle?: CSSProperties
  titleStyle?: CSSProperties
  onLogoClick?: (c: Channel) => void
}

export const ChannelTitle = ({ c, showLr, logoStyle, titleStyle, tipId, onLogoClick, statsLoading }: ChannelTitleProps) => {
  const tags = indexBy(channelMd.tags, t => t.value)
  const lr = channelMd.lr.find(i => i.value == c.lr)

  const fPeriodViews = c.views ? numFormat(c.views) : null
  const fChannelViews = numFormat(c.channelViews)

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
      <FlexRow space='2em' style={{ marginBottom: '.5em', flexFlow: 'wrap', alignItems: 'baseline', filter: statsLoading ? loadingFilter : null }}>
        <span>
          <b style={{ fontSize: '1.3em', color: 'var(--fg)' }}>{fPeriodViews}</b>
          {fPeriodViews != fChannelViews && <span style={{ fontSize: '1em' }}>/{fChannelViews}</span>}
              &nbsp;views
        </span>
        <span><b>{hoursFormat(c.watchHours)}</b> watched</span>
        <span><b>{numFormat(c.subs)}</b> subscribers</span>
      </FlexRow>
      <TagDiv style={{ marginBottom: '1em' }} >
        {showLr && lr && <Tag label={lr.label} color={lr.color} style={{ marginRight: '1em' }} />}
        {c.tags.map(t => <Tag key={t} label={tags[t]?.label ?? t} color={tags[t]?.color ?? 'var(--bg2)'} />)}
      </TagDiv>
    </div>
  </ChannelTitleStyle>
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