import React, { FunctionComponent as FC } from 'react'
import { Channel, md } from '../common/Channel'
import { HelpOutline } from '@styled-icons/material'
import { Markdown } from './Markdown'
import { Tag } from './Channel'
import { indexBy, pipe } from 'remeda'
import { orderBy, values } from '../common/Pipe'
import numeral from 'numeral'
import { StyleProps, styles } from './Layout'
import { UseTip } from './Tip'

interface TagProps {
  tag: string
  showTitle?: boolean
}

// export const TagTip = ({ channels }: { channels: Channel[] }) => <ToolTip
//   id={tipId}
//   getContent={tag => <TagInfo tag={tag} channels={channels} />} />

export const TagHelp: FC<TagProps & StyleProps & { useTip: UseTip<string> }> =
  ({ tag, style, useTip }) => <HelpOutline
    style={{ ...styles.inlineIcon, ...style }}
    {...useTip.eventProps(tag)}
  />

export const TagInfo: FC<TagProps & { channels: Channel[] } & StyleProps> = ({ tag, channels, showTitle, style }) => {
  const tags = indexBy(md.channel.tags.values, t => t.value)
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

  return <div style={{ maxWidth: '40em', ...style }}>
    {showTitle && <b>{t?.label ?? tag}</b>}
    <Markdown>{t?.desc}</Markdown>
    <p style={{ margin: '0.5em 0 0.2em', lineHeight: '2em' }}>Overlaps with:&nbsp;{overlaps.map(o => <Tag
      key={o.tag.value}
      style={{ marginRight: '0.5em' }}
      color={o.tag.color}
      label={`${o.tag.label ?? o.tag.value} ${numeral(o.pct).format('#%')}`} />)}</p>
  </div>
}