import _ from 'lodash'
import React from "react"
import { InlineSelect } from '../components/InlineSelect'
import Layout from "../components/Layout"
import SEO from "../components/SEO"
import { ChannelVideoViewsPage } from '../components/ChannelVideoViews'


const measures = {
  all: { label: 'views (total)' },
  last7: { label: 'views in the last 7 days' }
}
type measureKey = keyof typeof measures
const measureOptions = Object.entries(measures).map(([k, m]) => ({ value: k as measureKey, label: m.label }))



const SandboxPage = () => (
  <Layout>
    <SEO title="Home" />
    <p>Here is an <InlineSelect<measureKey> options={measureOptions} value='all' /> that can go inside text</p>
  </Layout>
)

export default SandboxPage