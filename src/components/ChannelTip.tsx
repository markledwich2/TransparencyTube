import React from 'react'
import styled from 'styled-components'
import { ChannelData, ChannelMeasures } from '../common/Data'

export const FlexRow = styled.div<{ space?: string }>`
  display:flex;
  flex-direction: row;
  > * {
    padding-right: ${p => p.space ?? '0.6em'};
  }
`

export interface ChannelTipProps {
  channel: ChannelData
  measure: keyof ChannelMeasures
}
export const ChannelInfo = ({ channel, measure }: ChannelTipProps) => {
  if (!channel) return
  const c = channel
  return <FlexRow>
    <a href={`https://www.youtube.com/channel/${c.channelId}`} target="blank">
      <img src={c.logoUrl} style={{ height: '7em', marginRight: '1em', clipPath: 'circle()' }} />
    </a>
    <h2>{channel.channelTitle}</h2>
  </FlexRow>
}