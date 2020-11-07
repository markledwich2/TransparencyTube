import React, { CSSProperties, useContext, useEffect, useState } from 'react'
import { first, indexBy } from 'remeda'
import styled from 'styled-components'
import { Channel, channelUrl, md, measureFormat, openYtChannel } from '../common/Channel'
import { dateFormat, hoursFormat, numFormat } from '../common/Utils'
import { FlexCol, FlexRow, styles, loadingFilter, StyleProps } from './Layout'
import { Spinner } from './Spinner'
import { Videos } from './Video'
import { ChannelStats, ChannelWithStats, isChannelWithStats, ChannelViewIndexes, VideoViews } from '../common/RecfluenceApi'
import { PeriodSelect, StatsPeriod } from './Period'
import { Bot, User, UserCircle as Creator, UserBadge as Reviewer } from '@styled-icons/boxicons-solid'
import { Markdown } from './Markdown'
import Highlighter from "react-highlight-words"

export interface TopVideosProps {
  channel: Channel
  mode: 'min' | 'max'
  indexes?: ChannelViewIndexes
  defaultPeriod?: StatsPeriod
}

export const ChannelDetails = ({ channel, mode, indexes, defaultPeriod }: TopVideosProps) => {
  const [stats, setStats] = useState<ChannelStats>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [period, setPeriod] = useState(defaultPeriod)
  const [videos, setVideos] = useState<VideoViews[]>(null)

  useEffect(() => {
    if (mode != 'max' || (stats?.periodType == period.periodType && stats?.periodValue == period.periodValue))
      return
    setStatsLoading(true)
    indexes.channelStatsById.getRows({ ...period, channelId: channel.channelId }).then(c => {
      setStats(first(c))
      setStatsLoading(false)
    })
    indexes.channelVideo.getRows({ ...period, channelId: channel.channelId }).then(setVideos)
    //TODO: build tooltips, set loading property on videos
  }, [period])

  if (!channel) return <></>
  const c = channel
  const desc = c?.description

  return <FlexCol style={{ width: '100%', maxHeight: '100%' }}>
    <ChannelTitle c={{ ...c, ...period, ...stats }} tagsMode='show' showReviewInfo showCollectionStats={mode == 'max'} statsLoading={statsLoading} />
    <FlexCol space='1em' style={{ overflowY: 'auto' }}>
      <div style={{ color: 'var(--fg3)' }}>
        <p style={{ maxWidth: '50em' }}>
          {desc}{desc?.length > 300 && '...'}
        </p>
      </div>
      {mode == 'max' && <>
        <h3>Top videos <PeriodSelect period={period} periods={indexes.periods} onPeriod={p => setPeriod(p)} /></h3>
        <Videos videos={videos} showThumb />
      </>}
    </FlexCol>
  </FlexCol>
}

const ChannelTitleStyle = styled.div`
  display: flex;
  max-width: 40em;
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
    white-space: nowrap;
  }
`


export interface ChannelTitleProps {
  c: ChannelWithStats | Channel
  statsLoading?: boolean
  tagsMode?: 'show' | 'faded'
  showCollectionStats?: boolean
  showReviewInfo?: boolean
  tipId?: string
  style?: CSSProperties
  logoStyle?: CSSProperties
  titleStyle?: CSSProperties
  onLogoClick?: (c: Channel) => void
  highlightWords?: string[]
}

const tags = indexBy(md.channel.tags.values, t => t.value)

