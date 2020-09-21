/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React, { FunctionComponent } from "react"
import PropTypes from "prop-types"
import { useStaticQuery, graphql } from "gatsby"

import "./main.css"
import styled, { createGlobalStyle, css } from 'styled-components'
import Header from './Header'

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
--bg1: #eee;
--bg2: #bbb;
--bg3: #999;
`

const darkValues = css`

--fg: #eee;
--fg1: #ccc;
--fg2: #bbb;
--fg3: #999;
--bg: #000;
--bg1: #111;
--bg2: #444;
--bg3: #666;
`

const GlobalStyle = createGlobalStyle`
  :root {
  --bg-feature:#125C6E;
  --fg-feature:#1F9FBF;
  ${lightValues}
  @media(prefers-color-scheme: dark) {
    ${darkValues}
  }
}
`

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
        <main>{children}</main>
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
