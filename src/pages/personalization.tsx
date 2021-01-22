import React, { PropsWithChildren, useEffect, useState, FunctionComponent as FC, CSSProperties } from 'react'
import Layout, { FlexRow, MinimalPage, NarrowSection, styles } from '../components/Layout'
import PurposeBanner from '../components/PurposeBanner'
import { dateFormat, delay, navigateNoHistory } from '../common/Utils'
import { first, flatMap, groupBy, pick, pipe, uniq, indexBy, mapValues, take, sortBy } from 'remeda'
import { Channel, getChannels, md } from '../common/Channel'
import { colMdValuesObj } from '../common/Metadata'
import ContainerDimensions from 'react-container-dimensions'
import { vennLayout, VennSet, vennSets, VennTypeCfg } from '../common/Venn'
import styled from 'styled-components'
import { Tip } from '../components/Tooltip'
import { VideoCommon } from '../common/RecfluenceApi'
import { Video, VideoA, Videos } from '../components/Video'
import { BlobIndex, blobIndex } from '../common/BlobIndex'
import { useQuery } from '../common/QueryString'
import { useLocation } from '@reach/router'
import ReactTooltip from 'react-tooltip'
import { TextSection } from '../components/Markdown'
import { FilterHeader, FilterPart } from '../components/FilterCommon'
import { FilterState, InlineValueFilter } from '../components/ValueFilter'
import { ChannelTitle, Tag } from '../components/Channel'
import { entries, mapEntries, minBy, orderBy, takeRandom, values } from '../common/Pipe'
import { circleToRect, offsetTransform, Dim, getBounds } from '../common/Bounds'
import { RotateContent } from '../components/RotateContent'
import { videoThumb } from '../common/Video'
import { shuffle } from 'd3'
import { Popup } from '../components/Popup'
import PersonalizationChart from '../components/PersonalizationChart'

interface Rec {
  fromVideoId: string
  toVideoId: string
  day: string
  label: string
  accounts: string[]
  fromVideoTitle: string
  fromChannelId: string
  fromChannelTitle: string
  toVideoTitle: string
  toChannelId: string
  toChannelTitle: string
}

interface Watch {
  account: string
  updated: string
  videoId: string
  videoTitle: string
  channelId: string
  channelTitle: string
}
type WatchKey = Pick<Watch, 'updated'>

type RecVideo = Omit<Rec, 'fromVideoId' | 'fromVideoTitle' | 'day'> & { recs: Rec[], id: string }
type RecGroup = Pick<Rec, 'toChannelId' | 'toChannelTitle'> & { id: string, groupAccounts: string[], videoRecs: RecVideo[] }
const isRec = (o: any): o is Rec => o.fromVideoId !== undefined && o.toVideoId !== undefined
const isRecVideo = (o: any): o is RecVideo => o.groupAccounts !== undefined && o.recs !== undefined
const isRecGroup = (o: any): o is RecGroup => o.toChannelId !== undefined && o.videoRecs !== undefined

type RecVennKey = Pick<Rec, 'label' & 'from_video_id'>


//#region Page

const tagMd = colMdValuesObj(md, 'tags')
const tipId = 'rec'

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

interface QueryState {
  label?: string
  videoId?: string
  accounts?: string[]
  openAccount: string
}
interface RecState {
  groups: RecGroup[]
  sets: VennSet<RecGroup>[]
  byId: Record<string, RecVideo>
  fromVideos: (VideoCommon & { days: string[] })[]
}

