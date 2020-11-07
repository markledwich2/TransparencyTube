import { Link } from "gatsby"
import PropTypes from "prop-types"
import React from "react"
import { compact, flatMap } from 'remeda'
import styled from 'styled-components'
import { uri } from '../common/Uri'
import { safeLocation } from '../common/Utils'
import { Burger } from './Burger'

const NavStyle = styled.nav`
  display:flex;
  justify-content:space-between;
  align-items:center; /* vertical alignment of child items. I'm crap a googling, or this is a secret */
  width:100%;
  padding: 0.5rem;
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

    &.active {
      color:var(--fg-feature)
    }
  }
`
const menuCollapseWidth = '768px'

const BurgerSubNavStyle = styled(NavStyle)`
  a {
    display:block;
    text-transform: none;
    font-size: 0.9em;
    margin: 0.5em 0.5em 0.5em 1em;
  }

  display:none;
  @media (max-width: ${menuCollapseWidth}) {
    display:unset;
  }
`

const SubNavStyle = styled(NavStyle)`
  @media (max-width: ${menuCollapseWidth}) {
    display:none;
  }
  padding-top: 0;
  padding-left: 2em;
  font-size: 1em;
  justify-content:start;
  a {
    text-transform: none;
    padding-right: 1.5em;
  }
`

interface NavItem {
  path: string
  label?: string
  home?: boolean
  subItems?: NavItem[]
}

const pagesMd: NavItem[] = [
  {
    path: '/', label: 'Home', home: true, subItems: [
      { path: '/', label: 'Channels' },
      { path: '/topVideos', label: 'Top Videos' },
      { path: '/removedVideos', label: 'Removed Videos' }
    ]
  },
  { path: '/about', label: 'How it works' },
  { path: '/faq', label: 'FAQ' },
  { path: '/press', label: 'Press' },
  { path: '/contact', label: 'Contact' },
]

interface NavItemRun extends NavItem {
  path: string
  label?: string
  home?: boolean
  active?: boolean
  subItems?: NavItemRun[]
}

const Header = ({ siteTitle }: { siteTitle: string }) => {
  const loc = safeLocation()
  const path = loc ? '/' + uri(loc.href).parts.path.join('/') : null
  const createAllPages = (items: NavItem[]): NavItemRun[] => items.map(i => ({
    ...i,
    active: i.path == path,
    subItems: i.subItems ? createAllPages(i.subItems) : null
  }))
  const pages = createAllPages(pagesMd)
  const topPage = path ? pages.find(p => path?.startsWith(p.path)) : null
  const subPages = topPage?.subItems

  return (
    <header
      style={{
        background: `var(--bg1)`
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
        <Burger collapseWidth={menuCollapseWidth}>
          {pages.map(p => <>
            <PageLink page={p} key={p.path} />
            {p.subItems && <BurgerSubNavStyle>
              {p.subItems.map(sp => <PageLink page={sp} key={`burger-sub-${p.path}-${sp.path}`} />)}
            </BurgerSubNavStyle>}
          </>)}
        </Burger>
      </NavStyle>
      {subPages && <SubNavStyle>
        {subPages.map(p => <PageLink page={p} key={`main-sub-${p.path}`} />)}
      </SubNavStyle>
      }
    </header>
  )
}

const PageLink = ({ page }: { page: NavItemRun }) => <Link
  to={page.path}
  className={compact([page.home ? 'home' : null, page.active ? 'active' : null]).join(' ')}>
  {page.label}
</Link>


Header.propTypes = {
  siteTitle: PropTypes.string,
}

Header.defaultProps = {
  siteTitle: ``,
}

export default Header

