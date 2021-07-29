import React, { FunctionComponent as FC, Fragment } from 'react'
import { StyleProps, styles } from '../Style'
import { uniq } from 'remeda'
import { Channel } from '../../common/Channel'
import { values } from '../../common/Pipe'
import { ChannelLogo, ChannelSearch } from '../Channel'
import { CloseOutline } from 'styled-icons/evaicons-outline'

export const SelectWithChannelSearch: FC<{
  channels: Record<string, Channel>,
  ids: string[],
  onSelect: (select: string[]) => void,
  multiSelect?: boolean
} & StyleProps> = ({ channels, ids, onSelect, multiSelect, style }) => {
  return <div style={{ display: 'flex', alignItems: 'center', ...style }}>
    {channels && ids?.map(id => {
      const chan = channels[id]
      return chan && <Fragment key={id}>
        <ChannelLogo c={chan} style={{ height: '3em' }} />
        <CloseOutline style={{ verticalAlign: 'middle' }} className='clickable' onClick={() => onSelect(ids.filter(c => c != id))} />
      </Fragment>
    })}
    {channels && (multiSelect || !ids?.length) && <ChannelSearch onSelect={c => {
      onSelect(uniq((ids ?? []).concat([c.channelId])))
    }} channels={values(channels)} sortBy='channelViews' style={styles.normalFont} />}
  </div>
}

