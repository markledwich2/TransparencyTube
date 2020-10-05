import { color } from 'd3'
import _ from 'lodash'
import React, { useState } from "react"
import { flatMap, indexBy, uniq } from 'remeda'
import styled from 'styled-components'
import { Channel, channelMd, ColumnValueMd } from '../common/Channel'
import { values } from '../common/Pipe'
import { Tag } from '../components/Channel'
import { InlineForm } from '../components/InlineForm'
import { InlineSelect, Opt, OptionList } from '../components/InlineSelect'
import Layout, { FlexRow } from '../components/Layout'
import SEO from '../components/SEO'


const measures = {
  all: { label: 'views (total)' },
  last7: { label: 'views in the last 7 days' }
}
type measureKey = keyof typeof measures
const measureOptions = Object.entries(measures).map(([k, m]) => ({ value: k as measureKey, label: m.label }))






const SandboxPage = () => {
  const [measure, setMeasure] = useState<measureKey>('all')


  return (
    <Layout>
      <h3>Here is an <InlineSelect<measureKey> options={measureOptions} onChange={o => setMeasure(o)} selected={measure} /> that can go inside text</h3>

    </Layout>
  )
}

export default SandboxPage