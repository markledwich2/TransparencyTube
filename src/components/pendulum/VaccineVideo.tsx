import { parseISO } from 'date-fns'
import React, { Fragment, useMemo, FunctionComponent as FC } from 'react'
import ContainerDimensions from 'react-container-dimensions'
import { NarrativeVideo } from '../../common/RecfluenceApi'
import { useNarrative, UseNarrativeProps } from '../NarrativeBubbles'
import { Tip, useTip } from '../Tip'
import { Video, Videos } from '../Video'
import { BeeChart } from '../BeeChart'
import { pick } from 'remeda'
import { TextSection } from '../Markdown'
import { FilterHeader, FilterPart } from '../FilterCommon'
import { InlineDateRange, rangeToQuery } from '../DateRange'
import { toJson } from '../../common/Utils'
import { GlobalStyle, MinimalPage, styles } from '../Style'
import { filterIncludes, InlineValueFilter } from '../ValueFilter'
import { ChannelLogo, ChannelSearch } from '../Channel'
import { CloseOutline } from '@styled-icons/evaicons-outline'
import { values } from '../../common/Pipe'
import { md } from '../../common/Channel'
import { colMd } from '../../common/Metadata'
import { useWindowDim } from '../../common/Window'
import '../../components/main.css'

const nProps: UseNarrativeProps = {
  narrative: 'Vaccine Personal',
  defaultRange: { startDate: new Date(2020, 1 - 1, 1), endDate: new Date(2021, 5 - 1, 31) },
  narrativeIndexPrefix: 'narrative2',
  videoMap: (v) => ({ ...v, errorType: v.errorType ?? 'Available' })
}


export const VaccineVideo: FC<{}> = () => {
  const { videoRows, channels, loading, idx, dateRange, setQuery, q, videoFilter, setVideoFilter } = useNarrative(nProps) // ignore bubbles and go directly to video granularity
  const windowDim = useWindowDim()

  const { bubbles, videos } = useMemo(() => {
    const errorMd = colMd(md.video.errorType, videoRows)
    const bubbles = videoRows?.map(v => ({
      id: v.videoId,
      groupId: v.channelId,
      data: v,
      value: v.videoViews,
      color: errorMd.val[v.errorType]?.color ?? '#888',
      date: parseISO(v.uploadDate),
      img: channels[v.channelId].logoUrl,
      selected: q.channelId?.includes(v.channelId)
    }))
    const videos = videoRows?.filter(v => filterIncludes(pick(q, ['channelId']), v)) // already filtered except for channelId because we want videoRows without that filter
    return { bubbles, videos }
  }, [videoRows, toJson(q)])

  var tip = useTip<NarrativeVideo>()

  return <>
    <TextSection style={{ margin: '1em' }}>
      <p>Video <b>bubbles</b> sized by <b>views</b>, arranged by <b>created</b> and colored by <b>removal status</b></p>
    </TextSection>

    <FilterHeader style={{ marginBottom: '2em', marginLeft: '1em' }}>
      <FilterPart>
        Uploaded <InlineDateRange range={dateRange} inputRange={nProps.defaultRange} onChange={r => setQuery(rangeToQuery(r))} />
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
        />}
      </ContainerDimensions>
    </div>

    <Tip {...tip.tipProps}>
      {tip.data && <Video v={tip.data} c={channels[tip.data.channelId]} showChannel showThumb />}
    </Tip>

    <TextSection style={{ margin: '1em' }}><p>Top viewed videos in context</p></TextSection>

    <Videos channels={channels} videos={videos}
      groupChannels showTags showChannels showThumb loading={loading}
      defaultLimit={Math.floor(windowDim.w / 300)}
      loadExtraOnVisible={async (vids) => {
        if (!idx?.captions) return []
        const res = await idx.captions.rowsWith(vids.map(v => pick(v, ['narrative', 'channelId', 'videoId'])), { andOr: 'or' })
        return res
      }}
      highlightWords={['vaccine', 'covid', 'coronavirus', 'SARS-CoV-2', 'vaccine', 'Wuhan flu', 'China virus', 'vaccinated', 'Pfizer', 'Moderna', 'BioNTech', 'AstraZeneca', 'Johnson \& Johnson', 'CDC', 'world health organization', 'Herd immunity', 'corona virus', 'kovid', 'covet', 'coven']} />
  </>
}