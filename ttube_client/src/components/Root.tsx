import { Router } from '@reach/router'
import React, { FunctionComponent as FC } from 'react'
import styled from 'styled-components'
import { GlobalStyle } from '../../../src/components/Style'


const StyledRoot = styled.div`
`

export const Root: FC = ({ children }) => <StyledRoot>
  <GlobalStyle noDark={true} />
  {children}
</StyledRoot>