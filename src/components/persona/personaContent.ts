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
      txt: dedent`YouTube influences your video-watching behavior by deicing which video's to display when you open YouTube and next to other videos. 
      We created 15 personas — each with their own watch history — to see how YouTube tailors their recommendations.`,
      style: { fontSize: '1.2em' }
    },
    watched: `From Sep 2020 through to Feb 2021, we forced each of our 14 persona's to log in and watch videos exclusive to political category.\nEach day we chose recent videos from their favorite channels to build a persona that was currently watching within their "bubble". Here are a sample of the video's watched - click *show all* to see a persona's full watch history.`
  },
  vennIntro: {
    intro1: {
      txt: `We then subjected them to a common sample of videos so we could compare them directly. Video's younger than 7d were chosen at random (proportional to views) from our dataset of news/politics/culture-war channels. We also included an anonymous viewer to compare results like for like.`,
      style: { paddingTop: '10em' }
    },
    intro2: {
      txt: dedent`To help understand personalization, we will show an example video recommendations when persona's watched the **1st Presidential Debate 2020**. 
      
      Here are the recommendations shown to the *Partisan Left*, *Partisan Right* and an Anonymous persona's when watching the **1st Presidential Debate 2020**. In this venn diagram, you can see how much overlap of recommendations there are between the personas. Both their history and the video being watched influences the recommendations.`
    }
  },
  venn: {
    election: {
      txt: dedent`Recommendations seen on the Presidential Debate video show a gentle influence from personalization. 
      
      The **Partisan Right** persona saw the most Fox recommendations and is the only persona here to see Ben Shapiro, PragerU and the Regan foundation. 
      
      The **Partisan left** persona saw the most amount of left leaning news like CNN and late night talk shows. Partisan left & right shared about half of their recommendations. 
      
      The **Anonymous** persona was shown mostly MSM videos related to the presidential debate, with ABC views featured to the most.`,
      style: { paddingTop: '90vh' },
      vennFilter: electionDefaultFilter,
    },
    election3: {
      txt: `Here are *Social Justice* and *Anti-Woke* personas watching the same videos. There are similar levels of personalization to the previous personas. Most video's shown are related to the debate or the candidates, but there is usually a portion of unrelated videos from a persona's favorite channels.`,
      vennFilter: { ...electionDefaultFilter, vennAccounts: ['AntiSJW', 'SocialJustice', 'Fresh'] },
    },
    election4: {
      txt: `Lastly, the *Lat Night Talk Show* and *Manosphere* personas. These are the most "bubbled" groups of our persona's for the presidential debate recommendations (and also in general). I suspect that this is not special to the type of content, but they have less variety of channels to watch and as such they have a stronger signal to the recommendation system.`,
      vennFilter: { ...electionDefaultFilter, vennAccounts: ['MRA', 'LateNightTalkShow', 'Fresh'] },
    },
    overrides: {
      txt: `During this processI noticed that some channels, like *TEDx Talks* and the *The Obama White House*  are given a special status by YouTube and all video recommendations guaranteed to stay within the channel.`,
      vennFilter: { vennLabel: 'TED', vennAccounts: ['PartisanLeft', 'PartisanRight', 'Fresh'] }
    }
  },
  vennExplore: {
    explore: {
      txt: `If you are interested in exploring, use the filter controls to explore recommendations shown to any combination of channels and persona's. Click **RANDOM** to see a random channels recommendations. Otherwise, just keep scrolling down.`,
      vennExploreFilter: { vennLabel: 'Other' }
    }
  },
  recsAnalysis: {
    intro: {
      txt: dedent`## Overall Influence of Personalization

      #### Home page
      On the home page, the personas were presented with 34% videos from channels they had watched within their bubble - much more tailored than the up-next recommendations. This might be less than you see in your own experience because out persona's didn't subscribe to any channels which would be featured much more frequently.
      19% of video's shown to the anonymous user were towards one of the channels in our dataset (i.e. they are mainly focused on news, politics or the culture war). Our persona's were shown 47% - only minimally more than the channels shown that they had previously watched.    
      #### Up-next Videos
      When out persona's were presented up-next video recommendations, on average:
      - 16% were for channels within their bubble, 11% of those channels they had already watched
      - 16% were back to the same channel they were watching 
      - 73% were to channels they hadn't seen before

      There was plenty of variety in up-next recommendations, even for the same video. When our anonymous user watched the same video in the same week, only 16% of recommendations were repeated. When our persona's re-watched a video there were 10 percentage points more repeated recommendations - a mildly more consistent influence. When they watched **different videos** on the same day, there were 20 points less repeated recommendations vs watching the same video - showing that **the video is having a larger impact on recommendations than who is watching it**.


      `,
      style: { paddingTop: '5em' }
    }
  },
  recsIntro: {
    intro: {
      txt: dedent`## Detailed Influence of Personalization
      
      Now we'll be looking at the overall recommendations shown broken down by which political leaning they are towards.
      - **% of persona recommendations**: the percent of all recommendations show to this persona. Note that these add up to more than 100% because recommended video categories overlap with each other (e.g. a video's channel can be bother *MSM* and *Partisan Left*).
      - **vs video views**: \`[% of recommendations] - [% of total video views]\`. This is for comparison vs a simple/neural algorithm which would recommend proportional to views.
      - **vs anonymous**: \`[% of recommendations] - [% equivalent anonymous recommendations]\`. A comparison to a user which is not logged in.
     Here is a comparison of which political categories recommendations led to, starting with what was shown to an *Anonymous* user on the home page and on video recommendations.`,
      style: { paddingTop: '2em' }
    }
  },
  recs: {
    intro: {
      txt: `Most recommendations shown to an **Anonymous** user are towards **Non-Political** and **Mainstream News**. Overall, the recommendation influence is not too far from neutral when compared to the views of the channels being recommended. With this as a baseline, how does personalization impact recommendations? `,
      barFilter: { accounts: ['Fresh'], tags: interestingAccounts },
      style: { paddingTop: '90vh', paddingBottom: '90vh' }
    },
    ...mapToObj([
      [`PartisanLeft`, `The **Partisan Left** persona saw *partisan left videos* 45 percentage points more compared to an anonymous viewer on their home page, and 16 points more when watching videos. The other categories are less impacted, surprisingly *Mainstream News* received 31 points less home page recommendations despite sharing a lot of ideological overlap in content.`],
      ['PartisanRight', `The **Partisan right** persona sees *partisan right videos* 34 points more than anonymous on the home page and 9 points more on videos - less personalization than the partisan left persona.  *Mainstream news*, *Partisan left* and *Social Justice* video's are recommended less often which is to be expected.`],
      //['SocialJustice', `*Social Justice* within-bubble recommendations are 18% more than an anonymous viewer`],
      //['AntiSJW', `*Anti-Woke* within-bubble recommendations are 13% more than an anonymous viewer. They receive 16% more to *Non-political* news, which is more than the within-bubble personalization.`],
      ['LateNightTalkShow', `The *Late night talk show* persona's within-bubble recommendations are 41% more than the anonymous viewer - by far the most dramatic personalization of all the persona's. It's not clear that YouTube is treating this content differently, it could be that because the amount of video's within this bubble is very small, so the algorithm might perceive a stronger signal is what the persona watched compared to the others.`],
      ['Conspiracy', `*Conspiracy* within-bubble recommendations are 17 percentage points higher than an anonymous viewer on the home page and only 1.6 points higher on videos.`]
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
      txt: `The first thing that stands out is that MSM is dramatically disadvantaged by personalization. The *MSM* persona is the only one that received more MSM recommendations compared to an anonymous user. The most likely explanation for this is that YouTube has an explicit policy for anonymous users to increase recommendations to this type of channel.`,
      tableHighlight: { toTag: ['Mainstream News'] }
    },
    recSelf: {
      txt: `Of **self-recommendations**, late night talk show's and partisan left persona's receive receive the highest self-recommending personalization. Late night shows stand out. Potentially they are favoured by the algorithm, or perhaps just because there are so few channels, the history for these persona's were more concentrated for the algorithm to pick as a signal.`,
      tableHighlight: { self: [true] }
    },
    recWoke: {
      txt: `Partisan Left/Right and Woke video's are the most polarizing. Likely because content leaning into either side of the culture war is difficult to watch unless you agree with it - even more so than other types of content`,
      tableHighlight: { toTag: ['SocialJustice', 'PartisanRight', 'PartisanLeft'] }
    },
    home1: {
      txt: `On the **home page**, personalization is increased as there is no context of a video to dilute it. All persona's home page shows dramatically more political content compared to an anonymous user.`,
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
  },
  outro: {
    outro: {
      txt: dedent`For details about the process, and the data and code see our [GitHub page](https://github.com/markledwich2/Recfluence/tree/master/UserScrape).
    Bough to you by:
    - Anna Zaitsev, *University of California, Berkeley* - Advisor and author of study
    - Anton Laukemper, *Rijksuniversiteit Groningen* - Original idea and code for personalized data collection
    - Mark Ledwich, *Unaffiliated* - Code and analysis, data viz, author of this article
    A published paper will be available soon and this will be updated to link to that when it is ready.`,
      style: { paddingTop: '20vh', paddingBottom: '10vh' }
    }
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