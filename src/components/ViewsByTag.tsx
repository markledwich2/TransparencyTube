import * as d3 from 'd3'
import { Uri } from '../common/Uri'
import _ from 'lodash'
import { parseISO } from "date-fns"
import { useState, useEffect, useRef } from 'react'
import React from 'react'
import { descending } from 'd3'
import ContainerDimensions from 'react-container-dimensions'
import { ForceGraph2D, } from 'react-force-graph'
import { ForceGraphGenericInstance } from 'force-graph'

interface ChannelData {
  channelId: string
  title: string
  tags: string[]
  subCount: number
  channelVideoViews: number
  thumbnail: string
  lr: string
  publishedFrom: Date
  publishedTo: Date
  dailyViews: number
}

interface ChannelNode {
  type: 'root' | 'tag' | 'channel'
  title: string
  children?: ChannelNode[]
  channel?: ChannelData
  color?: string
  key?: string
  size?: number
}

interface Graph<N, L> {
  nodes: N
  links: L
}

interface TagMd { value: string, label?: string, color?: string }
const tagsMd: TagMd[] = [
  { value: 'AntiSJW', label: 'Anti-SJW', color: '#8a8acb' },
  { value: 'AntiTheist', label: 'Anti-theist', color: '#96cbb3' },
  { value: 'Conspiracy', color: '#e0990b' },
  { value: 'LateNightTalkShow', label: 'Late night talk show', color: '#00b1b8' },
  { value: 'Libertarian', color: '#ccc' },
  { value: 'MRA', color: '#003e78' },
  { value: 'Mainstream News', label: 'MSM', color: '#aa557f' },
  { value: 'PartisanLeft', label: 'Partisan Left', color: '#3887be' },
  { value: 'PartisanRight', label: 'Partisan Right', color: '#e0393e' },
  { value: 'QAnon', color: '#e55e5e' },
  { value: 'ReligiousConservative', label: 'Religious Conservative', color: '#41afa5' },
  { value: 'SocialJustice', label: 'Social Justice', color: '#56b881' },
  { value: 'Socialist', color: '#6ec9e0' },
  { value: 'WhiteIdentitarian', label: 'White Identitarian', color: '#b8b500' },
]

async function getChannels(): Promise<ChannelData[]> {

  const path = new Uri('https://pyt.blob.core.windows.net/data/results')
  const csvChannels = await d3.csv(path.addPath('vis_channel_stats.csv.gz').url)


  const num = (s: string | undefined | null) => s ? +s : null

  const channels = csvChannels.map(dbChannel => {
    const c = _.mapKeys(dbChannel, (_, k) => k.toLowerCase())
    try {
      return {
        channelId: c.channel_id,
        title: c.channel_title,
        tags: c.tags ? JSON.parse(c.tags) : [],
        subCount: num(c.subs),
        channelVideoViews: num(c.channel_views),
        thumbnail: c.logo_url,
        lr: c.lr,
        publishedFrom: parseISO(c.from_date ?? ""),
        publishedTo: parseISO(c.to_date ?? ""),
        dailyViews: num(c.video_views_daily)
      } as ChannelData
    }
    catch (ex) {
      console.log('error parsing channel row', JSON.stringify(c))
      throw ex
    }
  })

  return channels
}

export const ViewsByTagPage = () => {
  const [channels, setChannels] = useState<ChannelData[]>()
  useEffect(() => { getChannels().then((channels) => setChannels(channels)) }, [])
  return channels ? <TagsChart channels={channels} size={400} /> : <></>
}


