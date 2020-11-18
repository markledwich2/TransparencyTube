import React, { useEffect, useState } from "react"
import { groupBy, indexBy, map, pick, pipe, uniq } from 'remeda'
import { blobIndex, BlobIndex, noCacheReq } from '../common/BlobIndex'
import { Channel, md } from '../common/Channel'
import { useQuery } from '../common/QueryString'
import { ChannelStats, VideoChannelExtra, VideoCommon, VideoNarrative, VideoViews } from '../common/RecfluenceApi'
import { FilterHeader, FilterPart } from '../components/FilterCommon'
import Layout, { MinimalPage, styles } from "../components/Layout"
import { Videos } from '../components/Video'
import { useLocation } from '@reach/router'
import { delay, getJsonl, navigateNoHistory, numFormat, parseJson } from '../common/Utils'
import { filterFromQuery, filterFromState, filterIncludes, FilterState, filterToQuery, InlineValueFilter } from '../components/ValueFilter'
import PurposeBanner from '../components/PurposeBanner'
import ReactTooltip from 'react-tooltip'
import { DateRangeQueryState, InlineDateRange, rangeFromQuery, rangeToQuery } from '../components/DateRange'
import { entries, sumBy, values } from '../common/Pipe'
import { BubbleCharts } from '../components/BubbleChart'
import ContainerDimensions from 'react-container-dimensions'
import { ChannelDetails, ChannelLogo, ChannelSearch, Tag } from '../components/Channel'
import { BubblesSelectionState } from '../common/Bubble'
import { Tip } from '../components/Tooltip'
import { CloseOutline } from '@styled-icons/evaicons-outline'
import { Markdown, TextSection, TextStyle } from '../components/Markdown'
import { colMdValuesObj } from '../common/Metadata'
import { ChevronDownOutline, ChevronUpOutline } from '@styled-icons/evaicons-outline'
import { blobCfg } from '../common/Cfg'
import { LinkData, NodeData, Sankey } from '../components/Sankey'
import { SankeyGraph } from 'd3-sankey'
import styled from 'styled-components'
import { Tab, Tabs } from '../components/Tab'


const findings = {
  rec: `YouTube seems to be reducing the amount of recommendations to videos supporting election fraud. According to our estimates, "Supporting" videos receive about 26% of the impressions they send (100% would be neutral). "Disputing" videos are also disadvantaged - receiving about 64% of the impressions they send.`
}


