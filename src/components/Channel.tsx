import React, { CSSProperties, useContext, useEffect, useState } from 'react'
import { indexBy } from 'remeda'
import styled from 'styled-components'
import { Channel, channelMd, ColumnValueMd, measureFormat } from '../common/Channel'
import { hoursFormat, numFormat } from '../common/Utils'
import { EsChannel, getChannel } from '../common/EsApi'
import { FlexCol, FlexRow, loadingFilter, StyleProps } from './Layout'
import { Spinner } from './Spinner'
import { Videos } from './Video'
import { ChannelStats, ChannelWithStats, getChannelStats, ViewsIndexes } from '../common/RecfluenceApi'
import { InlineSelect } from './InlineSelect'
import { PeriodSelect, StatsPeriod } from './Period'
import { Bot, User } from '@styled-icons/boxicons-solid'


export interface TopVideosProps {
  channel: Channel
  size: 'min' | 'max'
  indexes: ViewsIndexes
  defaultPeriod: StatsPeriod
}

export const ChannelDetails = ({ channel, size, indexes, defaultPeriod }: TopVideosProps) => {
  const [channelEx, setChannelEx] = useState<EsChannel>(null)
  const [showDesc, setShowDesc] = useState(false)
  const [stats, setStats] = useState<ChannelStats>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [period, setPeriod] = useState(defaultPeriod)

  useEffect(() => {
    if (!channel) return
    let canceled = false //https://medium.com/hackernoon/avoiding-race-conditions-when-fetching-data-with-react-hooks-220d6fd0f663
    getChannel(channel.channelId, ['channelId', 'description', 'reviewsHuman']).then(c => {
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

  return <FlexCol style={{ maxWidth: '70vw', width: '100%', maxHeight: '100%' }}>
    <ChannelTitle c={{ ...c, ...period, ...stats }} e={e} showLr statsLoading={statsLoading} />
    <FlexCol space='1em' style={{ overflowY: 'auto' }}>
      <div style={{ color: 'var(--fg3)' }}>
        {!e
          ? <Spinner />
          : <p style={{ maxWidth: '50em' }}>{desc}
            {size == 'max' && <span>{e.description?.length > 300 && !showDesc ? '...' : null}
              &nbsp;<a onClick={_ => setShowDesc(!showDesc)}>{showDesc ? 'less' : 'more'}</a>
            </span>}
          </p>
        }
      </div>

      {size == 'max' && <>
        <h3>Top videos <PeriodSelect period={period} periods={indexes.periods} onPeriod={p => setPeriod(p)} /></h3>
        <Videos channel={c} indexes={indexes} period={period} />
      </>}
    </FlexCol>
  </FlexCol>
}

const ChannelTitleStyle = styled.div`
  display: flex;
  max-width: 45em;
  .logo {
    :hover {
      cursor: pointer;
    }
  }
`

const MetricsStyle = styled(FlexRow)`
  flex-flow:wrap;
  align-items:baseline;
  > * {
    margin-bottom:0.5em;
    white-space: nowrap;
  }
`

export interface ChannelTitleProps {
  c: ChannelWithStats
  e?: EsChannel
  statsLoading?: boolean
  showLr?: boolean
  tipId?: string
  logoStyle?: CSSProperties
  titleStyle?: CSSProperties
  onLogoClick?: (c: Channel) => void
}

export const ChannelTitle = ({ c, e, showLr, logoStyle, titleStyle, tipId, onLogoClick, statsLoading }: ChannelTitleProps) => {
  const tags = indexBy(channelMd.tags.values, t => t.value)
  const lr = channelMd.lr.values.find(i => i.value == c.lr)

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
      style={{ height: '100px', margin: '5px 5px', clipPath: 'circle()', ...logoStyle }} />
    </div>
    <div style={{ paddingLeft: '0.5em' }}>
      <h2 style={{ marginBottom: '4px', ...titleStyle }}>{c.channelTitle}</h2>
      <MetricsStyle space='2em' style={{ filter: statsLoading ? loadingFilter : null }}>
        <span>
          {fPeriodViews && <b style={{ fontSize: '1.3em', color: 'var(--fg)' }}>{fPeriodViews}</b>}
          {fPeriodViews != fChannelViews && <span style={{ fontSize: '1em' }}>{fPeriodViews && '/'}{fChannelViews}</span>}&nbsp;views
        </span>
        {c.watchHours && <span><b>{hoursFormat(c.watchHours)}</b> watched</span>}
        {c.subs && <span><b>{numFormat(c.subs)}</b> subscribers</span>}
        {e && e.reviewsHuman >= 0 && <span>{e.reviewsHuman ?
          <p><User /><b>{e.reviewsHuman}</b> manual reviews</p>
          : <p><Bot /> automatic classification</p>}</span>}
      </MetricsStyle>
      <TagDiv style={{ marginBottom: '1em' }} >
        {showLr && lr && <Tag label={lr.label} color={lr.color} style={{ marginRight: '1em' }} />}
        {c.tags.map(t => <Tag key={t} label={tags[t]?.label ?? t} color={tags[t]?.color} />)}
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

interface TagProps { color?: string, label: string }

export const Tag = ({ color, label, style, className }: TagProps & StyleProps) =>
  <TagStyle style={{ ...style, backgroundColor: color, color: '#fff' }} className={className}>{label}</TagStyle>