import React from "react"

import Layout from "../components/Layout"
import { ChannelVideoViewsPage } from '../components/ChannelVideoViews'
import SEO from '../components/SEO'

const IndexPage = () => (
  <Layout>
    <SEO title="transparency.tube" />
    <ChannelVideoViewsPage />
  </Layout>
)

export default IndexPage
