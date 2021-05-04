import { parseISO } from 'date-fns'
import React, { Fragment, useMemo } from 'react'
import ContainerDimensions from 'react-container-dimensions'
import { NarrativeVideo } from '../common/RecfluenceApi'
import { useNarrative } from '../components/NarrativeBubbles'
import { Tip, useTip } from '../components/Tip'
import { Video, Videos } from '../components/Video'
import { BeeChart } from '../components/BeeChart'
import { pick } from 'remeda'
import { TextSection } from '../components/Markdown'
import { FilterHeader, FilterPart } from '../components/FilterCommon'
import { InlineDateRange, rangeToQuery } from '../components/DateRange'
import { toJson } from '../common/Utils'
import { GlobalStyle, MinimalPage, styles } from '../components/Style'
import { filterIncludes, InlineValueFilter } from '../components/ValueFilter'
import { ChannelLogo, ChannelSearch } from '../components/Channel'
import { CloseOutline } from '@styled-icons/evaicons-outline'
import { values } from '../common/Pipe'
import { md } from '../common/Channel'
import { colMd } from '../common/Metadata'
import { useWindowDim } from '../common/Window'
import '../components/main.css'

const nProps = {
  narrative: 'Vaccine Personal',
  defaultRange: { startDate: new Date(2020, 1 - 1, 25), endDate: new Date(2021, 4 - 1, 30) },
  narrativeIndexPrefix: 'narrative2'
}


const NarrativeVaccinePage = () => {
  const { videoRows, channels, loading, idx, dateRange, setQuery, q, videoFilter, setVideoFilter } = useNarrative(nProps) // ignore bubbles and go directly to video granularity
  const windowDim = useWindowDim()

  const { bubbles, videos, errorMd } = useMemo(() => {
    console.log('BeeSwarm - videoRows memo')
    const videoRowsDerived = videoRows?.map(v => ({ ...v, errorType: v.errorType ?? 'Available' }))
    const errorMd = colMd(md.video.errorType, videoRowsDerived)
    const bubbles = videoRowsDerived?.map(v => ({
      id: v.videoId,
      groupId: v.channelId,
      data: v,
      value: v.videoViews,
      color: errorMd.val[v.errorType]?.color ?? '#888',
      date: parseISO(v.uploadDate),
      img: channels[v.channelId].logoUrl,
      selected: q.channelId?.includes(v.channelId)
    }))
    const videos = videoRowsDerived?.filter(v => filterIncludes(pick(q, ['channelId']), v)) // already filtered except for channelId because we want videoRows without that filter
    return { bubbles, videos, errorMd }
  }, [videoRows, toJson(q)])

  var tip = useTip<NarrativeVideo>()

  return <>
    <GlobalStyle />
    <MinimalPage>

      <TextSection style={{ margin: '1em' }}>
        <p>Video <b>bubbles</b> sized by <b>views</b>, arranged by <b>created</b> and colored by <b>removal status</b></p>
      </TextSection>

      <FilterHeader style={{ marginBottom: '2em', marginLeft: '1em' }}>
        <FilterPart>
          Uploaded <InlineDateRange range={dateRange} onChange={r => setQuery(rangeToQuery(r))} />
        </FilterPart>
        <FilterPart>
          video
          <InlineValueFilter metadata={md.video} filter={pick(videoFilter, ['errorType'])} onFilter={setVideoFilter} rows={videos} showCount />
        </FilterPart>
        <FilterPart>
          channel
        <InlineValueFilter metadata={md.channel} filter={pick(videoFilter, ['tags', 'lr'])} onFilter={setVideoFilter} rows={videos} showCount />
        </FilterPart>
        <FilterPart>
          {channels && q.channelId && q.channelId.map(c => <Fragment key={c}>
            {/* useTip={channelTip} */}
            <ChannelLogo c={channels[c]} style={{ height: '2em' }} />
            <CloseOutline className='clickable'
              onClick={() => {
                const keys = q.channelId?.filter(k => k != c)
                return setQuery({ channelId: keys?.length > 0 ? keys : null })
              }} />
          </Fragment>)}
          {channels && !q.channelId && <ChannelSearch
            style={styles.normalFont}
            onSelect={c => setQuery({ channelId: [c.channelId] })}
            channels={values(channels)} sortBy='views' placeholder='channel search' />}
        </FilterPart>
      </FilterHeader>

      <div>
        <ContainerDimensions>
          {({ width }) => <BeeChart
            w={width - 5}
            nodes={bubbles}
            onSelect={(n) => { setQuery({ channelId: n ? [n.channelId] : null }) }}
            tip={tip}
            bubbleSize={windowDim.h / 1200}
          />
          }
        </ContainerDimensions>
      </div>

      <Tip {...tip.tipProps}>
        {tip.data && <Video v={tip.data} c={channels[tip.data.channelId]} showChannel showThumb />}
      </Tip>

      <TextSection style={{ margin: '1em' }}><p>Top viewed videos with the context of mention</p></TextSection>

      <Videos channels={channels} videos={videos} groupChannels showTags showChannels showThumb loading={loading}

        defaultLimit={20}
        loadExtraOnVisible={async (vids) => {
          if (!idx?.captions) return []
          const res = await idx.captions.rowsWith(vids.map(v => pick(v, ['narrative', 'channelId', 'videoId'])), { andOr: 'or' })
          return res
        }}
        highlightWords={['vaccine']} />

    </MinimalPage>
  </>
}

export default NarrativeVaccinePage