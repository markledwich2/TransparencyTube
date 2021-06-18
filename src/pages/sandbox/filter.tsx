import React, { useEffect, useState, FunctionComponent as FC } from 'react'
import Layout from '../../components/Layout'
import { FilterState, FilterTableMd, InlineValueFilter } from '../../components/ValueFilter'
import { pickFull } from '../../common/Pipe'
import { md } from '../../common/Channel'

interface VidRow {
  keywords?: string
  tags?: string
}

type Filter = FilterState<VidRow>

const FilterTest: FC<{}> = () => {

  const rows = [
    { keywords: ['5g'], tags: ['comcast', '5g'] },
    { keywords: ['Person A'], tags: ['comcast', '5g'] },
  ]

  const [filter, setFilter] = useState<Filter>({})

  const videoMd: FilterTableMd = {
    ...md.video,
    tags: {
      ...md.video.tags,
      singleSelect: true
    }
  }

  console.log('md', videoMd)

  return <Layout>
    <InlineValueFilter metadata={videoMd} filter={pickFull(filter, ['keywords', 'tags'])}
      onFilter={f => setFilter(f)}
      rows={rows}
      display='buttons'
    />
    <InlineValueFilter metadata={videoMd} filter={pickFull(filter, ['keywords', 'tags'])}
      onFilter={f => setFilter(f)}
      rows={rows}
    />
  </Layout>
}
export default FilterTest