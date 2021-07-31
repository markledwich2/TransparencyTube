import { pick } from 'remeda'
import { VennFilter } from '../../common/Persona'
import { PersonaStoryState } from '../../pages/personaStory'
import { createStepSections, StepCfg, StepRunCfg } from './PersonaSteps'


const vennFilters = {
  default: { vennAccounts: ['Fresh', 'PartisanLeft', 'PartisanRight'] },
  partisanAndCulture: { vennAccounts: ['PartisanRight', 'AntiSJW', 'PartisanLeft', 'SocialJustice'] },
  topViewed: { vennLabel: 'Top Viewed' }
}

const sectionCfg = {
  watch: {
    intro: {
      txt: `The video's YouTube recommends to you are personalized. \nWe created 15 personas, each with their own watch history to see how this changes the recommendations.`,
      style: { fontSize: '1.2em' }
    },
    watched: `We forced each of our 14 persona's to log in and watch videos exclusive to political category.\nEach day we chose videos at random (proportional to views) to build a persona that was currently watching within their "bubble". Here are a sample of the video's watched - click *show all* to see a persona's full watch history.`
  },
  vennIntro: {
    intro1: `We then subjected them to a shared sample of videos so we could compare them directly. For comparison, we also viewed the same videos anonymously`,
    intro2: {
      txt: `Before showing a full analysis of the results, let's explore some examples. First up are the recommendations shown to the *Partisan Left*, *Partisan Right* and an Anonymous persona's when watching the **1st Presidential Debate 2020**. You can easily see how much overlap there is between the personas - both their history and the video being watched influences the recommendations`
    }
  },
  venn: {
    election: {
      txt: `Recommendations seen on the Presidential Debate video show only a minor influence from personalization. The *Partisan Right* persona saw the most Fox recommendations and is the only persona shown where to see *Sky news* and some other right leaning channels. The *Partisan left* persona saw the most amount of left-new and late night talk shows. Between these two persona's, they shared about half of the recommendations.`,
      style: { paddingTop: '90vh' }
    },
    election3: {
      txt: [`Now here are the same videos comparing the *Social Justice* and *Anti-Woke* personas as well, without the *Anonymous* account`,
        `That's just one mainstream news videos, let's look at some random videos to get more perspective`
      ],
      vennFilter: vennFilters.partisanAndCulture
    },
    random: {
      txt: `Here is the first of 10 random videos keep scrolling`,
      style: { paddingBottom: '300vh' },
      vennFilter: vennFilters.topViewed
    },
    explore: { txt: `Feel free to filter and explore the different persona's`, showVenFilter: true }
  }
}

type StepExtra = { vennFilter?: VennFilter, showVenFilter?: boolean }
export type StepState = StepRunCfg & StepExtra & { progress?: number }
export const sections = createStepSections<keyof typeof sectionCfg, StepExtra>(sectionCfg)

export const getStoryState = (step: StepState) => {
  const progress = step ? step.i + step.progress : 0
  const afterStep = (section: string, after: number) => step?.section == section && progress >= after
  return {
    watch: {
      showHistory: afterStep('watch', 0.7),
    },
    venn: {
      showFilters: step?.showVenFilter,
      filter: {
        ...(step?.vennFilter ?? vennFilters.default),
        vennSample: step?.name == 'random' ? Math.round(step.progress * 10) : null
      }
    }
  }
}
