import React, { CSSProperties, useEffect, useState, FunctionComponent as FC } from 'react'
import { indexBy, sortBy as orderBy } from 'remeda'
import styled from 'styled-components'
import { Channel, md, openYtChannel } from '../common/Channel'
import { dateFormat, hoursFormat, numFormat } from '../common/Utils'
import { FlexCol, FlexRow, styles, loadingFilter, StyleProps } from './Style'
import { Videos } from './Video'
import { ChannelStats, ChannelWithStats, isChannelWithStats, ChannelViewIndexes, VideoViews, indexPeriods } from '../common/RecfluenceApi'
import { PeriodSelect, Period, periodString } from './Period'
import { Bot, User, UserCircle as Creator, UserBadge as Reviewer } from '@styled-icons/boxicons-solid'
import { Markdown } from './Markdown'
import Highlighter from "react-highlight-words"
import { SearchSelect } from './SearchSelect'
import { UseTip } from './Tip'

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
    indexes.channelStatsById.rows({ channelId: channel.channelId }).then(chans => {
      const c = chans.find(c => c.period == periodString(period))
      setStats(c)
      setStatsLoading(false)
    })
    indexes.channelVideo.rows({ period: periodString(period), channelId: channel.channelId }).then(setVideos)
    //TODO: build tooltips, set loading property on videos
  }, [periodString(period)])

  if (!channel) return <></>
  const c = channel
  const desc = c?.description

  return <FlexCol style={{ width: '100%', maxHeight: '100%' }}>
    <ChannelTitle c={{ ...c, ...period, ...stats }} showTags showReviewInfo showCollectionStats={mode == 'max'} statsLoading={statsLoading} />
    <FlexCol space='1em'>
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
  onClick?: (c: Channel) => void
}

export const ChannelLogo: FC<StyleProps & ChannelLogoProps & { useTip?: UseTip<ChannelWithStats | Channel> }> =
  ({ c, style, onClick, useTip }) => c && <img
    src={c.logoUrl}
    onClick={_ => onClick ? onClick(c) : openYtChannel(c.channelId)}
    className='logo'
    style={{ clipPath: 'circle()', ...style }}
    {...useTip?.eventProps(c)}
  />

export interface ChannelTitleProps {
  c: ChannelWithStats | Channel
  statsLoading?: boolean
  showTags?: boolean
  showPlatform?: boolean
  showCollectionStats?: boolean
  showReviewInfo?: boolean
  logoStyle?: CSSProperties
  titleStyle?: CSSProperties
  onLogoClick?: (c: Channel) => void
  highlightWords?: string[]
  useTip?: UseTip<ChannelWithStats | Channel>
  metricsExtra?: () => JSX.Element
}

const tags = indexBy(md.channel.tags.values, t => t.value)
const platforms = indexBy(md.channel.platform.values, t => t.value)

export const ChannelTitle: FC<ChannelTitleProps & StyleProps> = ({ c, showTags, showPlatform, showCollectionStats, showReviewInfo, style, className,
  logoStyle, titleStyle, useTip, onLogoClick, statsLoading, highlightWords, children, ...props }) => {
  const lr = md.channel.lr.values.find(i => i.value == c.lr)
  const fViews = isChannelWithStats(c) ? (c.views ? numFormat(c.views) : null) : null
  const fChannelViews = numFormat(c.channelViews)
  const platformMd = platforms[c.platform]

  return <ChannelTitleStyle style={{ position: 'relative', ...style }} className={className}>
    <div><ChannelLogo c={c} onClick={onLogoClick} style={logoStyle} useTip={useTip} /></div>
    <div style={{ paddingLeft: '0.5em' }}>
      <h2 style={{ marginBottom: '4px', ...titleStyle }}>
        {highlightWords ? <Highlighter
          searchWords={highlightWords}
          autoEscape
          caseSensitive={false}
          textToHighlight={c.channelTitle ?? ""}
        /> : c.channelTitle}</h2>
      <MetricsStyle space='1em' style={{ filter: statsLoading ? loadingFilter : null }}>
        {(fViews || fChannelViews) && <span>
          {fViews && <b style={{ fontSize: '1.3em', color: 'var(--fg)' }}>{fViews}</b>}
          {fViews != fChannelViews && <span style={{ fontSize: '1em' }}>{fViews && fChannelViews && '/'}{fChannelViews}</span>}
          {fViews && ' views'}
        </span>}
        {isChannelWithStats(c) && c.watchHours && <span><b>{hoursFormat(c.watchHours)}</b> watched</span>}
        {c.subs && <span><b>{numFormat(c.subs)}</b> subscribers</span>}
        {showCollectionStats && isChannelWithStats(c) && <span>
          {c.latestRefresh ? `Latest data collected on ${dateFormat(c.latestRefresh, 'UTC')} from ${numFormat(c.videos ?? 0)} videos` : 'No data collected during this period. Views presented are an estimate.'}
        </span>}
        {props.metricsExtra?.()}
      </MetricsStyle>
      {showTags && <TagDiv style={{ margin: '0.2em 0' }}>
        {showPlatform && platformMd && <Tag label={platformMd.label} color={platformMd.color} style={{ marginRight: '1em' }} />}
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
      {children}
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
  padding: 0.2em 0.5em 0.15em;
  white-space: nowrap;
`

interface TagProps { color?: string, label?: string }

export const Tag: FC<TagProps & StyleProps & { onClick?: React.MouseEventHandler<Element> }> = ({ color, label, style, className, onClick, children }) =>
  <TagStyle style={{ backgroundColor: color, color: '#fff', ...style }} onClick={onClick} className={className}>{label}{children}</TagStyle>

interface ChannelSearchProps<T extends Channel> {
  onSelect: (c: T) => void
  channels: T[]
  sortBy: keyof T
  placeholder?: string
}

export const ChannelSearch = <T extends Channel>({ onSelect, channels, sortBy = 'channelViews', placeholder = 'search', style }: ChannelSearchProps<T> & StyleProps) => <SearchSelect
  style={{ width: '14em', ...style }}
  onSelect={onSelect}
  search={(q) => new Promise((resolve) => resolve(
    orderBy(
      channels.filter(f => f.channelTitle?.match(new RegExp(`${q}`, 'i'))),
      [c => c[sortBy] as any as number | string | boolean, 'desc'])
  ))}
  itemRender={(c: Channel) => <ChannelTitle c={c} showTags showPlatform style={{ width: '30em', padding: '1em 0' }} onLogoClick={onSelect}
    logoStyle={{ width: '100px' }} />}
  getKey={c => c.channelId}
  getLabel={c => c.channelTitle}
  placeholder={placeholder}
/>