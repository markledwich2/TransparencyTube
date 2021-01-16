import React, { useEffect, useState } from 'react'
import Layout, { FlexRow, MinimalPage } from '../components/Layout'
import PurposeBanner from '../components/PurposeBanner'
import { delay, navigateNoHistory } from '../common/Utils'
import { first, flatMap, groupBy, pick, pipe, uniq, indexBy } from 'remeda'
import { md } from '../common/Channel'
import { colMdValuesObj } from '../common/Metadata'
import ContainerDimensions from 'react-container-dimensions'
import { vennLayout, VennSet, vennSets, VennTypeCfg } from '../common/Venn'
import styled from 'styled-components'
import { Tip } from '../components/Tooltip'
import { VideoCommon } from '../common/RecfluenceApi'
import { Video, Videos } from '../components/Video'
import { BlobIndex, blobIndex } from '../common/BlobIndex'
import { useQuery } from '../common/QueryString'
import { useLocation } from '@reach/router'
import ReactTooltip from 'react-tooltip'
import { TextSection } from '../components/Markdown'
import { FilterHeader, FilterPart } from '../components/FilterCommon'
import { FilterState, InlineValueFilter } from '../components/ValueFilter'
import { Tag } from '../components/Channel'
import { entries, mapEntries, minBy, orderBy, takeRandom, values } from '../common/Pipe'
import { VideoSettings } from 'styled-icons/material'
import { circleToRect, cropTransform, getBounds } from '../common/Bounds'

interface Rec {
  fromVideoId: string
  toVideoId: string
  day: string
  label: string
  accounts: string[]
  fromVideoTitle: string
  fromChannelId: string
  fromChannelTitle: string
  fromChannelLogo?: string
  toVideoTitle: string
  toChannelId: string
  toChannelTitle: string
  toChannelLogo?: string
}

type RecVideo = Omit<Rec, 'fromVideoId' | 'fromVideoTitle' | 'day'> & { recs: Rec[], id: string }
type RecGroup = Pick<Rec, 'toChannelId' | 'toChannelTitle' | 'toChannelLogo'> & { id: string, groupAccounts: string[], videoRecs: RecVideo[] }
const isRec = (o: any): o is Rec => o.fromVideoId !== undefined && o.toVideoId !== undefined
const isRecVideo = (o: any): o is RecVideo => o.groupAccounts !== undefined && o.recs !== undefined
const isRecGroup = (o: any): o is RecGroup => o.toChannelId !== undefined && o.videoRecs !== undefined

type RecVennKey = Pick<Rec, 'label' & 'from_video_id'>

interface QueryState {
  label?: string,
  videoId?: string
  accounts?: string[]
}

const tagMd = colMdValuesObj(md, 'tags')

const SvgStyle = styled.svg`
  isolation: isolate;
  circle.set {
    opacity: 1;
    mix-blend-mode: multiply;
  }
  .label {
    fill: #eee;
    text-anchor: middle;
    font-size: 2em;
    font-weight: bold;
    pointer-events : none;
    text-shadow: 2px 2px 10px #000, 2px 2px 8px #000, 2px 2px 4px #000, 2px 2px 2px #000;
  }
  circle.row {
    fill:#fff;
    opacity: 0.1;
    stroke: #000;
    stroke-opacity: 0.7;
  }
`
const tipId = 'rec'


interface RecState {
  groups: RecGroup[]
  sets: VennSet<RecGroup>[]
  byId: Record<string, RecVideo>
  fromVideos: VideoCommon[]
}

