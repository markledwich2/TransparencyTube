import React from "react"

import Layout from "../components/Layout"
import SEO from "../components/SEO"
import { ChannelVideoViewsPage } from '../components/ChannelVideoViews'

const IndexPage = () => (
  <Layout>
    <SEO title="transparency.tube" />
    <ChannelVideoViewsPage />
  </Layout>
)

export default IndexPage
