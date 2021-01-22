import React, { useEffect, useState, FunctionComponent as FC } from 'react'
import ContainerDimensions from 'react-container-dimensions'
import { compact, filter, first, flatMap, groupBy, indexBy, mapValues, pick, pipe, uniq } from 'remeda'
import styled from 'styled-components'
import { getBounds, getTextWidth, pointTranslate, Rect } from '../common/Bounds'
import { md } from '../common/Channel'
import { colMdValuesObj } from '../common/Metadata'
import { mapEntries, max, min, sumBy, values } from '../common/Pipe'
import { getJsonlResult as jRes } from '../common/RecfluenceApi'
import { numFormat, parseJson, toJson } from '../common/Utils'
import { Tag } from './Channel'
import { FlexCol, FlexRow, styles } from './Layout'
import { Markdown } from './Markdown'
import { scaleLinear } from '@visx/scale'
import ReactMarkdown from 'react-markdown'
import { UserCircle } from '@styled-icons/boxicons-solid'


interface RecStat {
  account: string
  month: string
  fromTag: string
  toTag?: string
  recs: number
  recsPortion: number
}

interface RecTag { tag: string, month: string, views: number }
interface RecMonth { month: string, views: number }
interface RecData { recs: RecStat[], tags: RecTag[], months?: RecMonth[] }
interface RecGroupKey { account: string, toTag: string }
const tagMd = { ...colMdValuesObj(md, 'tags'), ...{ Other: { value: 'Other', color: '#666', label: 'Non-political' } } }

interface PersonalizedStatsProps { }
const PersonalizationChart: FC<PersonalizedStatsProps> = ({ }) => {
  const [stats, setRecStats] = useState<RecData>({ recs: [], tags: [] })

  useEffect(() => {
    Promise.all([jRes<RecStat>('us_rec_stats'), jRes<RecTag>('us_rec_tag'), jRes<RecMonth>('us_rec_month')])
      .then(([recs, tags, months]) => setRecStats({
        recs: recs.map(r => ({ ...r, toTag: r.toTag ?? 'Other' })).filter(r => tagMd[r.toTag]),
        tags, months
      }))
  }, [])

  const selectedMonths: string[] = null
  const filterMonths = <T extends { month: string }>(item: T) => selectedMonths == null || selectedMonths.includes(item.month)

  const groups = pipe(
    stats.recs.filter(filterMonths),
    groupBy(r => toJson({ account: r.account, toTag: r.toTag }))
  )

  const aggGroup = mapValues(groups, (gs, j) => {
    const k: RecGroupKey = parseJson(j)
    const accountRecs = stats.recs.filter(r => r.account == k.account)
    const pctOfAccountRecs = sumBy(gs, g => g.recs) / sumBy(accountRecs, g => g.recsPortion)
    const tagViews = sumBy(stats.tags.filter(t => filterMonths(t) && t.tag == k.toTag), m => m.views)
    const totalTagViews = sumBy(stats.months.filter(filterMonths), m => m.views)
    const ppVsTagViews = k.toTag != 'Other' && pctOfAccountRecs - tagViews / totalTagViews
    return { ...k, pctOfAccountRecs, ppVsTagViews }
  })

  const statsByAccount: Record<string, VisRow[]> = pipe(
    mapEntries(aggGroup, (g, j) => {
      const k: RecGroupKey = parseJson(j)
      const ppVsFresh = g.pctOfAccountRecs - aggGroup[toJson({ account: 'Fresh', toTag: k.toTag })]?.pctOfAccountRecs
      return { ...g, ppVsFresh }
    }),
    groupBy(r => r.account)
  )

  const cfg = { font: '14px sans-serif' }
  const legend = layoutLegend(stats, { pad: 10, between: 10, iconWidth: 20, itemHeight: 25, labelFont: `bold ${cfg.font}` })
  const referenceBars = indexBy(legend.items.map(i => ({ tag: i.tag, ...i.rect })), i => i.tag)
  const getRefBar = (r: VisRow) => {
    return referenceBars[r.toTag]
  }

  return <div style={{ font: cfg.font }}>
    <ContainerDimensions >
      {({ width }) => {
        const charts = layoutCharts(statsByAccount, getRefBar,
          { width: (width - legend.bounds.w - 40) / 3, height: legend.bounds.h, font: legend.cfg.labelFont })
        return <div>
          {charts.map((accountCharts, i) => {
            const account = accountCharts.account
            const accountMd = tagMd[account]
            return <div key={account} style={{ marginTop: i > 0 ? '2em' : 0 }}>
              <Tag color={accountMd?.color} style={{ fontSize: '1.2em' }}>{accountMd?.label ?? account} <UserCircle style={styles.inlineIcon} /></Tag>
              <FlexRow>
                <Panel title='Recommended video tag'>
                  <SvgStyle height={legend.bounds.h} width={legend.bounds.w}>
                    <symbol id='video-icon'>
                      <path transform='scale(0.035)' d="M480,64v32h-64V64H96v32H32V64H0v384h32v-32h64v32h320v-32h64v32h32V64H480z M96,352H32v-64h64V352z M96,224H32v-64h64V224z
         M480,352h-64v-64h64V352z M480,224h-64v-64h64V224z"/>
                    </symbol>
                    <g style={{ font: legend.cfg.labelFont }}>
                      {legend.items.map(l => {
                        const r = l.rect
                        return <g transform={`translate(${r.x}, ${r.y})`}>
                          <rect key={l.tag} rx={5} width={r.w} height={r.h} style={{ fill: r.fill }}></rect>
                          <use xlinkHref='#video-icon' x={r.w - legend.cfg.iconWidth - 3} y={5} />
                          <text className='tag' x={10} y={r.h - 6}>{l.label}</text>
                        </g>
                      })}
                    </g>
                  </SvgStyle>
                </Panel>
                <FlexRow style={{ overflowX: 'auto' }}>
                  {accountCharts.charts.map(c => <Panel title={c.title}>
                    <SvgStyle height={c.h} width={c.w}>
                      <g style={{ font: legend.cfg.labelFont }} transform={`translate(${c.x}, ${c.y})`} >
                        {c.lines.map((l, i) => <line key={i} {...l} className="tick" />)}
                        {c.bars.map(b => <rect key={b.row.toTag} width={b.w} height={b.h}
                          x={b.x} y={b.y}
                          style={{ fill: b.color }}></rect>)}
                        {c.labels.map(l => <text
                          className={`label ${l.inside ? 'inside' : 'outside'}`}
                          data-tag={l.row.toTag}
                          x={l.x} y={l.y}>{l.label}</text>)}
                      </g>
                    </SvgStyle>
                  </Panel>)}
                </FlexRow>
              </FlexRow>
            </div>
          })}
        </div>
      }}
    </ContainerDimensions>
  </div>
}
export default PersonalizationChart

