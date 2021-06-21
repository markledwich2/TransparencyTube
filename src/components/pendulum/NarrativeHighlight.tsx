import React, { Fragment, useEffect, useMemo, useRef, useState, FunctionComponent as FC } from 'react'
import { pick } from 'remeda'
import styled from 'styled-components'
import { Channel } from '../../common/Channel'
import { getJsonlResult, NarrativeName, VideoChannelExtra, VideoCommon } from '../../common/RecfluenceApi'
import { numFormat } from '../../common/Utils'
import { ChannelTitle } from '../Channel'
import { Spinner } from '../Spinner'
import { FlexRow, GlobalStyle, MinimalPage } from '../Style'
import { Video } from '../Video'
import { ChevronRightOutline } from '@styled-icons/evaicons-outline'
import { orderBy } from '../../common/Pipe'
import { HScroll } from '../HScroll'

interface HighlightData {
  v: VideoCommon
  c: Channel & {
    mentionVideos?: number
    mentionVideoViews?: number
  }
}

export const highlightData: { [index in NarrativeName]: () => Promise<HighlightData[]> } = {
  'Vaccine Personal': async () => {
    const rows = await getJsonlResult<VideoChannelExtra & VideoCommon & {
      subs: number
      caption: string
      mentionVideos: number
      mentionVideoViews: number
      offsetSeconds: number
    }>('narrative_vaccine_personal_highlight')

    console.log('highlightData - Vaccine Personal - loaded rows', rows)

    return orderBy(rows, r => r.subs, 'desc')
      .map((r, i) => ({
        v: {
          ...pick(r, ['videoId', 'channelId', 'channelTitle', 'videoTitle', 'videoViews', 'durationSecs']),
          rank: i + 1,
          captions: [{ caption: r.caption, offsetSeconds: r.offsetSeconds }]
        },
        c: {
          ...pick(r, ['channelId', 'channelTitle', 'lr', 'subs', 'mentionVideos', 'mentionVideoViews']),
          logoUrl: r.channelLogo,
          tags: r.tags?.length > 0 ? r.tags : ['Non-political']
        }
      }))
  },

  'Vaccine DNA': async () => {
    const rows = await getJsonlResult<VideoChannelExtra & VideoCommon & { subs: number, logoUrl: string }>('narrative_vaccine_dna_highlight')
    return orderBy(rows, r => r.videoViews, 'desc')
      .map((r, i) => ({
        v: {
          ...pick(r, ['videoId', 'channelId', 'channelTitle', 'videoTitle', 'videoViews', 'durationSecs', 'captions']),
          rank: i + 1,
        },
        c: {
          ...pick(r, ['channelId', 'channelTitle', 'lr', 'subs', 'logoUrl']),
          tags: r.tags?.length > 0 ? r.tags : ['Non-political']
        },
      }))
  },

  '2020 Election Fraud': () => { throw 'not implemented' },
  'QAnon': () => { throw 'not implemented' },
  'Comcast': () => { throw 'not implemented' },
}

export const useHighlight = (highlightName: NarrativeName) => {
  const [data, setData] = useState<HighlightData[]>(null)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    setLoading(true)
    highlightData[highlightName]().then(d => {
      setData(d)
      setLoading(false)
    })
  }, [])
  return { data, loading }
}

export interface NarrativeHighlightComponentProps {
  narrative?: NarrativeName
}

export const NarrativeHighlightComponent: FC<NarrativeHighlightComponentProps> = ({ narrative }) => {
  narrative ??= 'Vaccine Personal'

  const { data, loading } = useHighlight(narrative)
  if (loading) return <Spinner />

  return <StyleDiv style={{ position: 'relative' }}>
    {data && <HScroll className='tiles' showScrollButton >
      {data.map(h => <div className='tile' key={h.v.videoId} style={{ minWidth: '27em' }}>
        <ChannelTitle c={h.c}
          // style={{ minHeight: '10em' }}
          logoStyle={{ width: '4em' }}
          showTags metricsExtra={() => <>
            {h.c.mentionVideoViews && <span><b>{numFormat(h.c.mentionVideoViews)}</b> views from <b>{numFormat(h.c.mentionVideos)}</b> vaccine related videos</span>}
          </>}>
        </ChannelTitle>
        <Video v={h.v}
          captionsStyle={{ maxHeight: '7em', overflowY: 'hidden' }}
          showThumb thumbStyle={{ width: '26em', height: '13em', objectFit: 'cover', marginBottom: '0.5em' }}
        />
      </div>)}
    </HScroll>}
  </StyleDiv>
}

const StyleDiv = styled.div`
  .tiles {
    display: flex;
    flex-direction: row;
    flex-basis: content;
  }

  .tile {
    margin: 0.5em;
    padding: 1em;
    box-shadow: 0 0.25rem 0.5rem rgb(48 55 66 / 15%);
    border-radius: 1em;
  }

  .right-scroll {
    background: var(--bg);
    opacity: 0.5;
    cursor: pointer;
    &:hover {
      opacity: 0.8;
    }
  }
`