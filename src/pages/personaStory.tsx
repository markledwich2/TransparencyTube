
import { OnStepProps } from '../components/scrollama/Scrollama'
import React, { useState, useCallback } from 'react'
import Layout from '../components/Layout'
import { MinimalPage } from '../components/Style'
import { PersonaSeen, PersonaSeenPopup } from '../components/persona/PersonaSeen'
import { useQuery } from '../common/QueryString'
import { PrefixAll } from '../common/Types'
import { usePersona } from '../common/Persona'
import { BarFilter } from '../components/persona/PersonaBar'
import { PersonaStoryVenn } from '../components/persona/PersonaStoryVenn'
import { getStoryState, sections, StepState } from '../components/persona/personaContent'
import { InlineSteps, ChartWithSteps, StepRunCfg, StepCfg } from '../components/persona/PersonaSteps'
import { pick } from 'remeda'
import styled from 'styled-components'

export type PersonaStoryState = {
  label?: string
  vennChannelIds?: string[]
  vennAccounts?: string[]
  vennLabel?: string
  vennDay?: string
  openWatch?: string
  openFeed?: string
} & PrefixAll<BarFilter, 'rec'> & PrefixAll<BarFilter, 'feed'>



const ScrollamaDemo = () => {
  const [step, setStep] = useState<StepState>(null)
  const [q, setQuery] = useQuery<PersonaStoryState>()

  const story = getStoryState(step)
  const persona = usePersona({ filter: story.venn.filter })
  const { chans, loaded, watch, recState } = persona
  const onStepProgress = useCallback(({ data, progress }: OnStepProps<StepState>) => { setStep({ ...data, progress }) }, [])

  console.log('step progress', { section: step?.section, prog: step?.i + step?.progress, name: step?.name, ...story })

  return <Layout>
    <MinimalPage>
      {loaded && <ChartWithSteps
        name='watch'
        steps={sections.watch}
        textTop={0.4}
        onStepProgress={onStepProgress}
        chartStyle={{ filter: story.watch.showHistory ? null : 'blur(20px)', transition: '500ms filter linear' }}
      >
        <PersonaSeen seen={watch} verb='watched' showSeen={openWatch => setQuery({ openWatch })} channels={chans} />
      </ChartWithSteps>}

      {recState && <>
        <InlineSteps steps={sections.vennIntro} />
        <ChartWithSteps
          name='venn'
          steps={sections.venn}
          onStepProgress={onStepProgress}
        >
          <ChartStyle>
            <PersonaStoryVenn {...pick(persona, ['chans', 'personaMd'])}
              recState={recState}
              setQuery={setQuery}
              hideFilters={!story.venn.showFilters} />
          </ChartStyle>
        </ChartWithSteps>
      </>
      }
      <PersonaSeenPopup verb='watched' isOpen={q.openWatch != null} onClose={() => setQuery({ openWatch: undefined })} account={q.openWatch} channels={chans} useSeen={watch} />
    </MinimalPage>
  </Layout >
}

const ChartStyle = styled.div`
  svg * {
      transition:300ms all
  }
`

export default ScrollamaDemo


