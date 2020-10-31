import _ from 'lodash'
import React, { useEffect, useState } from "react"
import { channelMd } from '../common/Channel'
import { getViewsIndexes, ViewsIndexes } from '../common/RecfluenceApi'
import { MeasureOption } from '../components/ChannelViewsPage'
import { Footer } from '../components/Footer'
import { InlineSelect } from '../components/InlineSelect'
import Layout from '../components/Layout'
import { PeriodSelect, StatsPeriod } from '../components/Period'


const SandboxPage = () => {
  const [indexes, setIndexes] = useState<ViewsIndexes>(null)
  const [period, setPeriod] = useState<StatsPeriod>(null)

  useEffect(() => {
    getViewsIndexes().then(i => {
      setIndexes(i)
      setPeriod(i?.periods[0])
    })
  }, [])

  return (
    <Layout>
      <h3>Select period {indexes && <PeriodSelect periods={indexes.periods} period={period} onPeriod={p => setPeriod(p)} />}
      measures
      <InlineSelect
          options={channelMd.measures.values}
          selected='views'
          itemRender={MeasureOption}
        />
      </h3>
    </Layout>
  )
}

export default SandboxPage