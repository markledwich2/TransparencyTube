import React, { FunctionComponent as FC } from 'react'
import styled from 'styled-components'
import { NarrativeBubbles, useNarrative } from '../../../src/components/NarrativeBubbles'


const StyledBubbles = styled(NarrativeBubbles)`
  
`

export const ElectionFraudNarrative: FC<{}> = ({ }) => {
  const narrative = useNarrative(true)
  return <StyledBubbles {...narrative} />
}