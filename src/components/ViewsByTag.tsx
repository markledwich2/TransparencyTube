import * as d3 from 'd3'
import { Uri } from '../common/Uri'
import _ from 'lodash'
import { useState, useEffect, useRef, useMemo } from 'react'
import React from 'react'
import { compactInteger } from 'humanize-plus'
import { getJsonl, preloadImages } from '../common/Utils'
import { InlineSelect } from './InlineSelect'
import ReactTooltip from 'react-tooltip'
import { ChannelData, ChannelMeasures, TagMd, tagsMd } from '../common/Data'
import { ChannelInfo } from './ChannelTip'



interface ChannelNode {
  type: 'root' | 'tag' | 'channel'
  title: string
  children?: ChannelNode[]
  channel?: ChannelData
  color?: string
  key?: string
  val?: number
  img?: string
}

interface Graph<N, L> {
  nodes: N
  links: L
}


async function getChannels(): Promise<ChannelData[]> {
  const path = new Uri('https://pyt.blob.core.windows.net/data/results')
  const channels = await getJsonl<ChannelData>(path.addPath('vis_channel_stats2.jsonl.gz').url)
  return channels
}

const measures: { value: keyof ChannelMeasures, label: string }[] = [
  { value: 'channelViews', label: 'total views' },
  { value: 'views7', label: 'daily views (last 7 days)' },
  { value: 'views30', label: 'daily views (last 30 days)' },
  { value: 'views365', label: 'daily views (last 365 days)' },
  { value: 'subs', label: 'subscribers' }
]

export const ViewsByTagPage = () => {
  const [channels, setChannels] = useState<ChannelData[]>()
  useEffect(() => { getChannels().then((channels) => setChannels(channels)) }, [])
  return channels ? <TagsChart channels={channels} /> : <></>
}

const TagsChart = ({ channels }: { channels: ChannelData[] }) => {
  const [measure, setMeasure] = useState<keyof ChannelMeasures>('views7')
  const [imgLoaded, setImgLoaded] = useState(false)

  const chanById = useMemo(() => _.keyBy(channels, c => c.channelId), [channels])

  const val = (c: ChannelData) => {
    return c[measure] ?? 0
  }
  const sum = (cs: ChannelData[]) => _.sumBy(cs, val)
  const totalSize = sum(channels)

  const tagData = _(tagsMd).map(t => ({
    tag: t,
    channels: _(channels).filter(c => c.tags.includes(t.value) && val(c) != null)
      .map(c => ({
        type: 'channel',
        title: c.channelTitle,
        channel: c,
        color: t.color,
        val: val(c),
        key: `${t.value}|${c.channelId}`
      } as ChannelNode))
      .value()
  })).orderBy(n => _.sumBy(n.channels, c => c.val), 'desc')
    .value()

  const packSize = 500
  const tagNodes = tagData.map(t => {

    const root: ChannelNode = {
      type: 'root',
      title: 'root',
      children: t.channels
    }

    const nodes = _(d3.pack<ChannelNode>()
      .padding(1)
      .size([packSize, packSize])
      .radius(d => Math.sqrt(d.data.val) * 0.015)
      (d3.hierarchy(root, n => n.children)).descendants())

    const pad = 0
    let { x, y } = {
      x: {
        min: nodes.minBy(n => n.x - n.r),
        max: nodes.maxBy(n => n.x + n.r)
      },
      y: {
        min: nodes.minBy(n => n.y - n.r),
        max: nodes.maxBy(n => n.y + n.r)
      },
    }

    let dim = {
      x, y,
      size: Math.max((x.max.x + x.max.r) - (x.min.x - x.min.r) + pad, (y.max.y + y.max.r) - (y.min.y - y.min.r) + pad, 100)
    }

    return { tag: t.tag, nodes: nodes.value(), dim }
  })

  const maxSize = _(tagNodes).map(t => t.dim.size).max()
  const zoom = packSize / maxSize

  _(tagNodes).flatMap(t => t.nodes).forEach(n => {
    if (n.r * zoom > 10)
      n.data.img = n.data?.channel?.logoUrl
  })

  useEffect(() => {
    setImgLoaded(false)
    const images = _(tagNodes).flatMap(t => t.nodes).map(n => n.data.img).filter(i => i != null).value()
    preloadImages(images).then(() => setImgLoaded(true))
  }, [measure])

  console.log('TagsChart', imgLoaded)

  //return <>{tagData.map(t => <TagChart key={t.tag.value} data={t} size={size} relSize={relSize} />)}</>
  return <>
    <span>Channel <InlineSelect options={measures} defaultValue={'views7' as keyof ChannelMeasures} onChange={o => setMeasure(o)} /> by tag</span>
    <div style={{ display: 'flex', flexDirection: 'row', flexFlow: 'wrap' }}>
      {tagNodes.map(t =>
        <div key={t.tag.value} style={{ display: 'flex', flexDirection: 'column', padding: '10px 10px 30px', alignItems: 'center' }}>
          <div style={{ padding: '1px 10px 5px' }}>
            <h4>
              {t.tag.label ?? t.tag.value}
              <b style={{ paddingLeft: '8px', fontSize: '1.5em' }}>{compactInteger(_.sumBy(t.nodes, n => n.data.val ?? 0))}</b>
            </h4>
          </div>
          <TagPack {...t} {...{ zoom, packSize, imgLoaded }} />
        </div>
      )}
    </div>
    {imgLoaded && <ReactTooltip
      place='right' effect='solid'
      backgroundColor='var(--bg1)'
      border
      borderColor='var(--bg2)'
      getContent={(id: string) => id ? <ChannelInfo channel={chanById[id]} measure={measure} /> : <></>} />}
  </>
}


interface TagNodes {
  tag: TagMd
  nodes: d3.HierarchyCircularNode<ChannelNode>[]
  dim: {
    x: NodeMinMax
    y: NodeMinMax
    size: number
  }
}

interface NodeMinMax {
  min: d3.HierarchyCircularNode<ChannelNode>
  max: d3.HierarchyCircularNode<ChannelNode>
}

interface TagPackExtra {
  zoom: number, packSize: number, imgLoaded: boolean
}

const TagPack = ({ nodes, dim, zoom, imgLoaded }: {} & TagNodes & TagPackExtra) => {

  const size = dim.size * zoom
  const dx = -dim.x.min.x + dim.x.min.r
  const dy = -dim.y.min.y + dim.y.min.r
  //border: `1px solid #444`

  return <svg width={size} height={size} style={{}}>
    <g>
      {nodes.filter(n => n.data.type == 'channel').map(n => {
        const x = (n.x + dx) * zoom
        const y = (n.y + dy) * zoom
        const r = n.r * zoom
        return <g key={n.data.key}>
          <circle cx={x} cy={y} r={r} fill={n.data.color} data-tip={n.data.channel.channelId} />
          {imgLoaded && n.data.img &&
            <image x={x - r} y={y - r} width={r * 2}
              href={n.data.img} data-tip={n.data.channel.channelId} style={{ clipPath: 'circle()' }} />}
        </g>
      }
      )}
    </g>
  </svg>
}