const copySections: { title: string, md: string, open?: boolean }[] = [
  {
    title: `Label Definitions`,
    md: `**Disputing**: This label is given to videos that dispute the narrative being pushed by President Trump that the 2020 presidential election was rigged, stolen, and/or impacted by significant fraud. If significant “election fraud” is mentioned during a speech or interview, the dispute might be made clear after the speaker is finished or through text on the screen. Easily interpreted forms of insinuation and parody count as well.

**Supporting**: This label is given to videos that support the narrative being pushed by President Trump that the 2020 presidential election was rigged, stolen, and/or impacted by significant fraud. This includes cases in which significant “election fraud” claims are made during a speech or interview, but not challenged afterwards. This also includes language or additional text that clearly insinuates or implies that this narrative is true.

**Other**: This covers cases where “election fraud” is being discussed, but in a manner that does not clear dispute or support the narrative that it has had a significant impact on the 2020 election or in a context not related to the 2020 election.
`
  },
  {
    title: `Key Findings`,
    md: `
*   YouTube’s is correct that videos “disputing” “election fraud” have received more views than those “supporting” the claim of widespread “election fraud”. However, our analysis shows that videos “supporting” the claim still account for a significant amount of traffic. **In particular, between 11/3 and 11/10, they accounted for 137M views and 34% of all traffic to videos discussing “election fraud”.**
*   Despite being the largest “partisan right” channel by far, FoxNews has received less traffic on videos discussing “election fraud” than other news outlets. They are also one of the few “partisan right” channels to regularly “dispute” claims of widespread “election fraud” and videos “supporting” such claims have been limited to interviews of the president and his campaign staff.
*   ${findings.rec}.`
  },
  {
    title: `Important Notes`,
    md: `
*   Due to issues with YouTube’s default transcripts, a small percentage of the video links go to a portion of the video that is not aligned with the section of the transcript displayed on this page. You may have to manually select an earlier spot in the video in order to watch the portion the snippet should be aligned with.
*   Evidence for whether the video is supporting or disputing claims of “election fraud” may come some time after the specific portion of the video in which “election fraud” is discussed. Such as at the end of a speech.
*   There are a small number of channels that don’t have transcripts enabled. One prominent example is CNN. Further analysis needs to be done to estimate how including channels with disabled transcripts would increase “supporting” and “disputing” view aggregates.
*   There is some subjectivity involved in the process of manually labeling videos and errors can be made. Please notify us if you find any labels you believe are incorrect.`
  },
  {
    title: `Identifying Election Fraud Discussion in Videos`,
    md: `We detect “election fraud” discussion in videos by searching the transcripts (automatically generated closed captions) of videos uploaded by political channels for pairs of keywords commonly used when discussing the topic. These keywords don’t necessarily need to be adjacent, but must be relatively close to each other. This heuristic appears to be very precise as we’ve found that &lt;1% of cases identified by it were discussing something other than “election fraud”. More analysis needs to be done to measure the recall (coverage) of the heuristic, but based on the immense scale of videos identified so far, it appears to be high as well.`
  },
  {
    title: `Manual and Heuristic Labeling of Videos`,
    md: `Manual labeling of videos was limited to those uploaded between the 3rd and 10th November 2020 and only the first mention of “election fraud” in each video was reviewed. If the label for the first snippet in a video is unclear, then subsequent snippets are analyzed. In total 378 mentions of election fraud were labeled including the top 160 viewed “partisan right” videos and top 110 viewed videos from all other channels. These manually labeled videos account for a small portion of the 4,895 videos discussing “election fraud” during this period. However, they have a combined 282M views, they cover 64% of the overall “election fraud” video traffic during the period.

The 378 reviewed channels consisted of 203 “supporting”, 129 “disputing”, and 46 “other”. The distribution is impacted by the decision to label more “partisan right” videos than non-”partisan right” videos.

In order to label the remaining videos we use the following heuristic:
* If other videos by the channel have been manually labeled, use the majority label
* Otherwise, use the majority label for all other labeled videos from channels with the same soft tags and political lean.


Due to the small number of videos labeled “other”, the heuristic only uses “supporting” and “disputing” labels when making predictions.

We use hold-one-out cross validation to measure the performance of the heuristic and find that it has an accuracy of 83%. For the “supporting” label the precision is 0.85 and the recall is 0.95. For the “disputing” label the precision is 0.80 and the recall is 0.94.`},
  {
    title: `Recommendation Data`,
    md: `Recommendations that appear to the side of videos are collected periodically for recent videos in a channel. From these recommendations, we estimate impressions (the number of times a person was displayed a recommendation).

**Notes:**
* Recommendations are collected anonymously (i.e. not logged in)
* We do not collect recommendations for all videos. When recommendations data is missing, we estimate impressions based on the typical recommendations for that channel. 
* Impressions are calculated assuming that each view of a video sees the top 10 recommendations
* Recommendation data for narratives is a new capability, and there is some risk that the data 
`
  }
]



interface QueryState extends DateRangeQueryState, BubblesSelectionState<NarrativeChannel> {
  channelId?: string[]
  tags?: string[],
  lr?: string[],
  support?: string[],
  supplement?: string[],
  narrative?: string,
  errorType?: string[]
}

type NarrativeChannel = Channel & ChannelStats & NarrativeKey & { bubbleKey: string, support: string }

type NarrativeKey = { narrative?: string, uploadDate?: string }
type NarrativeIdx = {
  videos: BlobIndex<VideoNarrative, NarrativeKey>,
  channels: BlobIndex<NarrativeChannel, NarrativeKey>,
}

