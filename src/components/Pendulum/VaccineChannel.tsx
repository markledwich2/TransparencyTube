import React, { Fragment, useEffect, useMemo, useRef, useState, FunctionComponent as FC } from 'react'
import { pick } from 'remeda'
import styled from 'styled-components'
import { Channel } from '../../common/Channel'
import { getJsonlResult, VideoChannelExtra, VideoCommon } from '../../common/RecfluenceApi'
import { numFormat } from '../../common/Utils'
import { ChannelTitle } from '../Channel'
import { Spinner } from '../Spinner'
import { FlexRow, GlobalStyle, MinimalPage } from '../Style'
import { Video } from '../Video'
import { ChevronRightOutline } from '@styled-icons/evaicons-outline'
import { orderBy } from '../../common/Pipe'
import { HScroll } from '../HScroll'

type HighlightRow = VideoChannelExtra & VideoCommon & {
  subs: number
  caption: string
  mentionVideos: number
  mentionVideoViews: number
  offsetSeconds: number
}

interface HighlightData {
  v: VideoCommon
  c: Channel & {
    mentionVideos: number
    mentionVideoViews: number
  }
}

export const VaccineChannel: FC<{}> = () => {
  const [data, setData] = useState<HighlightData[]>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getJsonlResult<HighlightRow>('narrative_vaccine_highlight').then(rawRows => {
      const _data = orderBy(rawRows, r => r.subs, 'desc')
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
          },
        }))

      setData(_data)
      setLoading(false)
    })
  }, [])


  if (loading) return <Spinner />

  return <StyleDiv style={{ position: 'relative' }}>
    {data && <HScroll className='tiles' showScrollButton >
      {data.map(h => <div className='tile' key={h.v.videoId} style={{ minWidth: '27em' }}>
        <ChannelTitle c={h.c}
          // style={{ minHeight: '10em' }}
          logoStyle={{ width: '4em' }}
          showTags metricsExtra={() => <span>
            <b>{numFormat(h.c.mentionVideoViews)}</b> views from <b>{numFormat(h.c.mentionVideos)}</b> vaccine related videos
          </span>} >
        </ChannelTitle>
        <Video v={h.v}
          captionsStyle={{ maxHeight: '7em', overflowY: 'hidden' }}
          showThumb thumbStyle={{ width: '26em', height: '13em', objectFit: 'cover' }} />
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