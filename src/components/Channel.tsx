import React, { CSSProperties, useContext, useEffect, useState } from 'react'
import { first, indexBy } from 'remeda'
import styled from 'styled-components'
import { Channel, channelUrl, md, measureFormat, openYtChannel } from '../common/Channel'
import { dateFormat, hoursFormat, numFormat } from '../common/Utils'
import { FlexCol, FlexRow, styles, loadingFilter, StyleProps } from './Layout'
import { Spinner } from './Spinner'
import { Videos } from './Video'
import { ChannelStats, ChannelWithStats, isChannelWithStats, ChannelViewIndexes, VideoViews, indexPeriods } from '../common/RecfluenceApi'
import { PeriodSelect, HasPeriod, Period, periodString } from './Period'
import { Bot, User, UserCircle as Creator, UserBadge as Reviewer } from '@styled-icons/boxicons-solid'
import { Markdown } from './Markdown'
import Highlighter from "react-highlight-words"
import { SearchSelect } from './SearchSelect'
import orderBy from 'lodash.orderby'
import { values } from '../common/Pipe'

export interface TopVideosProps {
  channel: Channel
  mode: 'min' | 'max'
  indexes?: ChannelViewIndexes
  defaultPeriod?: Period
}

export const ChannelDetails = ({ channel, mode, indexes, defaultPeriod }: TopVideosProps) => {
  const [stats, setStats] = useState<ChannelStats>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [period, setPeriod] = useState(defaultPeriod)
  const [videos, setVideos] = useState<VideoViews[]>(null)

  useEffect(() => {
    if (mode != 'max')
      return
    setStatsLoading(true)
    indexes.channelStatsById.getRows({ channelId: channel.channelId }).then(chans => {
      const c = chans.find(c => c.period == periodString(period))
      setStats(c)
      setStatsLoading(false)
    })
    indexes.channelVideo.getRows({ period: periodString(period), channelId: channel.channelId }).then(setVideos)
    //TODO: build tooltips, set loading property on videos
  }, [periodString(period)])

  if (!channel) return <></>
  const c = channel
  const desc = c?.description

  return <FlexCol style={{ width: '100%', maxHeight: '100%' }}>
    <ChannelTitle c={{ ...c, ...period, ...stats }} showTags showReviewInfo showCollectionStats={mode == 'max'} statsLoading={statsLoading} />
    <FlexCol space='1em' style={{ overflowY: 'auto' }}>
      <div style={{ color: 'var(--fg3)' }}>
        <p style={{ maxWidth: '50em' }}>
          {desc}{desc?.length > 300 && '...'}
        </p>
      </div>
      {mode == 'max' && <>
        <h3>Top videos <PeriodSelect period={period} periods={indexPeriods(indexes.channelVideo)} onPeriod={p => setPeriod(p)} /></h3>
        <Videos videos={videos} showThumb />
      </>}
    </FlexCol>
  </FlexCol>
}

const ChannelTitleStyle = styled.div`
  display: flex;
  max-width:800px;
  .logo {
    :hover {
      cursor: pointer;
    }
    margin: 0.5em;
    @media (max-width: 600px) {
      width:50px;
    }
  }
`

const MetricsStyle = styled(FlexRow)`
  flex-flow:wrap;
  align-items:baseline;
`

export interface ChannelLogoProps {
  c: ChannelWithStats | Channel
  tipId?: string
  onClick?: (c: Channel) => void
}

export const ChannelLogo = ({ c, tipId, style, onClick }: StyleProps & ChannelLogoProps) => <img
  src={c.logoUrl}
  data-for={tipId} data-tip={c.channelId}
  onClick={_ => onClick ? onClick(c) : openYtChannel(c.channelId)}
  className='logo'
  style={{ clipPath: 'circle()', ...style }} />

export interface ChannelTitleProps {
  c: ChannelWithStats | Channel
  statsLoading?: boolean
  showTags?: boolean
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

export const ChannelTitle = ({ c, showTags, showCollectionStats, showReviewInfo, style, logoStyle, titleStyle, tipId, onLogoClick, statsLoading, highlightWords }: ChannelTitleProps) => {
  const lr = md.channel.lr.values.find(i => i.value == c.lr)
  const fViews = isChannelWithStats(c) ? (c.views ? numFormat(c.views) : null) : null
  const fChannelViews = numFormat(c.channelViews)
  //interaction. this doesn't cause updates to other components. Need to look at something like this  https://kentcdodds.com/blog/how-to-use-react-context-effectively
  //const faded = inter.hover.value ? c[inter.hover.col] != inter.hover.value : false
  //console.log('faded', faded)
  //style={{ opacity: faded ? 0.5 : null }}
  return <ChannelTitleStyle style={style}>
    <div><ChannelLogo c={c} tipId={tipId} onClick={onLogoClick} style={logoStyle} /></div>
    <div style={{ paddingLeft: '0.5em' }}>
      <h2 style={{ marginBottom: '4px', ...titleStyle }}>
        {highlightWords ? <Highlighter
          searchWords={highlightWords}
          autoEscape
          caseSensitive={false}
          textToHighlight={c.channelTitle ?? ""}
        /> : c.channelTitle}</h2>
      <MetricsStyle space='1em' style={{ filter: statsLoading ? loadingFilter : null }}>
        <span>
          {fViews && <b style={{ fontSize: '1.3em', color: 'var(--fg)' }}>{fViews}</b>}
          {fViews != fChannelViews && <span style={{ fontSize: '1em' }}>{fViews && fChannelViews && '/'}{fChannelViews}</span>}
          {fViews && '&nbsp;views'}
        </span>
        {isChannelWithStats(c) && c.watchHours && <span><b>{hoursFormat(c.watchHours)}</b> watched</span>}
        {c.subs && <span><b>{numFormat(c.subs)}</b> subscribers</span>}
        {showCollectionStats && isChannelWithStats(c) && <span>
          {c.latestRefresh ? `Latest data collected on ${dateFormat(c.latestRefresh, 'UTC')} from ${numFormat(c.videos ?? 0)} videos` : 'No data collected during this period. Views presented are an estimate.'}
        </span>
        }
      </MetricsStyle>
      {showTags && <TagDiv style={{ margin: '0.2em 0' }}>
        {lr && <Tag label={lr.label} color={lr.color} style={{ marginRight: '1em' }} />}
        {c.tags?.map(t => <Tag key={t} label={tags[t]?.label ?? t} color={tags[t]?.color} />)}
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
  if (c.tags?.includes('AntiSJW') && c.lr == 'R' && !c.tags.some(t => ['PartisanRight', 'ReligiousConservative'].includes(t)))
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


interface ChannelSearchProps<T extends Channel> {
  onSelect: (T) => void
  channels: T[]
  sortBy: keyof T
}

export const ChannelSearch = <T extends Channel>({ onSelect, channels, sortBy = 'channelViews', style }: ChannelSearchProps<T> & StyleProps) => <SearchSelect
  style={{ width: '14em', ...style }}
  onSelect={onSelect}
  search={(q) => new Promise((resolve) => resolve(
    orderBy(
      channels.filter(f => f.channelTitle.match(new RegExp(`${q}`, 'i'))),
      c => c[sortBy], 'desc')
  ))}
  itemRender={(c: Channel) => <ChannelTitle c={c} showTags style={{ width: '30em', padding: '1em 0' }} onLogoClick={onSelect} />}
  getKey={c => c.channelId}
  getLabel={c => c.channelTitle}
  placeholder='search'
/>