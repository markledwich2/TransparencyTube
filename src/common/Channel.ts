
import { getJsonl, hoursFormat, numFormat } from './Utils'
import { indexBy, map, pipe } from 'remeda'
import { entries, orderBy, sumBy } from './Pipe'
import { blobCfg } from './Cfg'
import { ColumnMd, Opt } from './Metadata'

export interface Channel {
  channelId: string
  channelTitle: string
  description: string
  tags: string[]
  logoUrl: string
  date_to: string
  lr: string
  subs: number
  channelViews: number
  media?: string
  reviewsHuman?: number
  publicReviewerNotes?: string
  publicCreatorNotes?: string
}

export type ColumnMdOpt = Opt<keyof Channel> & { desc: string }


export const hiddenTags = ['Black', 'LGBT']

export const md = {
  channel: {
    tags: {
      label: 'Tag',
      desc: `Cultural or political classification for channel (e.g. Libertarian or  Partisan Right).
    They are tagged by either:
- Reviewers using [this method](https://github.com/markledwich2/Recfluence#soft-tags)
- Sam Clark's [predictive model](https://github.com/sam-clark/chan2vec#soft-tag-predictions)
\nNote: Each channel can have multiple tags.`,
      values: [
        { value: 'AntiSJW', label: 'Anti-Woke', color: '#8a8acb', desc: 'Significant focus on criticizing `Social Justice`  with a positive view of the marketplace of ideas and discussing controversial topics.' },
        { value: 'AntiTheist', label: 'Anti-theist', color: '#96cbb3', desc: 'Self-identified atheist who are also actively critical of religion. Also called New Atheists or Street Epistemologists. Usually combined with an interest in philosophy.' },
        { value: 'Conspiracy', color: '#e0990b', desc: 'Regularly promotes a variety of conspiracy theories or wildly unscientific beliefs (except for religious ones). Relevant only when the conspiracy/belief is connected to morality/politics or consequentially-important outcomes. \n\Example conspiracies: [Moon landings were faked](https://en.wikipedia.org/wiki/Moon_landing_conspiracy_theories), [QAnon](https://en.wikipedia.org/wiki/QAnon) & [Pizzagate](https://en.wikipedia.org/wiki/Pizzagate_conspiracy_theory), [Epstein was murdered](https://en.wikipedia.org/wiki/Death_of_Jeffrey_Epstein), [Trump-russia collusion](https://rationalwiki.org/wiki/Trump-Russia_connection).' },
        { value: 'LateNightTalkShow', label: 'Late night talk show', color: '#00b1b8', desc: 'Entertaining TV/cable talk show with topical news, guest interviews and comedy sketches. Sometimes are more entertainment than political and we are working to only include the videos that are political.' },
        { value: 'Libertarian', color: '#666', desc: 'A [political philosophy](https://en.wikipedia.org/wiki/Libertarianism) wth individual liberty as its main principal. Generally skeptical of authority and state power (e.g. regulation, taxes, government programs). Favor free markets and private ownership. Does not include libertarian socialists who also are anti-state but are anti-capitalist and promote communal living.' },
        {
          value: 'MRA', label: 'Manosphere', color: '#003e78', desc: `Content mainly focused on:
* Mens rights (e.g. [MRA](https://en.wikipedia.org/wiki/Men%27s_rights_movement), fathers rights)
* Male grievances (e.g. [MGTOW](https://en.wikipedia.org/wiki/Men_Going_Their_Own_Way) or [incels](https://en.wikipedia.org/wiki/Incel))
* Pick-up techniques
* Policing of women's sexuality (e.g. anti-[THOT](https://www.dictionary.com/browse/thot)).` },
        { value: 'Mainstream News', label: 'Mainstream News', color: '#aa557f', desc: 'Media institutions from TV, Cable or Newspaper that are also creating content for YouTube.' },
        { value: 'PartisanLeft', label: 'Partisan Left', color: '#3887be', desc: 'Mainly focused on politics and exclusively critical of Republicans. Would agree with this statement: “GOP policies are a threat to the well-being of the country“.' },
        { value: 'PartisanRight', label: 'Partisan Right', color: '#e0393e', desc: 'Mainly focused on politics and exclusively critical of Democrats. Would agree with this statement: “Democratic policies threaten the nation”.' },
        { value: 'QAnon', color: '#e55e5e', desc: 'A channel focused on [Q-Anon](https://en.wikipedia.org/wiki/QAnon). Q is a handle of someone with access to the "deep state" leaking plots against Trump and his supporters.' },
        { value: 'ReligiousConservative', label: 'Religious Conservative', color: '#41afa5', desc: 'A channel with a focus on promoting traditional major religion (i.e. Christianity, Judaism, Islam) in the context of politics and culture.' },
        { value: 'SocialJustice', label: 'Social Justice', color: '#56b881', desc: 'Focused on the problems of racism and sexism. Places a particular importance on grievances from historically oppressed identities. Skeptical of the role genetics in human behavior and concerned about speech that might cause harm. Content in reaction to Anti-SJW or conservative content.' },
        { value: 'Socialist', color: '#6ec9e0', desc: 'Focus on the problems of capitalism. Endorse the view that capitalism is the source of most problems in society. Critiques of aspects of capitalism that are more specific (i.e. promotion of fee healthcare or a large welfare system or public housing) don’t qualify for this tag. Promotes alternatives to capitalism. Usually some form of either  Social Anarchist  (stateless egalitarian communities) or Marxist (nationalized production and a way of viewing society though class relations and social conflict).' },
        { value: 'WhiteIdentitarian', label: 'White Identitarian', color: '#b8b500', desc: 'Identifies-with/is-proud-of the superiority of “whites” and western Civilization. An example of identifying with “western heritage”  would be to refer to the sistine chapel, or bach as “our culture”.Promotes or defends: An ethno-state where residence or citizenship would be limited to “whites” OR a type of nationalist that seek to maintain a white national identity (white nationalism), historical narratives focused on the “white” lineage and its superiority, Essentialist concepts of racial differences. Are concerned about whites becoming a minority population in the US.' },
        { value: 'StateFunded', label: 'State Funded', desc: '' }
      ]
    } as ColumnMd,
    lr: {
      label: 'Left/Right',
      desc: `Classification as left/center/right by either:
- Reviewers using [this method](https://github.com/markledwich2/Recfluence#leftcenterright)
- Sam Clark's [predictive model](https://github.com/sam-clark/chan2vec#chan2vec) `,
      values: [
        { value: 'L', label: 'Left', color: '#3887be' },
        { value: 'C', label: 'Center', color: '#ab82e8' },
        { value: 'R', label: 'Right', color: '#da2d2d' }
      ]
    } as ColumnMd,
    media: {
      label: 'Media',
      desc: `The channel is considered **Mainstream Media** when tagged as \`Mainstream News\`, \`Late night Talk Show\` or \`Missing Link Media\`, the rest are labeled **YouTube**. `,
      values: [
        { value: 'Mainstream Media', label: 'Mainstream Media', color: '#aa557f' },
        { value: 'YouTube', label: 'YouTube', color: '#56b881' }
      ]
    } as ColumnMd,
    measures: {
      values: [
        { value: 'channelViews', label: 'Channel Views', desc: 'The total number of channel views for all time as provided by the YouTube API.' },
        {
          value: 'views', label: 'Views', desc: `Video views within the selected period.
    *Transparency.tube* records statistics for younger-than-365-days videos for all channels each day.

Note:
- For channels with large back-catalogs, we read older videos to try and capture all the views on a day
- When new channels are added to transparency.tube, the history of views are estimated based on the upload date of videos.

Click on a channel to see more detail about the collection of video statistics.
     ` },
        {
          value: 'watchHours', label: 'Watched', format: (n: number) => hoursFormat(n), desc: `Estimated hours watch of this video. 
    This estimate is based on the [data collected](https://github.com/sTechLab/YouTubeDurationData) from [this study from 2017](https://arxiv.org/pdf/1603.08308.pdf). 
    For each video, we calculate \`*average % of video watch for this videos duration\` x \`video views\`` },
        { value: 'subs', label: 'Subscribers', desc: 'The number of subscribers to the channel as provided by the YouTube API. Note, a small amount of channels hide this data.' }
      ]
    } as ColumnMd
  },
  removedVideo: {
    errorType: {
      label: 'Removed Reason',
      values: [
        { value: 'Detected missing' },
        { value: 'Removed by uploader' }
      ]
    } as ColumnMd
  }
}



