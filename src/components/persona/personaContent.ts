import { pick, range } from 'remeda'
import { VennFilter } from '../../common/Persona'
import { takeSample } from '../../common/Pipe'
import { PersonaStoryState } from '../../pages/personaStory'
import { createStepSections, StepCfg, StepRunCfg } from './PersonaSteps'


const vennFilters = {
  cultureWar: { vennAccounts: ['AntiSJW', 'SocialJustice', 'Fresh'] },
  bubbled: { vennAccounts: ['MRA', 'LateNightTalkShow', 'Fresh'] },
}


const randomVideos = takeSample(range(0, 200), 20)

//        `Both the video and the personalization impact the recommendations, so let's look at some random videos to get more perspective`
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
      txt: `Here are *Social Justice* and *Anti-Woke* personas watching the same videos.`,
      vennFilter: vennFilters.cultureWar,
    },
    election4: {
      txt: `Now *Lat Night Talk Show* and *Manosphere* personas. These are the most "bubbled" groups of our persona's.`,
      vennFilter: vennFilters.bubbled,
    },
    randomIntro: {
      txt: [`So that was just one video. To get a wider perspective on recommendations, here are a selection of random videos`],
      vennFilter: {}
    },
    random: {
      txt: range(1, 21).map(i => `**${i}** / ${randomVideos.length}`),
      style: { paddingBottom: '25vh', width: 'fit-content' }
    }
  },
  vennExplore: {
    explore: {
      txt: `Use the filter controls now shown above to explore recommendations shown to any combination of channels and persona's`
    }
  },
  recs: {
    intro: {
      txt: `This is the overall stats for recommendations`
    }
  }
}

type StepExtra = { vennFilter?: VennFilter, showVenFilter?: boolean }
export type StepState = StepRunCfg & StepExtra & { progress?: number }
export const sections = createStepSections<keyof typeof sectionCfg, StepExtra>(sectionCfg)

export const getStoryState = (step: StepState) => {
  const { section, name, i, progress, vennFilter } = (step ?? {})
  const path = `${section}|${name}`
  return {
    watch: {
      showHistory: path != 'watch|intro' || progress > 0.3,
    },
    venn: {
      filter: vennFilter,
      sample: name == 'random' ? i + 1 : null
    }
  }
}