interface PanelProps { title: string, }
const Panel: FC<PanelProps> = ({ title, children }) => {
  return <FlexCol>
    <div style={{
      height: '4em', overflow: 'hidden',
      fontSize: '1.3em',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
    }}><ReactMarkdown>{title}</ReactMarkdown></div>
    <div>{children}</div>
  </FlexCol>
}

const SvgStyle = styled.svg`
  text.tag, path {
      fill:#ddd;
  }

  text.label {
    fill:var(--fg1);
    &.inside {
      fill:#ddd;
    }
  }

  line.tick {
    stroke: var(--bg4);
    stroke-width: 1px;
  }
`

interface VisRow {
  pctOfAccountRecs: number
  ppVsTagViews: number
  ppVsFresh: number
  account: string
  toTag: string
}

interface Scale { min?: number, max?: number }
interface BarLayout { title: string, x: Scale }

const layoutCharts = (data: Record<string, VisRow[]>, referenceBar: (r: VisRow) => Rect, cfg: { width: number, height: number, font: string }) => {
  const allValues = <T,>(getValue: (r: VisRow) => T) => flatMap(values(data), rs => rs.map(getValue))
  const measureCfg = {
    pctOfAccountRecs: { title: '% of total persona’s recommendations', x: { min: 0 } } as BarLayout,
    ppVsTagViews: { title: "percentage point difference between **persona's recommendations** and **video views**", x: {} } as BarLayout,
    ppVsFresh: { title: "percentage point difference between **persona's recommendations** and an **anonymous viewer**", x: {} } as BarLayout
  }
  const measures = mapValues(measureCfg, (c, m) => {
    const all = allValues(r => r[m])
    const x = {
      min: c.x?.min ?? min(all),
      max: c.x?.max ?? max(all)
    }
    const scale = scaleLinear<number>({ range: [0, cfg.width], domain: [x.min, x.max] })
    return {
      ...c, x, scale
    }
  })

  const layout = mapEntries(data, (rows, account) => {
    const measureGroups = mapEntries(measures, (c, m, i) => {
      const xZero = c.scale(0)
      const bars = compact(rows.map((r) => {
        const value = r[m]
        const x = c.scale(value)
        const neg = value < 0
        const refBar = referenceBar(r)
        return refBar ? {
          x: neg ? x : xZero,
          y: refBar.y,
          w: Math.abs(x - xZero), h: refBar?.h,
          value, row: r,
          color: tagMd[r.toTag]?.color
        } : null
      }))

      const labels = bars.map(b => {
        const label = `${numFormat(b.value * 100)}%`
        const textW = getTextWidth(label, cfg.font)
        const pad = 5
        const inside = b.w > textW + pad * 2
        const neg = b.value < 0
        const x = inside
          ? (neg ? b.x + pad : b.x + b.w - textW - pad)
          : (neg ? b.x - pad - textW : b.x + b.w + pad)
        return { x, y: b.y + b.h - 7, label, inside, row: b.row }
      })

      const lines = [{ x1: xZero, y1: 0, x2: xZero, y2: cfg.height }]
      return { x: 0, y: 0, w: cfg.width, h: cfg.height, bars, labels, lines, title: c.title }
    })
    return { account, charts: measureGroups }
  })
  return layout
}

const layoutLegend = (stats: RecData, cfg: { pad: number; between: number; iconWidth: number; itemHeight: number; labelFont: string }) => {
  const legend = uniq(stats.recs.map(r => r.toTag)).filter(t => tagMd[t]?.color)
    .map((tag, i) => {
      const label = tagMd[tag]?.label ?? tag
      const labelW = getTextWidth(label, cfg.labelFont) + cfg.iconWidth + 20
      return ({
        tag, label,
        rect: { x: -labelW, y: (cfg.between + cfg.itemHeight) * i, w: labelW, h: cfg.itemHeight, fill: tagMd[tag]?.color }
      })
    })
  const legendBounds = getBounds(legend.map(l => l.rect), cfg.pad)
  const legendLayout = {
    bounds: pick(legendBounds, ['w', 'h']),
    items: legend.map(l => ({ ...l, rect: pointTranslate(l.rect, { x: -legendBounds.x, y: -legendBounds.y }) })),
    cfg
  }
  return legendLayout
}


