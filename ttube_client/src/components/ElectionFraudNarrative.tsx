import React, { FunctionComponent as FC } from 'react'
import { NarrativeBubbles, useNarrative } from '../../../src/components/NarrativeBubbles'

export const ElectionFraudNarrative: FC<{}> = ({ }) => {
  const narrative = useNarrative(true)
  return <NarrativeBubbles {...narrative} />
}