const TagsChart = ({ channels, size }: { channels: ChannelData[], size: number }) => {
  const maxSize = _(channels).map(c => c.dailyViews).max()
  const relSize = 0.05

  const tagData = _(tagsMd).map(t => ({
    tag: t,
    channels: _(channels).filter(c => c.tags.includes(t.value))
      .map(c => ({
        type: 'channel',
        title: c.title,
        channel: c,
        color: t.color,
        size: c.dailyViews,
        key: `${t.value}|${c.channelId}`
      } as ChannelNode))
      .value()
  })).orderBy(n => _.sumBy(n.channels, c => c.size), 'desc')
    .value()

  //return <>{tagData.map(t => <TagChart key={t.tag.value} data={t} size={size} relSize={relSize} />)}</>
  return <div style={{ display: 'flex', flexDirection: 'row', flexFlow: 'wrap' }}>
    {tagData.map(t =>
      <div key={t.tag.value} style={{ display: 'flex', flexDirection: 'column', padding: '5px 0px' }}>
        <h3>{t.tag.label ?? t.tag.value}</h3>
        <div style={{ width: '300px', height: '300px' }}>
          <TagPack channels={t.channels} tag={t.tag} />
        </div>
      </div>
    )}
  </div>
}

interface TagChartOptions {
  size: number
  relSize: number
  data: { tag: TagMd, channels: ChannelNode[] }
}

const TagChart = ({ data, size, relSize }: TagChartOptions) => {
  const fgRef = useRef<ForceGraphGenericInstance<{}>>(null)

  const { tag, channels } = data
  var graph = {
    nodes: channels,
    links: []
  }

  useEffect(() => {
    const fg = fgRef.current
    if (!fg) return
    //fg.d3Force('center', d3.forceCenter(100, 100))
    fg.d3Force('charge', null)
    fg.d3Force('x', d3.forceX().strength(.1))
    fg.d3Force('y', d3.forceY().strength(.1))
    //fg.d3Force('charge', d3.forceManyBody().strength(1))
    fg.d3Force('collide', d3.forceCollide()
      .radius((d: any) => Math.sqrt(d.size * relSize / Math.PI * 0.3) + 3).strength(1.6).iterations(2))
  }, [])

  return <div>
    <h3>{tag.label ?? tag.value}</h3>
    <ForceGraph2D
      ref={fgRef as any}
      d3VelocityDecay={0.5}
      graphData={graph}
      height={size}
      width={size}
      warmupTicks={50}
      cooldownTicks={0}
      enablePointerInteraction={true}
      nodeRelSize={relSize}
      nodeVal={(n: ChannelNode) => n.size}
      nodeColor={(n: ChannelNode) => n.color}
      enableNodeDrag={false} enableZoomPanInteraction={false} />
  </div>
}

const TagPack = ({ tag, channels }: { tag: TagMd, channels: ChannelNode[] }) => {
  return <ContainerDimensions>
    {({ height, width }) => {

      console.log('svg size: ', width, height)

      const root: ChannelNode = {
        type: 'root',
        title: 'root',
        children: channels
      }

      //Initialize the circle pack layout
      const pack = d3.pack<ChannelNode>()
        .padding(1)
        .size([width, height])
        .radius(d => Math.sqrt(d.data.channel?.dailyViews ?? 1) * 0.015)
        (d3.hierarchy(root, n => n.children))

      const nodes = pack.descendants()

      return <svg width={width - 2} height={height - 2}>
        <g>
          {nodes.filter(n => n.data.type == 'channel').map(n =>
            <circle key={n.data.key} cx={n.x} cy={n.y} r={n.r} fill={n.data.color} ></circle>
          )}
        </g>
      </svg>
    }}
  </ContainerDimensions>

  // const x = canvas.getContext("2d")
  // x.clearRect(0, 0, width, height)

  // const nodes = pack.descendants()
  // nodes.filter(n => n.data.type == 'channel').forEach(d => {
  //   if (!d.data.color) return
  //   x.fillStyle = d.data.color
  //   x.beginPath()
  //   x.arc(d.x, d.y, d.r, 0, 2 * Math.PI, true)
  //   x.fill()
  //   x.closePath()
  // })

  // x.font = "bold 15px"

  // nodes.filter(c => c.data.type == 'tag').forEach(d => {
  //   x.font = 'Seg'
  //   x.fillStyle = '#333'
  //   const titleDim = x.measureText(d.data.title)
  //   x.fillText(d.data.title, d.x - titleDim.width / 2, d.y)
  // })
}


