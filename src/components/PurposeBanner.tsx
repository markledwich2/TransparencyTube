
import React, { PropsWithChildren } from "react"
import styled from 'styled-components'

interface PurposeDivProps {
  feature?: boolean
}

const PurposeDiv = styled.div<PurposeDivProps>`
  &, p {
    color: ${p => p.feature ? '#fff' : 'var(--fg1)'};
  }
  p {
    margin-bottom:1em;
  }
  padding:1em;
  font-size:1.3em;
  margin-bottom:1em;
  background-image:url('/bubble-bg.svg');
  background-image:${p => p.feature ? `url('/bubble-bg.svg')` : 'none'};
  background-color:${p => p.feature ? `var(--bg-feature)` : 'var(--bg1)'};
  background-repeat: no-repeat;
  background-position: right;
  h2 {
    color:var(--fg-feature2);
    font-size:1.3em;
    font-weight: 300;
    margin-bottom: 1em;
  }
  p.subtle {
    font-size: 0.9em;
    color: ${p => p.feature ? '#ddd' : 'var(--fg3)'};
  }
`

const PurposeBanner = ({ children, feature }: PropsWithChildren<PurposeDivProps>) => <PurposeDiv feature={feature}>
  <div style={{ maxWidth: '50em', margin: 'auto' }}>
    {children}
  </div>
</PurposeDiv>

export default PurposeBanner