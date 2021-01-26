import React, { useEffect, useState } from 'react'
import ContainerDimensions from 'react-container-dimensions'
import { indexBy } from 'remeda'
import { blobIndex, BlobIndex } from '../../common/BlobIndex'
import { Channel, getChannels } from '../../common/Channel'
import { Rec } from '../../common/Personalization'
import Layout from '../../components/Layout'
import { PersonalizationVenn, RecVennKey } from '../../components/PersonalizationVenn'
import { loadRecData, RecState } from '../personalization'

const VennSandbox = () => {
  const [chans, setChannels] = useState<Record<string, Channel>>()
  const [rs, setRecState] = useState<RecState>(null)

  useEffect(() => {
    getChannels().then(chans => setChannels(indexBy(chans, c => c.channelId)))
    blobIndex<Rec, RecVennKey>("us_recs").then(ids => loadRecData(ids, {})).then(setRecState)
  }, [])

  return <Layout>
    <ContainerDimensions>
      {({ width, height }) => rs && <PersonalizationVenn channels={chans} sets={rs.sets} width={width} videos={rs.byId} />}
    </ContainerDimensions>
  </Layout>
}

export default VennSandbox