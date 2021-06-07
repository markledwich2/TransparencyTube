
import { getJsonl, hoursFormat, numFormat } from './Utils'
import { indexBy, map, pipe } from 'remeda'
import { entries, orderBy, sumBy } from './Pipe'
import { blobCfg } from './Cfg'
import { ColumnMd, Opt, tableMd } from './Metadata'

export interface Channel {
  channelId: string
  channelTitle: string
  platform?: PlatformName
  description?: string
  tags?: string[]
  logoUrl?: string
  date_to?: string
  lr?: string
  subs?: number
  channelViews?: number
  media?: string
  reviewsHuman?: number
  publicReviewerNotes?: string
  publicCreatorNotes?: string
}

export type PlatformName = 'YouTube' | 'BitChute' | 'Rumble'

export type ColumnMdOpt = Opt<keyof Channel> & { desc: string }

export const hiddenTags = ['Black', 'LGBT']

export const md = {
  channel: tableMd({
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
        {
          value: 'WhiteIdentitarian', label: 'White Identitarian', color: '#b8b500', desc: `Identifies-with and is-proud-of White ancestry or strongly with a supreme western civilization. An example of identifying with “western heritage”  would be an american to referring to the sistine chapel, or bach as “our culture”. Promotes or defends any of the following: 
* An ethno-state where residence or citizenship would be limited to “whites” OR a type of nationalist that seek to maintain a white national identity (white nationalism)
* Historical narratives focused on the White lineage and its superiority
* Essentialist concepts of racial differences
* concerned about whites becoming a minority population in their country.` },
        { value: 'StateFunded', label: 'State Funded' },
        { value: 'Fresh', color: '#444', label: 'Anonymous' },
        { value: 'Non-political', color: '#444' }
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
    platform: {
      label: 'Platform',
      desc: 'The platform the video was uploaded to',
      values: [
        { value: 'YouTube', color: '#FF0000' },
        { value: 'BitChute', color: '#4F4F4F' },
        { value: 'Rumble', color: '#699D36' }
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
  }),
  video: tableMd({
    errorType: {
      label: 'Removed Reason',
      values: [
        { value: 'Available', color: '#cca55a', label: 'Available', desc: `Video has not been removed by anyone` },
        { value: 'Removed by uploader', color: '#8a8acb', label: 'Removed by creator', desc: `The creator removed a video that was once public` },
        { value: 'Unavailable', color: '#444', desc: `The video's page reported *Unavailable* as the reason` },
        { value: 'Private', color: '#aa557f', desc: `A public video was made private by the creator` },
        { value: 'Terms of service', color: '#e55e5e', desc: `YouTube decided the video violated *YouTube's Terms of Service*` },
        { value: 'Harassment and bullying', color: '#e55e5e', desc: `YouTube decided the video violated the [harassment and cyberbullying policy](https://support.google.com/youtube/answer/2802268?hl=en-GB)` },
        { value: 'Hate speech', color: '#e55e5e', desc: `YouTube decided the video violated their [policy on hate speech](https://support.google.com/youtube/answer/2801939?hl=en)` },
        { value: 'Community guidelines', color: '#e55e5e', desc: `YouTube decided the video violated their [community guidelines](https://www.youtube.com/howyoutubeworks/policies/community-guidelines/)` },
        { value: 'Sexual content', color: '#e0990b', desc: `YouTube decided the video violated their [policy on nudity or sexual content](https://support.google.com/youtube/answer/2802002?hl=en)` },
        { value: 'Copyright claim', color: '#41afa5', desc: `The video was removed because a copyright claim as made` },
        { value: 'Channel Removed', color: '#e55e5e', desc: `YouTube or the channel owner removed this videos channel` }
      ]
    } as ColumnMd,
    copyrightHolder: {
      label: 'Copyright holder'
    } as ColumnMd,
    narrative: {
      label: 'Narrative'
    } as ColumnMd,
    support: {
      label: 'Narrative Support',
      values: [
        { value: 'support', label: 'Supporting', color: '#56b881', desc: `Videos that support the narrative being pushed by President Trump that the 2020 presidential election was rigged, stolen, and/or impacted by significant fraud. This includes cases in which significant “election fraud” claims are made during a speech or interview, but not challenged afterwards. This also includes language that clearly insinuates or implies that this narrative is true.` },
        { value: 'dispute', label: 'Disputing', color: '#aa557f', desc: `Videos that dispute the narrative being pushed by President Trump that the 2020 presidential election was rigged, stolen, and/or impacted by significant fraud. If significant “election fraud” is mentioned during a speech or interview, the dispute might be made clear after the speaker is finished or through text on the screen. Easily interpreted forms of insinuation and parody count as well.` },
        { value: 'other', label: 'Other', desc: `This covers cases where “election fraud” is being discussed, but in a manner that does not clear dispute or support the narrative that it has had a significant impact on the 2020 election.` },
        { value: 'unrelated_political', label: 'Unrelated Politics', color: '#6ec9e0', desc: `Political video's unrelated to this narrative` }
      ]
    } as ColumnMd,
    supplement: {
      label: 'Review Type',
      values: [
        { value: 'heur_chan', label: `Auto - video's in channel` },
        { value: 'heur_tag', label: 'Auto - similar channels' },
        { value: 'manual', label: 'Manual review' },
      ]
    } as ColumnMd
  })
}

export const getColOptions = (table: keyof typeof md) => {
  return Object.entries(md[table]).map(([value, col]) => ({ value: value as keyof Channel, label: col.label, desc: col.desc }))
}

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
    c.tags = orderBy(c.tags?.filter(t => !hiddenTags.includes(t)) ?? [], t => tagViews[t]?.sum ?? 0, 'asc') // rarer tags go first so colors are more meaningful
    c.media = c.tags?.find(t => ['Mainstream News', 'MissingLinkMedia', 'LateNightTalkShow'].includes(t)) ? 'Mainstream Media' : 'YouTube'
  })
  return channels
}

export const channelUrl = (channelId: string) => `https://www.youtube.com/channel/${channelId}`
export const openYtChannel = (channelId: string) => window.open(channelUrl(channelId), 'yt')