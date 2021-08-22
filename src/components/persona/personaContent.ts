import { find, findIndex, first, flatMap, mapToObj, mapValues, range, reverse } from 'remeda'
import { VennFilter } from '../../common/Persona'
import { takeSample, values } from '../../common/Pipe'
import { createStepSections, StepRunCfg } from './PersonaSteps'
import deepmerge from 'deepmerge'
import { dedent } from '../../common/Utils'
import { RecStatFilter, barMd } from './PersonaBarUse'
import { RecStatHighlight } from './PersonaTable'


const randomVideos = 8

const minStepTextStyle = { backgroundColor: 'rgb(var(--bgRgb), 0.3)', backdropFilter: 'blur(2px)', fontWeight: 'bold' }
const interestingAccounts = ['Fresh', 'PartisanLeft', 'PartisanRight', 'SocialJustice', 'AntiSJW', 'LateNightTalkShow', 'Conspiracy', 'Mainstream News', 'Non-political']

const electionDefaultFilter = { vennLabel: '1st Presidential Debate 2020', vennAccounts: ['PartisanLeft', 'PartisanRight', 'Fresh'] }

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
      style: { paddingTop: '90vh' },
      vennFilter: electionDefaultFilter,
    },
    election3: {
      txt: `Here are *Social Justice* and *Anti-Woke* personas watching the same videos.`,
      vennFilter: { ...electionDefaultFilter, vennAccounts: ['AntiSJW', 'SocialJustice', 'Fresh'] },
    },
    election4: {
      txt: `Now *Lat Night Talk Show* and *Manosphere* personas. These are the most "bubbled" groups of our persona's.`,
      vennFilter: { ...electionDefaultFilter, vennAccounts: ['MRA', 'LateNightTalkShow', 'Fresh'] },
    },
    randomIntro: {
      txt: [`So that was just one video. To get a wider perspective on recommendations, here are a selection of random videos`],
      // vennFilter: { ...electionDefaultFilter, vennAccounts: ['MRA', 'LateNightTalkShow', 'Fresh'] },
      style: { paddingBottom: '35vh' }
    },
    ...mapToObj(range(1, randomVideos + 1), i => [`random${i}`, {
      txt: `**${i}** / ${randomVideos}`,
      style: { paddingBottom: '40vh', width: 'fit-content' },
      textStyle: minStepTextStyle,
      vennFilter: { vennLabel: 'Other', vennAccounts: ['PartisanLeft', 'PartisanRight', 'Fresh'] },
      vennSample: i
    }])
  },
  vennExplore: {
    explore: {
      txt: `Use the filter controls now shown above to explore recommendations shown to any combination of channels and persona's. Lick **RANDOM** to see a random channels recommendations.`,
      vennFilter: { vennLabel: 'Other' }
    }
  },
  recsAnalysis: {
    intro: dedent`## Influence of Personalization
    
    Here are some overall measures influence of personalization on YouTube recommendations. We found that on average, when a persona watched the same video in the same week, only **26% of recommendations were repeated**. This is a baseline that we compare the personalization to.
    
    **Persona Personalization**
    When a persona watched the **same video as an anonymous user** within 7 days, only 16% of recommendations were repeated - **10% less repeated recommendations vs watching as the same persona**. 
    
    **Influence of video relevance**
    When a personas watch **different videos** on the same day, only 6% of recommendations were repeated - **20% less repeated recommendations vs watching the same video**.
    `
  },
  recsIntro: {
    intro: {
      txt: dedent`Now we'll be looking at the overall recommendations shown broken down by which political leaning they are towards.
      - **% of persona recommendations**: the percent of all recommendations show to this persona. Note that these add up to more than 100% because recommended video categories overlap with each other (e.g. a video's channel can be bother *MSM* and *Partisan Left*).
      - **vs video views**: \`[% of recommendations] - [% of total video views]\`. This is for comparison vs a simple/neural algorithm which would recommend proportional to views.
      - **vs anonymous**: \`[% of recommendations] - [% equivalent anonymous recommendations]\`. A comparison to a user which is not logged in.
      We will start with recommendations show to the  *Anonymous* persona then move though a sample of the others.`,
      style: { paddingTop: '5em' }
    }
  },
  recs: {
    intro: {
      txt: `Most **Anonymous** recommendations are towards **Non-Political** and **Mainstream News**. The most favoured category is **Partisan Left** when compared to the views to those videos. With this as a baseline, how does personalization impact this? `,
      barFilter: { accounts: ['Fresh'], tags: interestingAccounts },
      style: { paddingTop: '90vh', paddingBottom: '90vh' }

    },
    ...mapToObj([
      [`PartisanLeft`, `Personalization means that *Partisan Left* persona sees their favorite category 21%-points more compared to the anonymous viewer. The other categories are less impacted, surprisingly *Mainstream News* received 12% less despite mainly being left-leaning.`],
      ['PartisanRight', `*Partisan right* videos are shown their own category of video 11% more than anonymous, with *Mainstream news*, *Partisan left* and *Social Justice* video's being shown less often`],
      //['SocialJustice', `*Social Justice* within-bubble recommendations are 18% more than an anonymous viewer`],
      //['AntiSJW', `*Anti-Woke* within-bubble recommendations are 13% more than an anonymous viewer. They receive 16% more to *Non-political* news, which is more than the within-bubble personalization.`],
      //['LateNightTalkShow', `The *Late night talk show* persona's within-bubble recommendations are 41% more than the anonymous viewer - by far the most dramatic personalization of all the persona's. It's not clear that YouTube is treating this content differently, it could be that because the amount of video's within this bubble is very small, so the algorithm might perceive a stronger signal is what the persona watched compared to the others.`],
      ['Conspiracy', `*Conspiracy* within-bubble recommendations are only is only 1.9% higher than an anon viewer. They saw 16% more recommendations towards *Non-political* videos.`]
    ], ([a, txt]) => [a, {
      txt,
      barFilter: { accounts: [a], tags: interestingAccounts }
    }])
  },
  recsTableIntro: {
    intro: {
      txt: dedent`Here is the same data for all persona's (left) towards videos (top). The table takes a little effort to understand, but is easier to spot patterns.`,
      style: { paddingTop: '20vh' }
    }
  },
  recsTable: {
    recIntro: {
      txt: `First up, we are looking at the ${barMd.measures.vsFreshPp.title} on video recommendations`,
      style: { paddingTop: '90vh' },
      tableFilter: { source: ['rec'] } as RecStatFilter,
      tableHighlight: null
    },
    recMsm: {
      txt: `The first thing that stands out is that MSM is dramatically disadvantaged by personalization. The only accounts that receive more MSM recs is the one that watched exclusively MSM. No other type of video received this disadvantage in our same 🤔`,
      tableHighlight: { toTag: ['Mainstream News'] }
    },
    recSelf: {
      txt: `Of **self-recommendations**, late night talk show's and partisan left persona's receive receive the highest self-recommending personalization. Late night shows stand out. Potentially they are favoured by the orlgoythm, or perhaps just because there are so few channels, the history for these persona's were more concentrated for the algorithm to pick as a signal.`,
      tableHighlight: { self: [true] }
    },
    home1: {
      txt: `On the **home page**, personalization is increased as there is no context of a video to dilute it. All persona's home page shows more less non-political content vs an anonymous user.`,
      tableFilter: { source: ['feed'] } as RecStatFilter,
      tableHighlight: { toTag: ['Non-political'] }
    },
    home2: {
      txt: `Surprisingly, even tho our persona's are watching political content, they see less mainstream news content than an anonymous user`,
      tableHighlight: { toTag: ['Mainstream News'] }
    },
    home3: {
      txt: `Self recommendations are much stronger on the home-page vs video recommendations. Late night and partisan left are similar to the other persona's, with QAnon and White Identitarian having the lowest impact from personalization.`,
      tableHighlight: { self: [true] }
    },
  }
}

