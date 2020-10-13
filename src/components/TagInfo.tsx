import React from 'react'
import { Channel, channelColOpts, channelMd } from '../common/Channel'
import { HelpOutline } from '@styled-icons/material'
import ReactTooltip from 'react-tooltip'
import { Tip } from './Tooltip'
import { Markdown } from './Markdown'
import { Tag } from './Channel'
import { indexBy, pipe } from 'remeda'
import { orderBy, values } from '../common/Pipe'
import numeral from 'numeral'
import { StyleProps, styles } from './Layout'

interface TagProps {
  tag: string
}

const tipId = 'tag-help'

export const TagTip = ({ channels }: { channels: Channel[] }) => <Tip
  id={tipId}
  getContent={tag => <TagInfo tag={tag} channels={channels} />} />

export const TagHelp = ({ tag, style }: TagProps & StyleProps) => <HelpOutline
  style={{ ...styles.inlineIcon, ...style }}
  data-tip={tag}
  data-for={tipId} />

export const TagInfo = ({ tag, channels }: TagProps & { channels: Channel[] }) => {
  const tags = indexBy(channelMd.tags.values, t => t.value)
  const t = tags[tag]
  if (!t || !channels) return <></>

  const hasTag = (c: Channel, tag: string) => c.tags?.includes(tag)

  const overlaps = pipe(
    values(tags).filter(u => u.value != t.value).map(u => ({
      tag: u,
      pct: channels.filter(c => hasTag(c, u.value) && hasTag(c, t.value)).length /
        channels.filter(c => hasTag(c, t.value)).length
    })).filter(o => o.pct > 0.02),
    orderBy(o => o.pct, 'desc')
  )

  return <div style={{ maxWidth: '40em' }}>
    <b>{t?.label ?? tag}</b>
    <Markdown>{t?.desc}</Markdown>
    <p style={{ margin: '0.5em 0 0.2em', lineHeight: '2em' }}>Overlaps with:&nbsp;{overlaps.map(o => <Tag
      key={o.tag.value}
      style={{ marginRight: '0.5em' }}
      color={o.tag.color}
      label={`${o.tag.label ?? o.tag.value} ${numeral(o.pct).format('#%')}`} />)}</p>
  </div>
}