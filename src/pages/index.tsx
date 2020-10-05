import React from "react"

import Layout from "../components/Layout"
import { ChannelVideoViewsPage } from '../components/ChannelVideoViews'
import SEO from '../components/SEO'
import { Footer } from '../components/Footer'

const IndexPage = () => (
  <Layout>
    <SEO title="transparency.tube" />
    <ChannelVideoViewsPage />
    <Footer />
  </Layout>
)

export default IndexPage
