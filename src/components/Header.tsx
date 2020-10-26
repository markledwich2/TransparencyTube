import { Link } from "gatsby"
import PropTypes from "prop-types"
import React from "react"
import styled from 'styled-components'
import { Burger } from './Burger'

const NavStyle = styled.nav`
  display:flex;
  justify-content:space-between;
  align-items:center; /* vertical alignment of child items. I'm crap a googling, or this is a secret */
  width:100%;

  padding: 1em;
  font-size: 1.2em;

  color: var(--fg);
  
  a {
    color: var(--fg);
    text-decoration: none;
    text-transform: uppercase;
    padding-right: 1.5em;
    font-weight: bold;
    :hover {
      color:var(--fg-feature)
    }
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
      background: `var(--bg1)`,
      marginBottom: `0.5em`,
    }}
  >
    <NavStyle>
      <h1 style={{ margin: 0 }}>
        <img src="/ttube.svg" style={{ height: '1em', marginRight: '0.2em', position: 'relative', top: '0.2em' }} />
        <Link
          to="/"
          style={{
            textDecoration: `none`,
            textTransform: 'none'
          }}
        >
          {siteTitle}
        </Link>
      </h1>
      <Burger>
        <Link to={'/'} className='open-only'>Home</Link>
        <Link to={'/about'}>How it works</Link>
        <Link to={'/press'}>Press</Link>
        <Link to={'/contact'}>Contact</Link>
      </Burger>
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