export const ChannelTitle = ({ c, tagsMode, showCollectionStats, showReviewInfo, style, logoStyle, titleStyle, tipId, onLogoClick, statsLoading, highlightWords }: ChannelTitleProps) => {
  const lr = md.channel.lr.values.find(i => i.value == c.lr)
  const fPeriodViews = isChannelWithStats(c) ? (c.views ? numFormat(c.views) : null) : null
  const fChannelViews = numFormat(c.channelViews)
  //interaction. this doesn't cause updates to other components. Need to look at something like this  https://kentcdodds.com/blog/how-to-use-react-context-effectively
  //const faded = inter.hover.value ? c[inter.hover.col] != inter.hover.value : false
  //console.log('faded', faded)
  //style={{ opacity: faded ? 0.5 : null }}
  return <ChannelTitleStyle style={style}>
    <div><img src={c.logoUrl} data-for={tipId} data-tip={c.channelId}
      onClick={_ => onLogoClick ? onLogoClick(c) : openYtChannel(c.channelId)}
      // onMouseOver={_ => {
      //   inter.hover = { col: 'lr', value: c.lr }
      // }}
      className='logo'
      style={{ height: '100px', margin: '5px 5px', clipPath: 'circle()', ...logoStyle }} />
    </div>
    <div style={{ paddingLeft: '0.5em' }}>
      <h2 style={{ marginBottom: '4px', ...titleStyle }}>
        {highlightWords ? <Highlighter
          searchWords={highlightWords}
          autoEscape
          caseSensitive={false}
          textToHighlight={c.channelTitle ?? ""}
        /> : c.channelTitle}</h2>
      <MetricsStyle space='2em' style={{ filter: statsLoading ? loadingFilter : null }}>
        <span>
          {fPeriodViews && <b style={{ fontSize: '1.3em', color: 'var(--fg)' }}>{fPeriodViews}</b>}
          {fPeriodViews != fChannelViews && <span style={{ fontSize: '1em' }}>{fPeriodViews && '/'}{fChannelViews}</span>}&nbsp;views
        </span>
        {isChannelWithStats(c) && c.watchHours && <span><b>{hoursFormat(c.watchHours)}</b> watched</span>}
        {c.subs && <span><b>{numFormat(c.subs)}</b> subscribers</span>}
        {showCollectionStats && isChannelWithStats(c) && <span>
          {c.latestRefresh ? `Latest data collected on ${dateFormat(c.latestRefresh, 'UTC')} from ${numFormat(c.videos ?? 0)} videos` : 'No data collected during this period. Views presented are an estimate.'}
        </span>
        }
      </MetricsStyle>
      {tagsMode && <TagDiv style={{ margin: '0.2em 0', filter: tagsMode == 'faded' ? 'grayscale(80%)' : null }} >
        {lr && <Tag label={lr.label} color={lr.color} style={{ marginRight: '1em' }} />}
        {c.tags.map(t => <Tag key={t} label={tags[t]?.label ?? t} color={tags[t]?.color} />)}
      </TagDiv>}
      {showReviewInfo && c && c.reviewsHuman >= 0 && <span>{c.reviewsHuman ?
        <p><User style={styles.inlineIcon} /><b>{c.reviewsHuman}</b> manual reviews</p>
        : <p><Bot style={styles.inlineIcon} /> automatic classification</p>}</span>}
      {showReviewInfo && <>
        <Note type='reviewer' c={c} />
        <Note type='creator' c={c} />
      </>}
    </div>
  </ChannelTitleStyle>
}

const autoReviewNotes = (c: Channel) => {
  if (c.tags.includes('AntiSJW') && c.lr == 'R' && !c.tags.some(t => ['PartisanRight', 'ReligiousConservative'].includes(t)))
    return `Anti-woke content is considered a 'right' position in our [classification process](https://github.com/markledwich2/Recfluence#leftcenterright).  ${c.reviewsHuman ? 'Reviewers weighed this against center/left content and concluded it was predominantly  on this side of the left/right dimension.' : ''}`
  return null
}

const Note = ({ type, c }: { type: 'creator' | 'reviewer', c: Channel }) => {
  if (!c) return <></>
  const notes = type == 'reviewer' ? (c.publicReviewerNotes ?? autoReviewNotes(c)) : c.publicCreatorNotes
  if (!notes) return <></>

  const iconProps = {
    style: {
      ...styles.inlineIcon,
      marginTop: '0.2em'
    },
    title: `${type == 'creator' ? 'Creator' : 'Reviewer'} notes`
  }

  return <FlexRow>
    {type == 'reviewer' ? <Reviewer {...iconProps} /> : <Creator {...iconProps} />}
    <Markdown>{notes}</Markdown>
  </FlexRow>
}

const TagDiv = styled.div`
  color: #eee;
  > * {
    margin-right: 0.3em;
    margin-bottom: 0.2em;
  }
`

const TagStyle = styled.span`
  display: inline-block;
  background-color: var(--bg4);
  font-size: 0.9em;
  font-weight: bold;
  line-height: 1.6;
  border-radius: 5px;
  padding: 1px 6px;
  white-space: nowrap;
`

interface TagProps { color?: string, label: string }

export const Tag = ({ color, label, style, className }: TagProps & StyleProps) =>
  <TagStyle style={{ ...style, backgroundColor: color, color: '#fff' }} className={className}>{label}</TagStyle>