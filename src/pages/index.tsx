import React from "react"

import Layout from "../components/Layout"
import { ChannelVideoViewsPage } from '../components/ChannelVideoViews'
import SEO from '../components/SEO'
import { Footer } from '../components/Footer'
import { fullFluidUrl, getAboutImg } from './about'

const IndexPage = () => {
  const aboutImg = getAboutImg()

  return (
    <Layout>
      <SEO title="transparency.tube" image={fullFluidUrl(aboutImg)} />
      <ChannelVideoViewsPage />
      <Footer />
    </Layout>
  )
}

export default IndexPage
