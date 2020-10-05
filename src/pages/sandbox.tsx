import _ from 'lodash'
import React, { useState } from "react"
import { Footer } from '../components/Footer'
import Layout from '../components/Layout'

const measures = {
  all: { label: 'views (total)' },
  last7: { label: 'views in the last 7 days' }
}
type measureKey = keyof typeof measures

const SandboxPage = () => {
  const [] = useState<measureKey>('all')


  return (
    <Layout>
      <Footer />
    </Layout>
  )
}

export default SandboxPage