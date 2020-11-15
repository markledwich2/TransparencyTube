import React, { CSSProperties, FunctionComponent } from "react"
import PropTypes from "prop-types"
import { useStaticQuery, graphql } from "gatsby"

import "./main.css"
import styled, { createGlobalStyle, css } from 'styled-components'
import Header from './Header'
import { StyledIconBase } from '@styled-icons/styled-icon'
import { popupClasses } from './Popup'
import ReactModal from 'react-modal'
import { FluidObject } from 'gatsby-image'
import { uri } from '../common/Uri'
import { safeLocation } from '../common/Utils'
import { Footer } from './Footer'

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
--bgRgb: 255,255,255;
--bg1: #eee;
--bg2: #ddd;
--bg3: #bbb;
--bg4: #999;
`

const darkValues = css`
--fg: #eee;
--fg1: #ccc;
--fg2: #bbb;
--fg3: #999;
--bg: #000;
--bgRgb: 0,0,0;
--bg1: #181818;
--bg2: #222;
--bg3: #444;
--bg4: #666;
`

export const styles = {
  inlineIcon: {
    position: 'relative',
    top: '-0.15em',
    paddingRight: '0.2em'
  } as CSSProperties,
  normalFont: {
    fontSize: '1rem',
    fontWeight: 'normal',
    lineHeight: '1.2rem'
  } as CSSProperties
}

const GlobalStyle = createGlobalStyle`
  :root {
  --bg-feature:#125C6E;
  --bg-feature2:#6E1D39;
  --fg-feature:#1F9FBF;
  --fg-feature2:#b1d5df;
  ${lightValues}
  @media(prefers-color-scheme: dark) {
    ${darkValues}
  }

  ${StyledIconBase} {
    height: 1.4em;
    width: 1.4em;
    color: var(--fg2);
    &.clickable {
      &:hover {
        cursor: pointer;
        fill: var(--fg-feature);
      }
    }
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
      max-width: 95vw;
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

export const FlexRow = styled.div<{ space?: string, wrap?: boolean }>`
  display:flex;
  flex-direction: row;
  ${p => p.wrap && 'flex-wrap: wrap;'}
  > * {
    margin-right: ${p => p.space ?? '0.6em'};
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

export const TextPage = styled.div`
  max-width: 45em;
  margin: auto;
  font-size: 1.4em;
  min-height: 80vh;
  padding: 2em;
  h2 {
    margin-bottom: 1em;
  }
`

export const MinimalPage = styled.div`
  margin: 1em;
  min-height: 80vh;
`

export const MdPageStyle = styled(TextPage)`
  font-family: charter, Georgia, Cambria, "Times New Roman", Times, serif;
  h1, h2, h3 {
    margin: 1em 0;
    font-weight: 800;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    color: var(--fg1);
  }
  p, ul {
    margin-bottom: 2em;
    color: var(--fg2);
  }
  ul {
    list-style-position: outside;
    margin-top: -1em;
    margin-left: 1em;
    li {
      margin-bottom: 1em;
    }
  }

  img {
    width: 100%
  }
`

export const fullFluidUrl = (aboutImg: FluidObject) =>
  uri(safeLocation()?.href ?? 'https://transparency.tube').with({ path: [aboutImg?.src] }).url


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
      <div>
        <main id='main'>{children}</main>
      </div>
      <Footer />
    </>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
