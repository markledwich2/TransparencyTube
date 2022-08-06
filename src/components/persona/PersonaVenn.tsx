import React, { useEffect, useState, FunctionComponent as FC, CSSProperties, useMemo, Fragment } from 'react'
import { flatMap, pick, uniq } from 'remeda'
import styled from 'styled-components'
import { getBounds, circleToRect, offsetTransform, pointTranslate, getTextWidth } from '../../common/Draw'
import { Channel, md } from '../../common/Channel'
import { Rec, RecGroup, isRecVideo, isRecGroup, RecVideo } from '../../common/Persona'
import { VideoCommon } from '../../common/RecfluenceApi'
import { VennSet, vennLayout, VennSetLayout } from '../../common/Venn'
import { Tag } from '../Channel'
import { Video } from '../Video'
import { styles } from '../Style'
import { logIfError, toJson } from '../../common/Utils'
import { AccountTag } from './PersonaBar'
import { Tip, useTip } from '../Tip'
import { videoUrl } from '../../common/Video'

export type RecVennKey = Pick<Rec, 'label' & 'from_video_id'>
const tagMd = md.channel.tags.val

interface RecVennProps {
  width: number,
  height?: number,
  sets: VennSet<RecGroup>[]
  channels: Record<string, Channel>
  videos: Record<string, RecVideo>
  debug?: boolean
}
export const PersonaVenn: FC<RecVennProps> = ({ width, height, sets, channels, videos, debug }) => {
  const size = Math.min(height, width)
  const vennCfg = { width: size, height: size, padding: 20 }

  const { chart, circles, bounds } = useMemo(() => {
    const chart = sets?.length > 0 ? (logIfError(() => vennLayout(sets, vennCfg)) ?? []) : []
    const circles = chart?.filter(c => c.circle)
    const bounds = circles && getBounds(flatMap(circles, c =>
      [circleToRect(c.circle)].concat(c.circles.map(d => pointTranslate(circleToRect(d), c.offset)))), vennCfg.padding) // get the bounds from all circles
    return { chart, circles, bounds }
  }, [toJson(vennCfg), sets, channels, videos])

  const videoTip = useTip<RecVideo>()

  const getCircleColor = (c: VennSetLayout<RecGroup>) => tagMd[c.key]?.color
  const rowCircles = chart && flatMap(chart, c => c.circles)

  return <div style={{ height: size, display: 'flex', alignItems: 'center' }}>
    {useMemo(() =>
      <SvgStyle width={bounds?.w} height={bounds?.h}>
        <defs>
          {rowCircles && uniq(rowCircles.map(r => r.r)).map(r => <clipPath key={r} id={`clip-${r}`}><circle r={r} /></clipPath>)}
        </defs>

        {circles && <g transform={offsetTransform(bounds)}>
          {circles.map(c => <circle key={c.key} className='set'
            cx={c.circle.cx} cy={c.circle.cy} r={c.circle.r} fill={getCircleColor(c)} />
          )}

          {chart.map(c => <g key={c.key} transform={`translate(${c.offset.x}, ${c.offset.y})`}>

            {c.circles.map(r => {
              const id = r.data.id
              const toChan = channels?.[r.data.toChannelId]

              const v = isRecVideo(r.data) && videos[id]
              let circleProps = isRecVideo(r.data) ? videoTip.eventProps(v, true) : {}
              if (!videoTip.isMobile)
                circleProps = { ...circleProps, onClick: () => window.open(videoUrl(v.toVideoId), 'yt') }

              return <g key={id} transform={`translate(${r.cx}, ${r.cy})`}>
                {isRecGroup(r.data) && toChan?.logoUrl &&
                  <image
                    x={-r.r} y={-r.r} width={r.r * 2}
                    href={toChan.logoUrl} clipPath={`url(#clip-${r.r})`}
                    data-title={r.data.toChannelTitle} />}
                {<circle
                  className='row'
                  r={r.r}
                  {...circleProps} />}
              </g>
            })}
          </g>)}

          {circles.map(c => {
            const label = (tagMd[c.key]?.label ?? c.key) + 'v1'
            const font = 'bold 1.2rem sans-serif'
            const renderBounds = 300
            return <g key={c.key}>
              <foreignObject className='tag' width={renderBounds} height={renderBounds} x={c.txtCenter.x - renderBounds / 2} y={c.txtCenter.y - renderBounds / 2}>
                <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <AccountTag account={c.key} style={{ font, fontSize: '1.3rem', opacity: '0.85', boxShadow: '5px 5px 20px #000' }} />
                </div>
              </foreignObject>
            </g>
          })}

          {debug && chart.map(c => <Fragment key={c.key}>
            <circle data-key={c.key} r={c.innerRadius} cx={c.txtCenter.x} cy={c.txtCenter.y} style={{ stroke: 'red', fill: 'none' }} />
            <circle data-key={c.key} r={3} cx={c.txtCenter.x} cy={c.txtCenter.y} style={{ fill: 'red' }} />
          </Fragment>)}

        </g>}
      </SvgStyle>
      , [chart, circles, bounds, size])}
    <Tip {...videoTip.tipProps}><PersonalizationVennTip v={videoTip.data} channel={videoTip.data && channels?.[videoTip.data.toChannelId]} /></Tip>
  </div>
}

const SvgStyle = styled.svg`
  isolation: isolate;
  circle.set {
    opacity: 1;
    mix-blend-mode: multiply;
  }

  circle.row {
    fill:#fff;
    opacity: 0.1;
    stroke: #000;
    stroke-opacity: 0.9;
    cursor: pointer;
  }
  text.tag {
    fill: #eee;
    text-anchor: middle;
    font-weight: bold;
    pointer-events : none;
  }
  rect.tag {
    opacity:0.7;
    transform: translate(-50%, -50%);
  }
  foreignObject.tag {
    pointer-events: none;
  }
`

export const PersonalizationVennTip: FC<{ v: RecVideo, channel: Channel }> = ({ v, channel }) => {
  if (!v) return <></>
  const vc: VideoCommon = {
    videoId: v.toVideoId,
    videoTitle: v.toVideoTitle,
    channelId: v.toChannelId,
    channelTitle: v.toChannelTitle
  }
  return <div style={{ maxWidth: '40em', width: '100%' }}>
    <div style={{ marginBottom: '0em' }}>Shown to {v.accounts.map(a =>
      <Tag key={a} style={{ marginRight: '0.3em', margin: '0.2em' }} label={tagMd[a]?.label ?? a} color={tagMd[a]?.color} />)}</div>
    <Video v={vc} c={channel} showChannel showThumb />
  </div>
}
