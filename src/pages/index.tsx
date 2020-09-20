import React from "react"
import { Link } from "gatsby"

import Layout from "../components/layout"
import SEO from "../components/seo"
import { ViewsByTagPage } from '../components/ViewsByTag'

const IndexPage = () => (
  <Layout>
    <SEO title="transparency.tube" />
    <ViewsByTagPage />
  </Layout>
)

export default IndexPage
