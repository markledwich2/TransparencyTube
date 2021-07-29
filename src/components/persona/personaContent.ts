import { CSSProperties } from 'react'
import { entries, mapEntries } from '../../common/Pipe'
import { createStepSections, StepCfg, StepRunCfg, StepSectionsCfg } from './PersonaSteps'
import { mapValues } from 'remeda'

export type PersonaStepCfg = StepCfg & { section: string }

const sectionCfg = {
  watch: {
    intro: `The video's YouTube recommends to you are personalized. \nWe created 15 personas, each with their own watch history to see how this changes the recommendations.`,
    watched: `We forced each of our 14 persona bots to log in and watch video's exclusive to political category.\nEach day we chose videos at random (proportional to views) to build a persona that was currently watching within their "bubble". Here are a sample of the video's watched - click *show all* to see a persona's full watch history.`
  },
  vennIntro: {
    intro1: `We then subjected them to a shared sample of videos so we could compare them directly. For comparison, we also viewed the same videos anonymously`,
    intro2: {
      txt: `Here is a venn diagram of recommendations shown to the Partisan Left, Partisan Right and an Anonymous persona's when watching the *1st Presidential Debate 2020*. You can easily see how much overlap there is between the personas`,
      style: { marginBottom: '5em' }
    },
  },
  venn: {
    random1: `Here is the first of 10 random videos. Get a sense of the ground-truth of the recommendations shown to the bots. You can change filters to see other persona's.`
  }
}

export const sections = createStepSections(sectionCfg)

// export const steps = entries