import React, { FunctionComponent } from "react"
import PropTypes from "prop-types"
import { useStaticQuery, graphql } from "gatsby"
import "./main.css"
import Header from './Header'
import { Footer } from './Footer'
import { GlobalStyle } from './Style'


const Layout: FunctionComponent<{ noHeader?: boolean }> = ({ children, noHeader }) => {
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
      {!noHeader && <Header siteTitle={data.site.siteMetadata.title} />}
      <div>
        <main id='main'>{children}</main>
      </div>
      {!noHeader && <Footer />}
    </>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
