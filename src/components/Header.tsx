import { Link } from "gatsby"
import PropTypes from "prop-types"
import React, { Fragment } from "react"
import { compact, first, flatMap } from 'remeda'
import styled from 'styled-components'
import { Pages } from 'styled-icons/material'
import { treeParents, treeToList } from '../common/Pipe'
import { mapToObj } from '../common/remeda/mapToObj'
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
    padding-right: 0.5em;
    font-weight: bold;
    white-space: nowrap;
    :hover {
      color:var(--fg-feature)
    }
    &.active {
      color:var(--fg-feature)
    }
  }
`
const menuCollapseWidth = '768px'

const BurgerSubNavStyle = styled.div`
  a {
    display:block;
    text-transform: none;
    font-size: 0.9em;
    margin: 0 0.5em 0.5em 2em;
    white-space: nowrap;
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
  subLabel?: string
  home?: boolean
  children?: NavItem[]
}

const pagesMd: NavItem[] = [
  {
    path: '/', label: 'Home', subLabel: 'Channels', home: true, children: [
      { path: '/topVideos', label: 'Top Videos' },
      { path: '/removedVideos', label: 'Removed Videos' },
      { path: '/narratives', label: 'Election Fraud Narrative' }
    ]
  },
  {
    path: '/about', label: 'About', subLabel: 'How it works', children: [
      { path: '/media', label: 'As seen on' }
    ]
  },
  { path: '/faq', label: 'FAQ' },
  { path: '/contact', label: 'Contact' },
]

interface NavItemRun extends NavItem {
  path: string
  label?: string
  home?: boolean
  active?: boolean
  children?: NavItemRun[]
  parentPath?: string
}

const Header = ({ siteTitle }: { siteTitle: string }) => {
  const loc = safeLocation()
  const path = loc ? '/' + uri(loc.href).parts.path.join('/') : null
  const createPagesTree = (items: NavItem[], parentPath?: string): NavItemRun[] => items.map(n => ({
    ...n,
    active: n.path == path,
    children: n.children && createPagesTree([{ path: n.path, label: n.subLabel ?? n.label }, ...n.children], n.path),
    parentPath
  }))

  const pages = createPagesTree(pagesMd)
  const pagesByPath = mapToObj(treeToList(pages, n => n.children).filter(n => !n.parentPath || n.parentPath != n.path), n => [n.path, n])
  const page = pagesByPath[path]
  const topPage = page ? first(treeParents(page, n => pagesByPath[n.parentPath])) ?? page : null
  const subPages = topPage?.children ?? []

  return (
    <header
      style={{
        background: `var(--bg1)`
      }}
    >
      <NavStyle>
        <h1 style={{ margin: 0, whiteSpace: 'nowrap' }}>
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
          {pages.map(p => <Fragment key={p.path}>
            <PageLink page={p} key={p.path} />
            {p.children && <BurgerSubNavStyle>
              {p.children.map(sp => <PageLink page={sp} key={`burger-sub-${p.path}-${sp.path}`} />)}
            </BurgerSubNavStyle>}
          </Fragment>)}
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

