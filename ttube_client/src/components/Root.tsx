import { Router } from '@reach/router'
import React, { FunctionComponent as FC } from 'react'
import styled, { css } from 'styled-components'
import { GlobalStyle } from '../../../src/components/Style'


const StyledRoot = styled.div`
  width: 100%;
  text-align: left;
  font-size: 14px;
  line-height: 1.2em;
  box-sizing: border-box;

  h1, h2, h3, h4 {
    line-height: normal;
  }

  *::-webkit-scrollbar {
    width: 0.5em;
  }

  *::-webkit-scrollbar-thumb {
      background-color: var(--bg2)
  }

  input {
      background: var(--bg2);
      font-size: 1.1em;
      padding: 0.5em 0.6em;
      border-radius: 0.3em;
      border: 1px solid var(--bg);
  }

  input:focus {
      outline: none;
      border-color: var(--bg-feature)
  }

  a {
    color: var(--fg-feature);
    text-decoration: none;
    cursor: pointer;
    font-weight: bold;
  }
`

const colorCss = css`
--bg-feature:#cca45a;
--bg-feature2:#cca45a;
--fg-feature:#cca45a;
--fg-feature2:#cca45a;
`

export const Root: FC = ({ children }) => <StyledRoot>
  <GlobalStyle noDark={true} colorCss={colorCss} />
  {children}
</StyledRoot>