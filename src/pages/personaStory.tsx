
import { OnStepProps } from '../components/scrollama/Scrollama'
import React, { CSSProperties, useCallback, useMemo } from 'react'
import Layout from '../components/Layout'
import { MinimalPage } from '../components/Style'
import { PersonaSeen, PersonaSeenPopup } from '../components/persona/PersonaSeen'
import { useQuery } from '../common/QueryString'
import { PrefixAll } from '../common/Types'
import { usePersona, usePersonaRecs } from '../common/Persona'
import PersonaBar, { AccountTip } from '../components/persona/PersonaBar'
import { PersonaStoryVenn } from '../components/persona/PersonaStoryVenn'
import { getSectionProgress, getStoryState, sections, StepState, StoryState } from '../components/persona/personaContent'
import { InlineSteps, ChartWithSteps } from '../components/persona/PersonaSteps'
import { pick } from 'remeda'
import styled from 'styled-components'
import { toJson } from '../common/Utils'
import { format } from 'd3'
import { useStateRef } from '../common/Use'
import { RecStatFilter, tagMd } from '../components/persona/PersonaBarUse'
import { keys } from '../common/Pipe'
import { PersonaTable } from '../components/persona/PersonaTable'
import { Tip, useTip } from '../components/Tip'

export type PersonaStoryState = {
  label?: string
  vennChannelIds?: string[]
  vennAccounts?: string[]
  vennLabel?: string
  vennDay?: string
  openWatch?: string
  openFeed?: string
} & PrefixAll<RecStatFilter, 'rec'> & PrefixAll<RecStatFilter, 'feed'>

const progFormat = format("0.1f")
const stepEqualString = (s: StepState) => !s ? '' : [s.section, s.name, progFormat(getSectionProgress(s))].join('|')

const PersonaStory = () => {
  const [story, setStory, stepRef] = useStateRef<StoryState>(null)
  const onStepProgress = useCallback(({ data, progress }: OnStepProps<StepState>) => {
    const prevStory = stepRef.current
    const newStep = { ...data, progress }
    //console.log('onStepProgress equals', stepEqualString(prevStory?.step), stepEqualString(newStep))
    if (stepEqualString(prevStory?.step) == stepEqualString(newStep)) return
    const story = getStoryState(newStep)
    setStory(story)
    console.log('step progress', progFormat(story.sectionProgress), { ...story })
  }, [])

  const [q, setQuery] = useQuery<PersonaStoryState>()


  const venn = story?.venn
  const storyPersona = usePersona({
    filter: venn?.filter,
    channelSample: venn?.sample,
    sampleFilter: venn?.sampleFilter,
    preLoadSamples: story?.vennExplore.preLoad ? story.venn.samples : null
  })
  const exploreRecState = usePersonaRecs(
    storyPersona.recIdx, storyPersona.chans, // use the index and channels form story
    pick(q, ['vennLabel', 'vennChannelIds', 'vennAccounts', 'vennDay'])) // use filters from query state
  const commonVennProps = pick(storyPersona, ['chans', 'personaMd'])


  const suspendWatch = story?.sectionProgress > 2.5
  const commonStepProps = { onStepProgress }

  const accountTip = useTip<string>()
  const videoTip = useTip<string>()

  return <Layout>
    <MinimalPage>
      <ChartWithSteps
        name='watch'
        steps={sections.watch}
        textTop={0.4}
        chartStyle={{
          display: 'flex', justifyContent: 'center',
          filter: story?.watch.showHistory ? null : 'blur(20px)',
          pointerEvents: story?.watch.showHistory ? 'auto' : 'none',
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
              filter={story?.recs?.barFilter}
              style={centeredChartStyle}
              colPanelStyle={{ minWidth: '10em', maxWidth: '20em' }}
              noLoad={!story?.recs.preLoad}
              accountTip={accountTip} videoTip={videoTip}
            />
          </ChartStepStyle>
        </ChartWithSteps>
        , [story?.recs?.barFilter, story?.recs.preLoad])}

      <InlineSteps steps={sections.recsTableIntro} {...commonStepProps} />

      <ChartWithSteps
        name='recsTable'
        steps={sections.recsTable}
        {...commonStepProps}
      >
        <ChartStepStyle >
          <PersonaTable style={centeredChartStyle} highlight={story?.recsTable.tableHighlight} filter={story?.recsTable.tableFilter}
            accountTip={accountTip} videoTip={videoTip}
          />
        </ChartStepStyle>
      </ChartWithSteps>

      <PersonaSeenPopup verb='watched' isOpen={q.openWatch != null} onClose={() => setQuery({ openWatch: undefined })}
        account={q.openWatch} channels={storyPersona.chans} useSeen={storyPersona.watch} />
      <Tip {...accountTip.tipProps}>The persona (<b>{tagMd[accountTip.data]?.label}</b>) who is being shown the recommendation.<br /><br />
        <AccountTip account={accountTip.data} /></Tip>
      <Tip {...videoTip.tipProps}>The channel classification (<b>{tagMd[videoTip.data]?.label}</b>) of the recommended video.<br /><br />
        <AccountTip account={videoTip.data} /></Tip>
    </MinimalPage>
  </Layout>
}

const centeredChartStyle: CSSProperties = {
  height: '90vh',
  width: '100%',
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
