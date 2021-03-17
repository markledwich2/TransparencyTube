import { HelpOutline } from 'styled-icons/material'
import React, { FunctionComponent as FC, ReactNode } from 'react'
import { Tip, UseTip } from './Tip'

export const HelpTip: FC<{ useTip: UseTip<ReactNode> }> = ({ children, useTip }) => {
  return <><HelpOutline {...useTip.eventProps(children)} />
    <Tip {...useTip.tipProps}>
      {children}
    </Tip>
  </>
}