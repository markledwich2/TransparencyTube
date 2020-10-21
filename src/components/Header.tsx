import { Link } from "gatsby"
import PropTypes from "prop-types"
import React from "react"
import styled from 'styled-components'

const NavStyle = styled.nav`
  display:flex;
  justify-content:space-between;
  align-items:center; /* vertical alignment of child items. I'm crap a googling, or this is a secret */
  width:100%;

  padding: 1em;
  
  a {
    color:white;
    text-decoration: none;
    text-transform: uppercase;
  }

  .text-links a.active {
  }

  /* .icon, .text-icon {
    height: 1.7em;
    position:relative;
    top:0.2em;
  } */
`

const Header = ({ siteTitle }: { siteTitle: string }) => (
  <header
    style={{
      background: `var(--bg-feature)`,
      marginBottom: `0.5em`,
    }}
  >
    <NavStyle>
      <h1 style={{ margin: 0 }}>
        <Link
          to="/"
          style={{
            color: `white`,
            textDecoration: `none`,
            textTransform: 'none'
          }}
        >
          {siteTitle}
        </Link>
      </h1>
      <Link to={'/about'}>About</Link>
    </NavStyle>
  </header>
)

Header.propTypes = {
  siteTitle: PropTypes.string,
}

Header.defaultProps = {
  siteTitle: ``,
}

export default Header

