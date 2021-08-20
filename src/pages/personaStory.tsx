
import { OnStepProps } from '../components/scrollama/Scrollama'
import React, { CSSProperties, useCallback, useMemo } from 'react'
import Layout from '../components/Layout'
import { MinimalPage } from '../components/Style'
import { PersonaSeen, PersonaSeenPopup } from '../components/persona/PersonaSeen'
import { useQuery } from '../common/QueryString'
import { PrefixAll } from '../common/Types'
import { usePersona, usePersonaRecs } from '../common/Persona'
import PersonaBar from '../components/persona/PersonaBar'
import { PersonaStoryVenn } from '../components/persona/PersonaStoryVenn'
import { getStoryState, sections, StepState } from '../components/persona/personaContent'
import { InlineSteps, ChartWithSteps } from '../components/persona/PersonaSteps'
import { pick } from 'remeda'
import styled from 'styled-components'
import { toJson } from '../common/Utils'
import { format } from 'd3'
import { useStateRef } from '../common/UseStateRef'
import { BarFilter } from '../components/persona/PersonaBarUse'
import { keys } from '../common/Pipe'
import { PersonaTable } from '../components/persona/PersonaTable'

export type PersonaStoryState = {
  label?: string
  vennChannelIds?: string[]
  vennAccounts?: string[]
  vennLabel?: string
  vennDay?: string
  openWatch?: string
  openFeed?: string
} & PrefixAll<BarFilter, 'rec'> & PrefixAll<BarFilter, 'feed'>

const progFormat = format("0.1f")
const stepEqualString = (step: StepState, progress?: number) => !step ? '' : toJson({ ...pick(step, ['section', 'name']), p: progress && progFormat(progress) })

const PersonaStory = () => {
  const [step, setStep, stepRef] = useStateRef<StepState>(null)
  const onStepProgress = useCallback(({ data, progress }: OnStepProps<StepState>) => {
    const prev = stepEqualString(stepRef.current, stepRef.current?.progress)
    const next = stepEqualString(data, progress)
    if (prev == next) return
    setStep({ ...data, progress })
  }, [])

  const [q, setQuery] = useQuery<PersonaStoryState>()

  const story = useMemo(() => getStoryState(step), [step])
  const storyPersona = usePersona({
    filter: story.venn.filter,
    channelSample: story.venn.sample,
    sampleFilter: story.venn.sampleFilter,
    preLoadSamples: story.vennExplore.preLoad ? story.venn.samples : null
  })
  const exploreRecState = usePersonaRecs(
    storyPersona.recIdx, storyPersona.chans, // use the index and channels form story
    pick(q, ['vennLabel', 'vennChannelIds', 'vennAccounts', 'vennDay'])) // use filters from query state
  const commonVennProps = pick(storyPersona, ['chans', 'personaMd'])
  console.log('step progress', progFormat(story.sectionProgress), { section: step?.section, name: step?.name, ...story })

  const suspendWatch = story.sectionProgress > 2.5
  const commonStepProps = { onStepProgress }

  return <Layout>
    <MinimalPage>
      <ChartWithSteps
        name='watch'
        steps={sections.watch}
        textTop={0.4}
        chartStyle={{
          display: 'flex',
          filter: !story.watch.showHistory ? 'blur(20px)' : null,
          transition: '500ms filter linear',
          minHeight: '100vh'
        }}
        {...commonStepProps}
      >
        {useMemo(() => <PersonaSeen
          seen={storyPersona?.watch}
          verb='watched'
          showSeen={openWatch => setQuery({ openWatch })}
          channels={storyPersona?.chans}
          suspend={suspendWatch} />
          , [storyPersona?.watch, storyPersona?.chans, suspendWatch])}
      </ChartWithSteps>

      <InlineSteps steps={sections.vennIntro} {...commonStepProps} />
      <ChartWithSteps
        name='venn'
        steps={sections.venn}
        {...commonStepProps}
      >
        <TransitionSvgStyle>
          {useMemo(() => <PersonaStoryVenn {...commonVennProps} recState={storyPersona?.recState} hideFilters />
            , [storyPersona?.recState, storyPersona?.chans, storyPersona?.personaMd])}
        </TransitionSvgStyle>
      </ChartWithSteps>
      <InlineSteps steps={sections.vennExplore} {...commonStepProps} />
      <TransitionSvgStyle>
        {useMemo(() =>
          <PersonaStoryVenn {...commonVennProps} recState={exploreRecState} setQuery={setQuery} />
          , [exploreRecState, storyPersona?.chans])}
      </TransitionSvgStyle>

      <InlineSteps steps={sections.recsAnalysis} {...commonStepProps} />

      <InlineSteps steps={sections.recsIntro} {...commonStepProps} />
      {useMemo(() =>
        <ChartWithSteps
          name='recs'
          steps={sections.recs}
          {...commonStepProps}
        >
          <ChartStepStyle>
            <PersonaBar
              filter={story.recs?.barFilter}
              style={centeredChartStyle}
              colPanelStyle={{ minWidth: '10em', maxWidth: '20em' }}
              noLoad={!story.recs.preLoad}
            />
          </ChartStepStyle>
        </ChartWithSteps>
        , [story.recs?.barFilter, story.recs.preLoad])}

      <InlineSteps steps={sections.recsTableIntro} {...commonStepProps} />

      <ChartWithSteps
        name='recsTable'
        steps={sections.recsTable}
        {...commonStepProps}
      >
        <ChartStepStyle >
          <PersonaTable style={centeredChartStyle} />
        </ChartStepStyle>
      </ChartWithSteps>

      <PersonaSeenPopup verb='watched' isOpen={q.openWatch != null} onClose={() => setQuery({ openWatch: undefined })}
        account={q.openWatch} channels={storyPersona.chans} useSeen={storyPersona.watch} />
    </MinimalPage>
  </Layout>
}

const centeredChartStyle: CSSProperties = {
  minHeight: '90vh',
  display: 'flex', alignItems: 'center', flexDirection: 'column', justifyContent: 'center'
}

const TransitionSvgStyle = styled.div`
  svg * {
      transition:300ms all
  }
`

const ChartStepStyle = styled(TransitionSvgStyle)`
  display: flex;
  justify-content: center;
`

export default PersonaStory
