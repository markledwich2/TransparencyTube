/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React, { FunctionComponent } from "react"
import PropTypes from "prop-types"
import { useStaticQuery, graphql } from "gatsby"

import Header from "./header"
import "./main.css"
import { createGlobalStyle, css } from 'styled-components'

export interface StyleProps {
  style?: React.CSSProperties
  className?: string
}

const lightValues = css`
  --fg: #111;
  --fg1: #333;
  --bg: #fff;
  --bg1: #ddd;
  --bg2: #aaa;
`

const darkValues = css`
--fg: #eee;
--fg1: #ccc;
--bg: #000;
--bg1: #222;
--bg2: #444;
`

const GlobalStyle = createGlobalStyle`
  :root {
  ${lightValues}
  @media(prefers-color-scheme: dark) {
    ${darkValues}
  }
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
        style={{
          padding: `0 1.0875rem 1.45rem`,
        }}
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
