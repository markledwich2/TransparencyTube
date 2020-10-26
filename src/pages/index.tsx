import React from "react"

import Layout from "../components/Layout"
import { ChannelVideoViewsPage } from '../components/ChannelVideoViews'
import SEO from '../components/SEO'
import { Footer } from '../components/Footer'
import { fullFluidUrl, getAboutImg } from './about'
import styled from 'styled-components'

const PurposeDiv = styled.div`
  background-color:var(--bg-feature);
  color:#eee;
  padding:2em;
  font-size:2em;
  margin-bottom:1em;
  background-image:url('/bubble-bg.svg');
  background-repeat: no-repeat;
  background-position: right;
  background-blend-mode: 
  h2 {
    color:var(--fg-feature2);
    font-size:1.5em;
    font-weight: 300;
    margin-bottom: 1em;
  }
`

const IndexPage = () => {
  const aboutImg = getAboutImg()

  return (
    <Layout>
      <SEO title="transparency.tube" image={fullFluidUrl(aboutImg)} />
      <PurposeDiv>
        <h2>A Window into Culture and Politics on YouTube</h2>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum      </PurposeDiv>
      <ChannelVideoViewsPage />
      <Footer />
    </Layout>
  )
}

export default IndexPage
