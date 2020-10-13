import React, { CSSProperties, FunctionComponent } from "react"
import PropTypes from "prop-types"
import { useStaticQuery, graphql } from "gatsby"

import "./main.css"
import styled, { createGlobalStyle, css } from 'styled-components'
import Header from './Header'
import { StyledIconBase } from '@styled-icons/styled-icon'
import { popupClasses } from './Popup'
import ReactModal from 'react-modal'

export interface StyleProps {
  style?: React.CSSProperties
  className?: string
}

const lightValues = css`
--fg: #111;
--fg1: #222;
--fg2:#444;
--fg3:#666;
--bg: #fff;
--bgRgb: 0,0,0;
--bg1: #eee;
--bg2: #ddd;
--bg3: #bbb;
--bg4: #999;
`

const darkValues = css`
--fg: #eee;
--fgRgb: 255,255,255;
--fg1: #ccc;
--fg2: #bbb;
--fg3: #999;
--bg: #000;
--bg1: #111;
--bg2: #222;
--bg3: #444;
--bg4: #666;
`

export const styles = {
  inlineIcon: {
    position: 'relative',
    top: '-0.15em',
    paddingRight: '0.2em'
  } as CSSProperties
}

const GlobalStyle = createGlobalStyle`
  :root {
  --bg-feature:#125C6E;
  --fg-feature:#1F9FBF;
  ${lightValues}
  @media(prefers-color-scheme: dark) {
    ${darkValues}
  }

  ${StyledIconBase} {
    height: 1.4em;
    width: 1.4em;
    color: var(--fg2);
  }

  div.${popupClasses.popup} {
    background-color: var(--bg);
    position: absolute;
    padding: 1em;
    z-index: 10;
    
    top:0;
    left:0;
    width: 100vw;
    height: 100vh;
    @media screen and (min-width: 600px) {
      background-color: rgb(var(--bgRgb), 0.9);
      border: solid 1px var(--bg3);
      border-radius: 0.5em;
      outline: none;
      overflow-y: auto;
      max-height: 90vh;
      max-width: 90vw;
      top: 50%;
      left: 50%;
      right: auto;
      bottom: auto;
      margin-right: -50%;
      transform: translate(-50%, -50%);
    }
  }
  div.${popupClasses.overlay} {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    @media screen and (min-width: 600px) {
      backdrop-filter: blur(6px);
    }
  }
}
`

export const loadingFilter = 'opacity(0.4)'

export const FlexRow = styled.div<{ space?: string }>`
  display:flex;
  flex-direction: row;
  > * {
    padding-right: ${p => p.space ?? '0.6em'};
  }
`

export const FlexCol = styled.div<{ space?: string }>`
  display:flex;
  flex-direction: column;
  > * {
    padding-bottom: ${p => p.space ?? '0.6em'};
  }
`

export const NormalFont = styled.span`
  font-size:1rem;
  font-weight:normal;
  line-height: 1.2rem;
`


const Layout: FunctionComponent = ({ children }) => {
  const data = useStaticQuery(graphql`
query SiteTitleQuery {
  site {
    siteMetadata {
      title
    }
  }
}
`)

  return (
    <>
      <GlobalStyle />
      <Header siteTitle={data.site.siteMetadata.title} />
      <div
        style={{ padding: '0 0.5em' }}
      >
        <main id='main'>{children}</main>
        <footer>
        </footer>
      </div>
    </>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