const PersonalizationPage = () => {
  const [recIdx, setRecIdx] = useState<BlobIndex<Rec, RecVennKey>>(null)
  const [watchIdx, setWatchIdx] = useState<BlobIndex<Watch, WatchKey>>(null)
  const [recState, setRecState] = useState<RecState>(null)
  const [q, setQuery] = useQuery<QueryState>(useLocation(), navigateNoHistory)
  const [chans, setChannels] = useState<Record<string, Channel>>()
  const [watches, setWatches] = useState<Record<string, Watch[]>>(null)

  const label = q.label ?? (recIdx ? first(recIdx.cols.label.distinct) : null)
  const accounts = q.accounts ?? ['Fresh', 'PartisanLeft', 'PartisanRight']
  const filterAccounts = (acc: string[]) => acc.filter(a => accounts.includes(a))
  const renameAccounts = (acc: string[]) => acc.map(a => a == 'MainstreamNews' ? 'Mainstream News' : a)

  useEffect(() => {
    getChannels().then(chans => setChannels(indexBy(chans, c => c.channelId)))
    blobIndex<Watch, WatchKey>("us_watch").then(setWatchIdx)
    blobIndex<Rec, RecVennKey>("us_recs").then(setRecIdx)
  }, [])

  useEffect(() => {
    if (!recIdx || !label || !watchIdx) return;
    (async () => {
      const rawWatches = await watchIdx.rowsWith([], {
        parallelism: 4,
        // complete when we have at least one video for each account
        isComplete: (rs) => entries(groupBy(rs, r => r.account)).length >= watchIdx.cols.account.distinct.length,
        order: 'desc'
      })
      const watches = mapValues(groupBy(rawWatches, r => r.account), ws => shuffle(ws))
      setWatches(watches)

      const rawRecs = await recIdx.rows(q.videoId ? { fromVideoId: q.videoId } : { label })
      const recs = rawRecs.map(r => ({ ...r, accounts: renameAccounts(r.accounts) }))
        .map(r => ({ ...r, groupAccounts: filterAccounts(r.accounts).sort() }))
      const groups = entries(
        groupBy(recs, r => `${r.groupAccounts.join(':')}|${r.toChannelId}`)
      ).map(([id, recs]) => {
        const r = recs[0]
        const group = {
          ...pick(r, ['toChannelId', 'toChannelTitle']),
          accounts: pipe(recs, flatMap(r => r.accounts), uniq()).sort(),
          groupAccounts: r.groupAccounts, id
        }

        // group recs to the same videos
        const videoRecs = mapEntries(groupBy(recs.map(r => ({ ...r, id: `${id}|${r.toVideoId}` })), r => r.id), (recs, id) => {
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

      const fromVideos = mapEntries(groupBy(rawRecs, d => d.fromVideoId), (recs) => {
        const r = recs[0]
        const v = ({
          videoId: r.fromVideoId,
          videoTitle: r.fromVideoTitle,
          channelId: r.fromChannelId,
          channelTitle: r.fromChannelTitle,
          days: uniq(recs.map(r => r.day))
        })
        return v
      })

      setRecState({ groups, sets, byId, fromVideos })
      delay(1000).then(() => ReactTooltip.rebuild())
    })()
  }, [recIdx, watchIdx, JSON.stringify(q)])

  const setRecFilter = (f: FilterState<Rec>) => setQuery({ accounts: f.accounts })
  const availableVideoIds = recIdx?.cols.fromVideoId?.distinct

  return <Layout>
    <PurposeBanner>
      <p>YouTube's recommended videos are tailored for each user taking into account watch history. We created 15 personas, each with their own watch history to see how YouTube's personalization works. </p>
    </PurposeBanner>
    <MinimalPage>
      <TextSection style={{ marginBottom: '1em', marginTop: '2em' }}>
        Here is a <b>history of videos watched by each persona</b>. Personas watch video's in channels with a matching classification (e.g. The socialist persona watched only videos in Socialist channels). Each day, a list of videos was selected at random, proportional to views within the previous 7 days.
      </TextSection>

      <div style={{ display: 'flex', flexWrap: 'wrap', fontSize: '1rem' }}>
        {watches && sortBy(entries(watches), ([account, _]) => tagMd[account]?.label).map(([account, ws]) => {
          const size = { w: 300, h: 320 }
          const md = tagMd[account]
          return <div key={account} style={{ margin: '1em' }}>
            <FlexRow style={{ marginBottom: '0.5em' }}>
              <Tag label={`${md?.label ?? account}`} color={md?.color} />
              <a onClick={() => setQuery({ openAccount: account })}>history</a>
            </FlexRow>
            <RotateContent
              data={ws}
              size={size}
              getDelay={() => 4000 + Math.random() * 1000}
              style={{}}
              template={(w: Watch) => {
                if (!w) return <></>
                const c = chans?.[w.channelId] ?? { channelId: w.channelId, channelTitle: w.channelTitle }
                return <VideoTile w={w} c={c} size={size} />
              }} />
          </div>
        })}
      </div>

      {recState?.sets && <>
        <TextSection style={{ marginBottom: '1em', marginTop: '5em' }}>
          Here are some example recommendations from videos all personas have watched on the same day. Overlapping sections are recommendations seen by multiple personas.
        </TextSection>
        <NarrowSection>
          <FilterHeader>
            <FilterPart>
              Recommendations seen by accounts <InlineValueFilter md={md}
                filter={{ accounts }}
                onFilter={setRecFilter}
                rows={recState?.groups} />
              when watching videos:
          </FilterPart>
          </FilterHeader>
        </NarrowSection>

        {recState?.fromVideos && <div style={{ marginBottom: '1em' }}>
          <Videos
            videos={recState.fromVideos}
            channels={chans}
            contentBelow={v => <span>Watched {v.days.map(d => <span key={d} style={{ marginRight: '1em' }}>{dateFormat(d)}</span>)}</span>}
            showChannels showThumb
            style={{ margin: '0 auto', width: 'fit-content' }} />
        </div>}

        <div style={{ margin: '0 auto', maxWidth: '1000px' }}>
          <ContainerDimensions>
            {({ width }) => {
              return <RecVennChart channels={chans} sets={recState.sets} width={width} />
            }}
          </ContainerDimensions>
        </div>

        {availableVideoIds && <button
          style={{ ...styles.centerH, margin: '3em auto', display: 'block' }}
          onClick={() => setQuery({ videoId: takeRandom(availableVideoIds), label: null })}>
          Show Random Video
            </button>
        }
      </>}


      <Tip id={tipId} getContent={(id) => {
        const r = recState?.byId?.[id]
        if (!r) return <></>
        const v: VideoCommon = {
          videoId: r.toVideoId,
          videoTitle: r.toVideoTitle,
          channelId: r.toChannelId,
          channelTitle: r.toChannelTitle
        }
        return <div style={{ maxWidth: '40em', width: '100%' }}>
          <div style={{ marginBottom: '1em' }}>Shown to {r.accounts.map(a => <Tag key={a} style={{ marginRight: '0.3em' }} label={tagMd[a]?.label ?? a} color={tagMd[a]?.color} />)}</div>
          <Video v={v} showChannel showThumb />
        </div>
      }} />
    </MinimalPage>

    <TextSection style={{ marginBottom: '1em', marginTop: '5em' }}>
      The overall % of recommendations from personas (left) to channels (top) is shown bellow.
    </TextSection>

    <PersonalizationChart />

    <Popup isOpen={q.openAccount != null} onRequestClose={() => setQuery({ openAccount: null })}>
      {q.openAccount && <AccountVideos idx={watchIdx} channels={chans} account={q.openAccount} />}
    </Popup>
  </Layout>
}
export default PersonalizationPage

//#endregion

//#region VideoTile

const videoOverlayStyle: CSSProperties = {
  fontSize: '0.9em',
  left: '0px',
  top: '0px',
  padding: "0.2em 0.8em 0em",
  minWidth: '2em',
  height: '2em',
  position: 'absolute',
  fontWeight: 'bolder',
  backgroundColor: 'rgba(250, 250, 250, 0.9)',
  color: '#333',
  textAlign: 'center',
  borderRadius: '2em',
  boxShadow: '0px 1px 6px 2px #444'
}

const VideoTileStyle = styled.div`
  position: relative;
  .title {
    position:absolute;
    width:100%;
    top: 195px;
    left: 0px;
    background-color: rgba(0, 0, 0, 0.8);
    height: 45px;
    overflow:hidden;
    font-weight:bold;
  }
  .channel {
    margin-top:15px;
    color: var(--fg2);
  }
`
interface VideoTileProps {
  w: Watch
  size: Dim
  c: Channel
}
const VideoTile: FC<VideoTileProps> = ({ w, size, c }) => <VideoTileStyle>
  <VideoA id={w.videoId}><img src={videoThumb(w.videoId, 'high')} style={{ width: size.w }} /></VideoA>
  <div className="title">{w.videoTitle}</div>
  {c && <ChannelTitle className='channel' c={c} titleStyle={{ fontSize: '1rem' }} logoStyle={{ width: '50px' }} />}
  <div style={videoOverlayStyle}>watched on {dateFormat(w.updated)}</div>
</VideoTileStyle>

//#endregion

//#region Venn

interface RecVennProps {
  width: number
  sets: VennSet<RecGroup>[]
  channels: Record<string, Channel>
}
const RecVennChart: FC<RecVennProps> = ({ width, sets, channels }) => {
  const size = Math.min(1000, width)
  const vennCfg = { width: size, height: size, padding: 20 }
  const chart = vennLayout(sets, vennCfg)
  const circles = chart.filter(c => c.circle)
  const bounds = getBounds(circles.map(c => circleToRect(c.circle)), vennCfg.padding)

  const rowCircles = flatMap(chart, c => c.circles)
  return <SvgStyle width={bounds.w} height={bounds.h}>
    <defs>
      {uniq(rowCircles.map(r => r.r)).map(r => <clipPath key={r} id={`clip-${r}`}><circle r={r} /></clipPath>)}
    </defs>

    <g transform={offsetTransform(bounds)}>
      {circles.map(c => <circle key={c.key} className='set'
        cx={c.circle.cx} cy={c.circle.cy} r={c.circle.r} fill={tagMd[c.key]?.color} />
      )}

      {chart.map(c => <g key={c.key} transform={`translate(${c.offset.x}, ${c.offset.y})`}>
        {c.circles.map(r => {
          const id = r.data.id
          const tipData = isRecVideo(r.data) ? id : null
          const toChan = channels?.[r.data.toChannelId]
          return <g key={id} transform={`translate(${r.cx}, ${r.cy})`}>
            {isRecGroup(r.data) && toChan?.logoUrl &&
              <image
                x={-r.r} y={-r.r} width={r.r * 2}
                href={toChan.logoUrl} clipPath={`url(#clip-${r.r})`}
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
}

//#endregion

//#region AccountVideos

interface AccountVideosProps {
  account: string
  idx: BlobIndex<Watch, WatchKey>
  channels: Record<string, Channel>
}
const AccountVideos: FC<AccountVideosProps> = ({ account, idx, channels }) => {
  const [watch, setWatch] = useState<Watch[]>(null)

  useEffect(() => {
    if (!account || !idx) {
      setWatch(null)
      return
    }
    idx.rows().then(ws => {
      const accountVids = pipe(ws.filter(w => w.account == account), orderBy(w => w.updated, 'desc'))
      return setWatch(accountVids)
    })
  }, [account, idx])

  return watch && channels && <Videos videos={watch} channels={channels}
    showChannels showThumb showTags
    videoStyle={{ position: 'relative' }}
    contentBelow={v => <span style={videoOverlayStyle}>watched {dateFormat(v.updated)}</span>}
  />
}

//#endregion