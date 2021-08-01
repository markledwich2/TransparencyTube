
import { OnStepProps } from '../components/scrollama/Scrollama'
import React, { useState, useCallback } from 'react'
import Layout from '../components/Layout'
import { MinimalPage } from '../components/Style'
import { PersonaSeen, PersonaSeenPopup } from '../components/persona/PersonaSeen'
import { useQuery } from '../common/QueryString'
import { PrefixAll } from '../common/Types'
import { usePersona, usePersonaRecs } from '../common/Persona'
import PersonaBar, { BarFilter, useBarData } from '../components/persona/PersonaBar'
import { PersonaStoryVenn } from '../components/persona/PersonaStoryVenn'
import { getStoryState, sections, StepState } from '../components/persona/personaContent'
import { InlineSteps, ChartWithSteps, StepRunCfg, StepCfg } from '../components/persona/PersonaSteps'
import { pick } from 'remeda'
import styled from 'styled-components'
import { assign } from '../common/Utils'

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
  const storyPersona = usePersona({ filter: story.venn.filter, channelSample: story.venn.sample })
  const { recIdx, chans, loaded, watch, recState } = storyPersona
  const exploreRecState = usePersonaRecs(recIdx, chans, pick(q, ['vennLabel', 'vennChannelIds', 'vennAccounts', 'vennDay']))
  const onStepProgress = useCallback(({ data, progress }: OnStepProps<StepState>) => { setStep({ ...data, progress }) }, [])
  const commonVennProps = pick(storyPersona, ['chans', 'personaMd'])
  const barData = useBarData()
  const commonBarData = pick(barData, ['tags', 'months'])
  const barRecs = barData.recs ? { stats: barData.recs, ...commonBarData } : null
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
          <TransitionSvgStyle>
            <PersonaStoryVenn {...commonVennProps} recState={recState} hideFilters />
          </TransitionSvgStyle>
        </ChartWithSteps>
        <InlineSteps steps={sections.vennExplore} />
        <TransitionSvgStyle>
          {exploreRecState && <PersonaStoryVenn {...commonVennProps} recState={exploreRecState} setQuery={setQuery} />}
        </TransitionSvgStyle>
      </>}

      {barRecs && <>
        <ChartWithSteps
          name='venn'
          steps={sections.recs}
          onStepProgress={onStepProgress}
        >
          <TransitionSvgStyle>
            <PersonaBar data={barRecs} filter={{ accounts: q.recAccounts, period: q.recPeriod, tags: q.recTags }} />
          </TransitionSvgStyle>
        </ChartWithSteps>
      </>}

      <PersonaSeenPopup verb='watched' isOpen={q.openWatch != null} onClose={() => setQuery({ openWatch: undefined })} account={q.openWatch} channels={chans} useSeen={watch} />
    </MinimalPage>
  </Layout >
}

const TransitionSvgStyle = styled.div`
  svg * {
      transition:300ms all
  }
`

export default ScrollamaDemo