export const getColOptions = (table: keyof typeof md) => {
  return Object.entries(md[table]).map(([value, col]) => ({ value: value as keyof Channel, label: col.label, desc: col.desc }))
}



//export const colLabel = (table: string, col: string) => md[table][col].label ?? col

export const measureFormat = (measure: string) => {
  const measureMd = md.channel.measures.values.find(m => m.value == measure)
  return measureMd.format ?? ((v: number) => numFormat(v))
}

export async function getChannels(): Promise<Channel[]> {
  const path = blobCfg.resultsUri
  const channels = await getJsonl<Channel>(path.addPath('ttube_channels.jsonl.gz').url, { headers: { pragma: "no-cache", 'cache-control': 'no-cache' } })

  let tagViews: { [key: string]: { tag: string, sum: number } } = pipe(md.channel.tags.values,
    map(t => ({ tag: t.value, channels: channels.filter(c => c.tags.includes(t.value)) })),
    map(t => ({ tag: t.tag, sum: sumBy(t.channels, c => c.channelViews ?? 0) })),
    indexBy(t => t.tag)
  )

  channels.forEach(c => {
    c.tags = orderBy(c.tags.filter(t => !hiddenTags.includes(t)), t => tagViews[t]?.sum ?? 0, 'asc') // rarer tags go first so colors are more meaningful
    c.media = c.tags.find(t => ['Mainstream News', 'MissingLinkMedia', 'LateNightTalkShow'].includes(t)) ? 'Mainstream Media' : 'YouTube'
  })
  return channels
}