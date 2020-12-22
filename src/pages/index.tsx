import React from "react"
import Layout from "../components/Layout"
import { ChannelViewsPage } from '../components/ChannelViews'
import SEO from '../components/SEO'
import AboutImage from '../images/ttube-about.jpg'
import PurposeBanner from '../components/PurposeBanner'


const IndexPage = () => <Layout>
  <SEO title="transparency.tube" image={AboutImage} />
  <PurposeBanner feature>
    <h2>A Window into Culture and Politics on YouTube</h2>
    <p style={{ marginBottom: '1em' }}>
      YouTube is used by 71% of Americans and is a source of news for 26% of US adults. While the impact of YouTube continues to grow, options for understanding the content and ideas being shared on the platform are lacking. That is why we built Transparency.tube. In creating a first-of-its-kind effort to categorize, index, and analyze over 7,300 of the largest English language YouTube channels actively discussing political and cultural issues, we aim to provide the data necessary to better understand this space.
        </p>
    <p className="subtle">Note - Channel classification is based on video content, not the identity of the channel creator. Channel creators, please contact us if you think a channel has been misclassified or is missing.</p>
  </PurposeBanner>
  <ChannelViewsPage />
</Layout>

export default IndexPage