type NarrativeRecSupport = { narrative: string, fromSupport: string, toSupport: string, impressions: number }

const bubbleKeyString = <T extends { channelId: string }>(r: T, groupBy: keyof T) => `${r.channelId}|${r[groupBy]}`
const bubbleKeyObject = (key: string) => {
  if (!key) return { channelId: null, group: null }
  const [channelId, group] = key.split('|')
  return { channelId, group }
}

const supportValues = colMdValuesObj(md, 'support')

const PageStyle = styled(MinimalPage)`
  svg.sankey {
    text {
      font-size: 1.2rem;
      font-weight: bold;
      fill: var(--fg1);
      tspan {
        &.subtitle {
          font-size: 1rem;
          font-weight: normal;
        }
        &.bold {
          font-weight: bold;
          font-size: 1.2rem;
        }
      }
    }
  }
`

const NarrativesPage = () => {
  const [idx, setIdx] = useState<NarrativeIdx>(null)
  const [q, setQuery] = useQuery<QueryState>(useLocation(), navigateNoHistory)
  const [videos, setVideos] = useState<(VideoNarrative)[]>(null)
  const [channels, setChannels] = useState<Record<string, NarrativeChannel>>(null)
  const [loading, setLoading] = useState(false)
  const [copyOpen, setCopyOpen] = useState<string[]>(copySections.filter(s => s.open).map(s => s.title))
  const [recs, setRecs] = useState<NarrativeRecSupport[]>(null)

  const bubbleFilter = pick(q, ['tags', 'lr', 'support', 'supplement', 'errorType'])
  const videoFilter = { ...bubbleFilter, bubbleKey: q.selectedKeys }
  const setVideoFilter = (f: FilterState<VideoNarrative>) => setQuery(pick(f, ['tags', 'lr', 'support', 'channelId', 'supplement', 'errorType']))

  const groupCol = 'support'
  const colorCol = 'lr'
  const narrative = q.narrative ?? idx?.videos.cols.find(c => c.name == 'narrative')?.distinct[0] ?? ''
  const dateRange = rangeFromQuery(q, new Date(2020, 11 - 1, 3), new Date(2020, 11 - 1, 10))

  // aggregate videos into channel/group-by granularity. Use these rows for bubbles
  const bubbleRows = videos && channels && entries(
    groupBy(videos.filter(v => filterIncludes(bubbleFilter, v)), v => bubbleKeyString(v, groupCol))
  )
    .map(([g, vids]) => {
      const { channelId, group } = bubbleKeyObject(g)
      return ({
        bubbleKey: g,
        ...channels[channelId],
        [groupCol]: group,
        views: vids ? sumBy(vids, v => v.videoViews) : 0
      }) as NarrativeChannel
    })

  const videoRows = videos?.filter(v => filterIncludes(videoFilter, v))
  const selectedChannels = q.selectedKeys && channels && uniq(q.selectedKeys.map(k => bubbleKeyObject(k).channelId)).map(id => channels[id])

  useEffect(() => {
    getJsonl<NarrativeRecSupport>(blobCfg.resultsUri.addPath('narrative_recs_support.jsonl.gz').url, noCacheReq)
      .then(r => setRecs(r))
    Promise.all([
      blobIndex<VideoNarrative, NarrativeKey>('narrative_videos'),
      blobIndex<NarrativeChannel, NarrativeKey>('narrative_channels')
    ]).then(([videos, channels]) => setIdx({ videos, channels }))
  }, [])

  useEffect(() => { idx?.channels.getRows({ narrative }).then(chans => setChannels(indexBy(chans, c => c.channelId))) }, [idx, q.narrative])

  useEffect(() => {
    if (!idx || !channels) return
    setLoading(true)
    idx.videos
      .getRows(
        { narrative },
        { from: { uploadDate: dateRange.startDate.toISOString() }, to: { uploadDate: dateRange.endDate.toISOString() } }
      ).then(vids => {
        const vidsExtra = vids.map(v => {
          const c = channels[v.channelId]
          if (!c) return v
          const vExtra = { ...v, ...pick(c, ['tags', 'lr']) }
          vExtra.supplement = (['heur_chan', 'heur_tag'].includes(v.supplement)) ? v.supplement : 'manual'
          vExtra.bubbleKey = bubbleKeyString(vExtra, groupCol) //2nd step so key can be derived from other calculated cols
          return vExtra
        })
        setVideos(vidsExtra)
        setLoading(false)
        delay(200).then(() => ReactTooltip.rebuild())
      })
  }, [idx, channels, JSON.stringify(q)])

  const selections: BubblesSelectionState<NarrativeChannel> = {
    groupBy: groupCol,
    colorBy: colorCol,
    measure: 'views',
    openGroup: q.openGroup,
    selectedKeys: q.selectedKeys
  }

  return <Layout>
    <PurposeBanner>
      <p>Post election news has been dominated by President Trump’s claim that he lost due to significant “voter fraud”. In this analysis we share preliminary results from our attempt to measure how this narrative is being discussed on political and cultural YouTube. Specifically, we’ve developed a method to identify videos discussing “election fraud” and label whether the discussions are <Tag label={supportValues.claim.label} color={supportValues.claim.color} /> or <Tag label={supportValues.denial.label} color={supportValues.denial.color} /> the president’s claim. These experiments use videos uploaded between the 3rd and 10th November 2020, but on this page we make it possible to view “election fraud” discussions in 7,896 videos uploaded by 1,458 channels between 27th October and 15th November 2020. As of 16th November these videos have generated 680M views combined. Data and more detailed documentation can be found <a href="https://github.com/markledwich2/TransparencyTube/tree/master/research/us_2020_election_fraud_narrative">here</a>.</p>
      {copySections.map((s, i) => {
        const open = copyOpen.includes(s.title)
        return <p key={i}>
          <b style={{ cursor: 'pointer', marginTop: '1.5em' }}
            onClick={() => setCopyOpen(open ? copyOpen.filter(t => t != s.title) : [...copyOpen, s.title])}>
            {s.title}
            {open
              ? <ChevronUpOutline className="clickable" />
              : <ChevronDownOutline className="clickable" />}
          </b>
          {open && <Markdown>{s.md}</Markdown>}
        </p>
      })}
    </PurposeBanner>
    <PageStyle>
      <ContainerDimensions>
        {({ width }) => <Tabs titleStyle={{ textTransform: 'uppercase' }}>
          <Tab label='Videos'>
            <TextSection style={{ marginBottom: '1em' }}>
              <p>Channel <b>bubbles</b> are sized by views of their videos discussing voter fraud. Select a channel to filter the videos below.</p>
            </TextSection>
            <FilterHeader style={{ marginBottom: '2em' }}>
              <FilterPart>
                Videos filter
                <InlineValueFilter md={md} filter={pick(videoFilter, ['support', 'supplement', 'errorType'])} onFilter={setVideoFilter} rows={videos} />
              </FilterPart>
              <FilterPart>
                channel filter
                <InlineValueFilter md={md} filter={pick(videoFilter, ['tags', 'lr'])} onFilter={setVideoFilter} rows={videos} />
              </FilterPart>
              in period
              <FilterPart>
                <InlineDateRange
                  range={dateRange}
                  onChange={r => setQuery(rangeToQuery(r))} />
              </FilterPart>
              <FilterPart>
                from channel
                {channels && selectedChannels && selectedChannels.map(c => <>
                <ChannelLogo c={c} key={c.channelId} tipId='searchChannel' style={{ height: '2em' }} />
                <CloseOutline className='clickable'
                  onClick={() => {
                    const keys = q.selectedKeys?.filter(k => bubbleKeyObject(k).channelId != c.channelId)
                    return setQuery({ selectedKeys: keys?.length > 0 ? keys : null })
                  }} />
              </>)}
                <Tip id='searchChannel' getContent={id => {
                  const c = channels?.[id]
                  return c ? <ChannelDetails channel={c} mode='min' /> : <></>
                }} />
                {channels && !q.selectedKeys && <ChannelSearch onSelect={c => {
                  const keys = bubbleRows.filter(b => b.channelId == c.channelId).map(b => bubbleKeyString(b, groupCol))
                  setQuery({ selectedKeys: keys })
                }} channels={values(channels)} sortBy='views' style={styles.normalFont} />}
              </FilterPart>
            </FilterHeader>
            {bubbleRows && <BubbleCharts<NarrativeChannel>
              rows={bubbleRows}
              bubbleWidth={width > 800 ? 600 : 200}
              selections={selections}
              dataCfg={{
                key: r => `${r.channelId}|${r[groupCol]}`,
                image: r => r.logoUrl,
                title: r => r.channelTitle
              }}
              showImg
              loading={loading}
              groupRender={(g, _) => <div style={{ maxWidth: '40em' }}><Markdown>{supportValues[g]?.desc}</Markdown></div>}
              onSelect={(r) => {
                setQuery({ selectedKeys: r == null ? null : [r.bubbleKey] })
              }}
              onOpenGroup={g => {
                return setQuery({ openGroup: g })
              }}
              tipContent={r => <ChannelDetails channel={r} mode='min' />}
              style={{ marginBottom: '2em' }} />}
            <TextSection>
              <p><b>Videos</b> with the relevant captions for context. Change filters, or select channels above to filter this list.</p>
            </TextSection>
            <Videos channels={channels} videos={videoRows} groupChannels showTags showChannels showThumb loading={loading} />
          </Tab>
          <Tab label='Recommendations'>
            <TextSection>
              <h3></h3>
              <p style={{ marginBottom: '1em' }}>
                <p>Estimated recommendation impressions to videos discussing US 2020 election fraud appearing on videos from 3rd-11th November 2020.</p>
                <ul>
                  <li><b>Left:</b> Amount people have been shown recommendations from a video</li>
                  <li><b>Right:</b> Amount recommendations were shown to this video</li>
                </ul>
                <p>{findings.rec}</p>
                <p className="subtle">Note: Only the fraud narrative related recommendation from "Unrelated Politics" are included in this chart.</p>
              </p>
              <Sankey
                graph={getRecSupportGraph(recs)}
                size={{ w: Math.min(width, 800), h: 800 }}
                className='sankey'
                textRender={d => <>
                  {d.title}
                  <tspan className={'subtitle bold'} dy={'1.3em'} x={0}>
                    {numFormat(d.impressions)}
                  </tspan>
                  <tspan className={'subtitle'}> impressions {d.dir == 'from' ? 'sent' : 'received'}</tspan>
                </>} />
            </TextSection>
          </Tab>
        </Tabs>}
      </ContainerDimensions>
    </PageStyle>
  </Layout>
}


