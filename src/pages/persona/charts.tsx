import React from 'react'
import { usePersona, usePersonaRecs } from '../../common/Persona'
import Layout from '../../components/Layout'
import PersonaBar from '../../components/persona/PersonaBar'
import { PersonaTable } from '../../components/persona/PersonaTable'
import { MinimalPage } from '../../components/Style'

const PersonaCharts = () => {
  const storyPersona = usePersona({})

  const chartStyle = { marginTop: '2em' }

  return <Layout><MinimalPage>
    <PersonaBar style={chartStyle} filter={{}} />
    <PersonaTable style={chartStyle} filter={{ source: ['rec'] }} measure={'pctOfAccountRecs'} />
    <PersonaTable style={chartStyle} filter={{ source: ['feed'] }} measure={'pctOfAccountRecs'} />
    <PersonaTable style={chartStyle} filter={{ source: ['rec'] }} measure={'vsFreshPp'} />
  </MinimalPage></Layout>
}

export default PersonaCharts