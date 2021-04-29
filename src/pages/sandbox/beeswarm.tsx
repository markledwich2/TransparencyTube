import React, { FunctionComponent as FC } from 'react'
import ContainerDimensions from 'react-container-dimensions'
import Layout from '../../components/Layout'
import { NarrativeBubbles, useNarrative } from '../../components/NarrativeBubbles'


const VideoBee: FC<{}> = () => {
  return <></>
}

const BeeSwarm = () => {
  const narrative = useNarrative('Vaccine Personal',
    { startDate: new Date(2020, 1 - 1, 25), endDate: new Date(2021, 4 - 1, 30) },
    null, 'narrative2')
  return <Layout>
    <NarrativeBubbles {...narrative} />
  </Layout>
}

export default BeeSwarm