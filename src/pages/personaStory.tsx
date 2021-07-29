
import { OnStepProps } from '../components/scrollama/Scrollama'
import React, { useState, useCallback } from 'react'
import Layout from '../components/Layout'
import { MinimalPage } from '../components/Style'
import { PersonaSeen } from '../components/persona/PersonaSeen'
import { useQuery } from '../common/QueryString'
import { PrefixAll } from '../common/Types'
import { usePersona } from '../common/Persona'
import { BarFilter } from '../components/persona/PersonaBar'
import { PersonaStoryVenn } from '../components/persona/PersonaStoryVenn'
import { sections } from '../components/persona/personaContent'
import { InlineSteps, ChartWithSteps, StepRunCfg } from '../components/persona/PersonaSteps'

type QueryState = {
  label?: string
  vennChannelIds?: string[]
  vennAccounts?: string[]
  vennLabel?: string
  vennDay?: string
  openWatch: string
  openFeed: string
} & PrefixAll<BarFilter, 'rec'> & PrefixAll<BarFilter, 'feed'>

type StepState = StepRunCfg & { progress?: number }

const ScrollamaDemo = () => {
  const [step, setStep] = useState<StepState>(null)
  const [q, setQuery] = useQuery<QueryState>()

  const persona = usePersona()
  const { chans, loaded, recState, watch } = persona

  const showPersona = step && (step.section == 'watch' && (step.i == 0 && step.progress >= 0.7 || step.i >= 1))
  const onStepProgress = useCallback(({ data, progress }: OnStepProps<StepRunCfg>) => { setStep({ ...data, progress }) }, [])

  console.log('step progress', step)

  return <Layout>
    <MinimalPage>
      {loaded && <ChartWithSteps
        name='watch'
        steps={sections.watch}
        onStepProgress={onStepProgress}
        chartStyle={{ filter: showPersona ? null : 'blur(20px)', transition: '500ms filter linear' }}
      >
        <PersonaSeen seen={watch} verb='watched' showSeen={openWatch => setQuery({ openWatch })} channels={chans} />
      </ChartWithSteps>}

      {recState && <>
        <InlineSteps steps={sections.vennIntro} />
        <ChartWithSteps name='venn' steps={sections.venn} onStepProgress={onStepProgress} >
          <PersonaStoryVenn {...persona} setQuery={setQuery} />
        </ChartWithSteps>
      </>
      }
    </MinimalPage>
  </Layout >
}

export default ScrollamaDemo
