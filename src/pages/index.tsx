import React from "react"

import Layout from "../components/Layout"
import { ChannelVideoViewsPage } from '../components/ChannelVideoViews'
import SEO from '../components/SEO'
import { Footer } from '../components/Footer'
import styled from 'styled-components'
import AboutImage from '../images/ttube-about.jpg'

const PurposeDiv = styled.div`
  background-color:var(--bg-feature);
  color:#eee;
  padding:2em;
  font-size:1.7em;
  margin-bottom:1em;
  background-image:url('/bubble-bg.svg');
  background-repeat: no-repeat;
  background-position: right;
  h2 {
    color:var(--fg-feature2);
    font-size:1.3em;
    font-weight: 300;
    margin-bottom: 1em;
  }
`

const IndexPage = () => {

  return (
    <Layout>
      <SEO title="transparency.tube" image={AboutImage} />
      <PurposeDiv>
        <h2>A Window into Culture and Politics on YouTube</h2>
        YouTube is used by 71% of Americans and a source of news for 26% of US adults. While the impact of YouTube continues to grow, options for understanding the content and ideas being shared on the platform are lacking. That is why we built Transparency.tube. In creating a first-of-its-kind effort to categorize, index, and analyze over 8,000 of the largest English language YouTube channels actively discussing political and cultural issues, we aim to provide the data necessary to better understand this space.
      </PurposeDiv>
      <ChannelVideoViewsPage />
      <Footer />
    </Layout>
  )
}

export default IndexPage
