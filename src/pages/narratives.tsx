import React, { useEffect, useState } from "react"
import { indexBy } from 'remeda'
import { blobIndex, BlobIndex } from '../common/BlobIndex'
import { Channel, md } from '../common/Channel'
import { useQuery } from '../common/QueryString'
import { ChannelStats, VideoCommon, VideoViews } from '../common/RecfluenceApi'
import { FilterHeader } from '../components/FilterCommon'
import Layout, { MinimalPage } from "../components/Layout"
import { Videos } from '../components/Video'
import { VideoChannelExtra, VideoFilter, videoFilterIncludes } from '../components/VideoFilter'
import { useLocation } from '@reach/router'
import { delay, navigateNoHistory } from '../common/Utils'
import { filterFromQuery, filterToQuery, InlineValueFilter } from '../components/ValueFilter'
import PurposeBanner from '../components/PurposeBanner'
import ReactTooltip from 'react-tooltip'

interface QueryState extends Record<string, string> {
  channel?: string
  tags?: string,
  lr?: string,
  label?: string,
  narrative?: string
}

export interface VideoNarrative extends VideoCommon, VideoChannelExtra {
  narrative: string,
  labels: string
}

type NarrativeChannel = Channel & ChannelStats & NarrativeKey
interface NarrativeCaption {
  narrative: string,
  videoId: string,
  captions: { offset: number, caption: string }[]
}
type NarrativeKey = { narrative: string }
type NarrativeCaptionKey = NarrativeKey & { videoId: string }
type NarrativeIdx = {
  videos: BlobIndex<VideoNarrative, NarrativeKey>,
  captions: BlobIndex<NarrativeCaption, NarrativeCaptionKey>,
  channels: BlobIndex<NarrativeChannel, NarrativeKey>,
}

const NarrativesPage = () => {
  const [idx, setIdx] = useState<NarrativeIdx>(null)
  const [q, setQuery] = useQuery<QueryState>(useLocation(), navigateNoHistory)
  const [videos, setVideos] = useState<VideoNarrative[]>(null)
  const [channels, setChannels] = useState<Record<string, NarrativeChannel>>(null)
  const [loading, setLoading] = useState(false)

  const narrative = q.narrative ?? idx?.videos.cols.find(c => c.name == 'narrative')?.distinct[0] ?? ''
  const videoFilter: VideoFilter = filterFromQuery(q, ['tags', 'lr', 'narrative', 'label'])
  const setVideoFilter = (f: VideoFilter) => setQuery(filterToQuery(f))

  useEffect(() => {
    Promise.all([
      blobIndex<VideoNarrative, NarrativeKey>('narrative_videos'),
      blobIndex<NarrativeCaption, NarrativeCaptionKey>('narrative_captions'),
      blobIndex<NarrativeChannel, NarrativeKey>('narrative_channels')
    ]).then(([videos, captions, channels]) => setIdx({ videos, captions, channels }))
  }, [])

  useEffect(() => {
    idx?.channels.getRows({ narrative }).then(chans => setChannels(indexBy(chans, c => c.channelId)))
  }, [idx, q.narrative])

  useEffect(() => {
    if (!idx) return
    setLoading(true)
    idx.videos.getRows({ narrative }).then(vids => {
      setVideos(vids.filter(v => videoFilterIncludes(videoFilter, v)))
      setLoading(false)
      delay(200).then(() => ReactTooltip.rebuild())
    })
  }, [idx, JSON.stringify(q)])

  return <Layout>
    <PurposeBanner>
      <p>2020 Election content to do with allegation fo fraud. (TODO: better copy)</p>
    </PurposeBanner>
    <MinimalPage>
      <p style={{ margin: '2em' }}>TODO: packed channel bubbles grouped by label/lr/tag. Click to filter videos</p>
      <FilterHeader style={{ marginBottom: '2em' }}>Videos filtered to
        <InlineValueFilter md={md} filter={videoFilter} onFilter={setVideoFilter} rows={videos} />
      </FilterHeader>
      <Videos channels={channels} videos={videos} showChannels showThumb loading={loading} />
    </MinimalPage>
  </Layout>
}

export default NarrativesPage