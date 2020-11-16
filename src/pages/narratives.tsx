import React, { useEffect, useState } from "react"
import { groupBy, indexBy, map, pick, pipe, uniq } from 'remeda'
import { blobIndex, BlobIndex } from '../common/BlobIndex'
import { Channel, md } from '../common/Channel'
import { useQuery } from '../common/QueryString'
import { ChannelStats, VideoChannelExtra, VideoCommon, VideoNarrative, VideoViews } from '../common/RecfluenceApi'
import { FilterHeader, FilterPart } from '../components/FilterCommon'
import Layout, { MinimalPage, styles } from "../components/Layout"
import { Videos } from '../components/Video'
import { useLocation } from '@reach/router'
import { delay, navigateNoHistory, parseJson } from '../common/Utils'
import { filterFromQuery, filterFromState, filterIncludes, FilterState, filterToQuery, InlineValueFilter } from '../components/ValueFilter'
import PurposeBanner from '../components/PurposeBanner'
import ReactTooltip from 'react-tooltip'
import { DateRangeQueryState, InlineDateRange, rangeFromQuery, rangeToQuery } from '../components/DateRange'
import { entries, sumBy, values } from '../common/Pipe'
import { BubbleCharts } from '../components/BubbleChart'
import ContainerDimensions from 'react-container-dimensions'
import { ChannelDetails, ChannelLogo, ChannelSearch } from '../components/Channel'
import { BubblesSelectionState } from '../common/Bubble'
import { Tip } from '../components/Tooltip'
import { CloseOutline } from '@styled-icons/evaicons-outline'

interface QueryState extends DateRangeQueryState, BubblesSelectionState<NarrativeChannel> {
  channelId?: string
  tags?: string,
  lr?: string,
  support?: string,
  supplement?: string,
  narrative?: string
}

type NarrativeChannel = Channel & ChannelStats & NarrativeKey & { bubbleKey: string, support: string }

type NarrativeKey = { narrative?: string, uploadDate?: string }
type NarrativeIdx = {
  videos: BlobIndex<VideoNarrative, NarrativeKey>,
  channels: BlobIndex<NarrativeChannel, NarrativeKey>,
}

const bubbleKeyString = <T extends { channelId: string }>(r: T, groupBy: keyof T) => `${r.channelId}|${r[groupBy]}`
const bubbleKeyObject = (key: string) => {
  if (!key) return { channelId: null, group: null }
  const [channelId, group] = key.split('|')
  return { channelId, group }
}

const NarrativesPage = () => {
  const [idx, setIdx] = useState<NarrativeIdx>(null)
  const [q, setQuery] = useQuery<QueryState>(useLocation(), navigateNoHistory)
  const [videos, setVideos] = useState<(VideoNarrative)[]>(null)
  const [channels, setChannels] = useState<Record<string, NarrativeChannel>>(null)
  const [loading, setLoading] = useState(false)

  const groupCol = 'support'

  const narrative = q.narrative ?? idx?.videos.cols.find(c => c.name == 'narrative')?.distinct[0] ?? ''

  const bubbleFilter = { ...filterFromQuery(q, ['tags', 'lr', 'support', 'supplement']) }
  const videoFilter = { ...bubbleFilter, bubbleKey: q.selectedKeys }

  const setVideoFilter = (f: FilterState<VideoNarrative>) => setQuery(filterToQuery(pick(f, ['tags', 'lr', 'support', 'channelId', 'supplement'])))
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
          if(['second_opinion'].includes(v.supplement)) vExtra.supplement = null
          
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
    colorBy: 'tags',
    measure: 'views',
    openGroup: q.openGroup,
    selectedKeys: q.selectedKeys
  }

  return <Layout>
    <PurposeBanner>
      <p>2020 Election content to do with allegation fo fraud. (TODO: better copy)</p>
    </PurposeBanner>
    <MinimalPage>
      <p style={{ margin: '2em' }}>TODO: packed channel bubbles grouped by label/lr/tag. Click to filter videos</p>
      <FilterHeader style={{ marginBottom: '2em', display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
        <FilterPart>
          Narrative related videos filtered by
          <InlineValueFilter md={md} filter={pick(videoFilter, ['support', 'supplement'])} onFilter={setVideoFilter} rows={videos} />
        </FilterPart>
        <FilterPart>
          channel type
          <InlineValueFilter md={md} filter={pick(videoFilter, ['tags', 'lr'])} onFilter={setVideoFilter} rows={videos} />
        </FilterPart>
        in period
        <FilterPart>
          <InlineDateRange
            range={dateRange}
            onChange={r => setQuery(rangeToQuery(r))}
          />
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
            setQuery({ selectedKeys: bubbleRows.filter(b => b.channelId == c.channelId).map(b => bubbleKeyString(b, groupCol)) })
          }} channels={values(channels)} sortBy='views' style={styles.normalFont} />}
        </FilterPart>
      </FilterHeader>
      <ContainerDimensions>
        {({ width }) => bubbleRows && <BubbleCharts<NarrativeChannel>
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
          groupRender={(g, rows) => <></>}
          onSelect={(r) => {
            setQuery({ selectedKeys: r == null ? null : [r.bubbleKey] })
          }}
          onOpenGroup={g => {
            return setQuery({ openGroup: g })
          }}
          tipContent={r => <ChannelDetails channel={r} mode='min' />}
        />}
      </ContainerDimensions>
      <Videos channels={channels} videos={videoRows} groupChannels showTags showChannels showThumb loading={loading} />
    </MinimalPage>
  </Layout>
}

export default NarrativesPage