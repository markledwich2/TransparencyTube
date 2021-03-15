import React, { FunctionComponent } from "react"
import PropTypes from "prop-types"
import { useStaticQuery, graphql } from "gatsby"
import "./main.css"
import Header from './Header'
import { Footer } from './Footer'
import { GlobalStyle } from './Style'


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
