import React, { useEffect, useState } from 'react'
import ReactResizeDetector from 'react-resize-detector'
import { indexBy } from 'remeda'
import { blobIndex, BlobIndex } from '../../common/BlobIndex'
import { Channel, getChannels } from '../../common/Channel'
import { loadRecData, Rec, RecState } from '../../common/Persona'
import Layout from '../../components/Layout'
import { PersonaVenn, RecVennKey } from '../../components/persona/PersonaVenn'

const VennSandbox = () => {
  const [chans, setChannels] = useState<Record<string, Channel>>()
  const [rs, setRecState] = useState<RecState>(null)

  useEffect(() => {
    getChannels().then(chans => setChannels(indexBy(chans, c => c.channelId)))
    blobIndex<Rec, RecVennKey>("us_recs").then(ids => loadRecData(ids, {})).then(setRecState)
  }, [])

  return <Layout>
    <ReactResizeDetector>
      {({ width, height }) => rs && <PersonaVenn channels={chans} sets={rs.sets} width={width} videos={rs.byId} />}
    </ReactResizeDetector>
  </Layout>
}

export default VennSandbox