const PersonalizationPage = () => {
  const [recIdx, setRecIdx] = useState<BlobIndex<Rec, RecVennKey>>(null)
  const [rs, setRecState] = useState<RecState>(null)
  const [q, setQuery] = useQuery<QueryState>(useLocation(), navigateNoHistory)

  const label = q.label ?? (recIdx ? first(recIdx.cols.label.distinct) : null)
  const accounts = q.accounts ?? ['Fresh', 'PartisanLeft', 'PartisanRight']
  const filterAccounts = (acc: string[]) => acc.filter(a => accounts.includes(a))
  const renameAccounts = (acc: string[]) => acc.map(a => a == 'MainstreamNews' ? 'Mainstream News' : a)

  useEffect(() => { blobIndex<Rec, RecVennKey>("us_recs").then(setRecIdx) }, [])
  useEffect(() => {
    if (!recIdx || !label) return
    recIdx.getRows(q.videoId ? { fromVideoId: q.videoId } : { label }).then((d: Rec[]) => {
      const recs = d.map(r => ({ ...r, accounts: renameAccounts(r.accounts) }))
        .map(r => ({ ...r, groupAccounts: filterAccounts(r.accounts).sort() }))
      const groups = entries(
        groupBy(recs, r => `${r.groupAccounts.join(':')}|${r.toChannelId}`)
      ).map(([id, recs]) => {
        const r = recs[0]
        const group = {
          ...pick(r, ['toChannelId', 'toChannelTitle', 'toChannelLogo']),
          accounts: pipe(recs, flatMap(r => r.accounts), uniq()).sort(),
          groupAccounts: r.groupAccounts, id
        }

        // group recs to the same videos
        const videoRecs = mapEntries(groupBy(recs.map(r => ({ ...r, id: `${id}|${r.toVideoId}` })), r => r.id), (id, recs) => {
          const { day, fromVideoId, fromVideoTitle, ...r } = recs[0]
          const recVideo: RecVideo = { ...r, recs, id }
          return recVideo
        })
        return { id, ...group, videoRecs }
      })

      const sets = vennSets(groups, {
        getKey: (r) => r.id,
        getSets: (r) => r.groupAccounts,
        getSize: (r) => isRecVideo(r) ? r.recs.length : null,
        getChildren: (r) => r.videoRecs
      })

      const byId = pipe(
        flatMap(groups, r => r.videoRecs),
        indexBy(r => r.id)
      )

      const fromVideos = mapEntries(groupBy(d, d => d.fromVideoId), (_, recs) => {
        const r = recs[0]
        const v: VideoCommon = ({
          videoId: r.fromVideoId,
          videoTitle: r.fromVideoTitle,
          channelId: r.fromChannelId,
          channelTitle: r.fromChannelTitle,
          channelLogo: r.fromChannelLogo
        })
        return v
      })

      setRecState({ groups, sets, byId, fromVideos })
      delay(1000).then(() => ReactTooltip.rebuild())
    })
  }, [recIdx, JSON.stringify(q)])

  const setRecFilter = (f: FilterState<Rec>) => setQuery({ accounts: f.accounts })
  const availableVideoIds = recIdx?.cols.fromVideoId?.distinct

  return <Layout>
    <PurposeBanner>
      <p>YouTube's recommended videos are tailored for each user taking into account watch history. We created 15 personas, each with their own watch history to see how YouTube's personalization works. </p>
    </PurposeBanner>
    <MinimalPage>
      <TextSection style={{ marginBottom: '1em' }}>
        The <b>Recommendation Venn</b> bellow, allows you to compare personalized recommendations shown to different accounts.
      </TextSection>
      <FilterHeader>
        <FilterPart>
          Recommendations seen by accounts <InlineValueFilter md={md}
            filter={{ accounts }}
            onFilter={setRecFilter}
            rows={rs?.groups} />
        </FilterPart>
      </FilterHeader>

      <div style={{ margin: '0 auto', maxWidth: '1000px' }}>
        {rs?.fromVideos && <div style={{ marginBottom: '1em' }}>
          <h3>Watching:</h3>
          <Videos videos={rs.fromVideos} showChannels showThumb style={{ marginLeft: '1em' }} />
          {availableVideoIds && <div>
            <button onClick={() => {
              const videoId = takeRandom(availableVideoIds)
              return setQuery({ videoId, label: null })
            }}>Show Random Video</button>
          </div>}
        </div>}
        <ContainerDimensions>
          {({ width }) => {
            if (!rs?.sets?.length) return <></>
            const size = Math.min(1000, width)
            const chart = vennLayout(rs.sets, { width: size, height: size, padding: 5 })
            const circles = chart.filter(c => c.circle)
            const bounds = getBounds(circles.map(c => circleToRect(c.circle)))

            const rowCircles = flatMap(chart, c => c.circles)
            return <SvgStyle width={bounds.w} height={bounds.h}>
              <defs>
                {uniq(rowCircles.map(r => r.r)).map(r => <clipPath key={r} id={`clip-${r}`}><circle r={r} /></clipPath>)}
              </defs>

              <g transform={cropTransform(bounds)}>
                {circles.map(c => <circle key={c.key} className='set'
                  cx={c.circle.cx} cy={c.circle.cy} r={c.circle.r} fill={tagMd[c.key]?.color} />
                )}

                {chart.map(c => <g key={c.key} transform={`translate(${c.offset.x}, ${c.offset.y})`}>
                  {c.circles.map(r => {
                    const id = r.data.id
                    const tipData = isRecVideo(r.data) ? id : null
                    return <g key={id} transform={`translate(${r.cx}, ${r.cy})`}>
                      {isRecGroup(r.data) && r.data.toChannelLogo &&
                        <image
                          x={-r.r} y={-r.r} width={r.r * 2}
                          href={r.data.toChannelLogo} clipPath={`url(#clip-${r.r})`}
                          data-title={r.data.toChannelTitle}
                        />}
                      {<circle
                        className='row'
                        r={r.r}
                        data-for={tipData && tipId} data-tip={tipData} />}
                    </g>
                  })}
                </g>)}

                {circles.map(c => <text key={c.key}
                  className='label'
                  dy='0.35em' x={c.txtCenter.x} y={c.txtCenter.y}>
                  {tagMd[c.key]?.label ?? c.key}
                </text>)}
              </g>


            </SvgStyle>
          }}
        </ContainerDimensions>
      </div>

      <Tip id={tipId} getContent={(id) => {
        const r = rs?.byId?.[id]
        if (!r) return <></>
        const v: VideoCommon = {
          videoId: r.toVideoId,
          videoTitle: r.toVideoTitle,
          channelId: r.toChannelId,
          channelTitle: r.toChannelTitle,
          channelLogo: r.toChannelLogo
        }
        return <div style={{ maxWidth: '40em', width: '100%' }}>
          <div style={{ marginBottom: '1em' }}>Shown to {r.accounts.map(a => <Tag key={a} style={{ marginRight: '0.3em' }} label={tagMd[a]?.label ?? a} color={tagMd[a]?.color} />)}</div>
          <Video v={v} showChannel showThumb />
        </div>
      }} />
    </MinimalPage>
  </Layout>
}

export default PersonalizationPage