type Dir = 'from' | 'to'
const supportKey = (dir: Dir, support: string) => `${dir}|${support ?? 'none'}`

interface RecNodeData extends NodeData {
  impressions: number,
  dir: Dir
}

const getRecSupportGraph = (recs: NarrativeRecSupport[]): SankeyGraph<RecNodeData, LinkData> => {
  if (!recs) return { nodes: [], links: [] }

  const null_source = 'unrelated_political'
  const recsEx = recs.map(r => ({ ...r, fromSupport: r.fromSupport ?? null_source, toSupport: r.toSupport ?? null_source }))

  const makeNodes = (dir: Dir) => uniq(recsEx.map(r => r[`${dir}Support`])).map((s: string) => {
    const o = supportValues[s] ?? { value: s }
    const impressions = sumBy(recsEx.filter(r => r[`${dir}Support`] == s), r => r.impressions)
    return {
      id: supportKey(dir, s),
      title: o.label ?? s,
      color: o.color ?? '#333',
      impressions,
      dir
    }
  })
  const nodes = makeNodes('from').concat(makeNodes('to'))
  const links = recsEx.map(r => ({
    ...r,
    source: supportKey('from', r.fromSupport),
    target: supportKey('to', r.toSupport),
    value: r.impressions
  }))
  return { nodes, links }
}

export default NarrativesPage
