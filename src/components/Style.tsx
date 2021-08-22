
import React, { CSSProperties } from "react"
import styled, { createGlobalStyle, css } from 'styled-components'
import { StyledIconBase } from '@styled-icons/styled-icon'
import { popupClasses } from './Popup'
import { FluidObject } from 'gatsby-image'
import { uri } from '../common/Uri'
import { safeLocation } from '../common/Utils'

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
--fgRgb: 0,0,0;
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
--fgRgb: 255,255,255;
--bg1: #181818;
--bg2: #222;
--bg3: #444;
--bg4: #666;
`

const defaultColors = css`
  --bg-feature:#125C6E;
  --bg-feature2:#6E1D39;
  --fg-feature:#1F9FBF;
  --fg-feature2:#b1d5df;
`

export const styles = {
  inlineIcon: {
    position: 'relative',
    top: '-0.1em',
    paddingRight: '0.2em'
  } as CSSProperties,
  normalFont: {
    fontSize: '1rem',
    fontWeight: 'normal',
    lineHeight: '1.2rem'
  } as CSSProperties,
  centerH: {
    margin: '0 auto', width: 'fit-content'
  } as CSSProperties,

  tip: {
    opacity: 1,
    padding: '1rem',
    fontSize: '1rem',
    backgroundColor: 'var(--bg1)',
    color: 'var(--fg)',
    border: '1px solid var(--bg3)',
    borderRadius: '10px'
  } as CSSProperties
}

export const GlobalStyle = createGlobalStyle`
  :root {
  
  
  ${lightValues}

  ${p => !p.noDark && `@media(prefers-color-scheme: dark) { ${darkValues} }`}

  ${p => p.colorCss ? p.colorCss : defaultColors}

  ${StyledIconBase} {
    height: 1.4em;
    width: 1.4em;
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
    z-index: 10;
    top:0;
    left:0;
    width: 100vw;
    height: 100vh;
    border: none;
    outline: none;
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
    div.${popupClasses.content} {
      overflow-y: auto;
      height: 100%;
      padding: 2em 1em;
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


export const FlexCenter = styled.div`
  display:flex;
  align-items: center;
  justify-content: center;
`

export const FlexRow = styled.div<{ space?: string }>`
  display:flex;
  flex-direction: row;
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
  max-width: 60rem;
  margin: auto;
  font-size: 1.4em;
  min-height: 80vh;
  padding: 1em;
  h2 {
    margin-bottom: 1em;
  }
`

export const NarrowSection = styled.div`
  margin:auto;
  max-width: 65rem;
`

export const MinimalPage = styled.div`
  margin: 0.5em;
  min-height: 80vh;
`

export const fullFluidUrl = (aboutImg: FluidObject) =>
  uri(safeLocation()?.href ?? 'https://transparency.tube').with({ path: [aboutImg?.src] }).url