type SectionName = keyof typeof sectionCfg

type StepExtra = {
  vennFilter?: VennFilter, barFilter?: RecStatFilter, showVenFilter?: boolean,
  tableHighlight?: RecStatHighlight, tableFilter?: RecStatFilter,
  vennSample?: number
}
export type StepState = StepRunCfg & StepExtra & { progress?: number }
export const sections = createStepSections<SectionName, StepExtra>(sectionCfg)

export type StoryState = ReturnType<typeof getStoryState>

export const getSectionProgress = (s: StepState) => !s ? 0 : s.sectionIndex + s.stepPct + (1 / sections[s.section]?.length) * s.progress

export const getStoryState = (step: StepState) => {
  step ??= {} as StepState

  const sectionProgress = getSectionProgress(step) // e.g. step 1/4 in section 2 = 2.25
  const preLoad = (sectionName: SectionName, buffer?: number) => sectionProgress > first(sections[sectionName]).sectionIndex - (buffer ?? 1.1)
  const defaultState = mapValues(sections, (_, section) => ({ preLoad: preLoad(section) }))
  const smear = <T>(getValue: (s: StepState) => T, dir?: 'up' | 'down') => smearValue(step, getValue, dir)

  const customState = {
    step,
    watch: {
      showHistory: sectionProgress > 0.3,
    },
    venn: {
      filter: smear(s => s.vennFilter),
      sampleFilter: { vennLabel: 'Other' },
      sample: smear(s => s.vennSample, 'up'), // only smear from above
      samples: randomVideos
    },
    recs: {
      barFilter: smear(s => s.barFilter) ?? { accounts: ['Fresh'] }
    },
    recsTable: {
      tableHighlight: smear(s => s.tableHighlight),
      tableFilter: smear(s => s.tableFilter)
    },
    sectionProgress
  }
  const res = deepmerge(defaultState, customState)
  return res
}

/** returns the first value that has been defined, starting with the given step, then looking up, then looking down */
const smearValue = <T>(step: StepState, getValue: (s: StepState) => T, dir?: 'up' | 'down') => {
  const v = getValue(step)
  if (v !== undefined) return v
  const stepsToLook = (!dir || dir == 'up' ? stepsFrom(step, 'up') : [])
    .concat(!dir || dir == 'down' ? stepsFrom(step, 'down') : [])
  for (let s of stepsToLook) {
    const v = getValue(s)
    if (v !== undefined) {
      if (s != step) console.log(`smeared value`, { v, path: `${s.section}.${s.name}` })
      return v
    }
  }
  return undefined
}

const stepPath = (step: StepState) => `${step.section}.${step.stepIndex}-${step.name}`

const stepsFromForward = flatMap(values(sections), s => s)
const stepsFromBack = reverse(stepsFromForward)

const stepsFrom = (step: StepState, dir: 'down' | 'up') => {
  const allSteps = dir == 'down' ? stepsFromForward : stepsFromBack
  const i = findIndex(allSteps, s => stepPath(s) == stepPath(step))
  if (i == -1) return []
  return allSteps.slice(i + 1).map(s => ({ ...s, dir }))
}