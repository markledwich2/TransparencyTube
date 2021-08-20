import { useEffect, useState } from 'react'
import { compact, flatMap, groupBy, indexBy, mapValues, pick, uniq } from 'remeda'
import { getBounds, getTextWidth, pointTranslate, Rect } from '../../common/Draw'
import { md } from '../../common/Channel'
import { compactObj, entries, entriesToObj, keys, mapEntries, max, min, orderBy, sumBy, values } from '../../common/Pipe'
import { getJsonlResult as jRes } from '../../common/RecfluenceApi'
import { numFormat, parseJson, PartialRecord, toJson } from '../../common/Utils'
import { scaleLinear } from '@visx/scale'
import { filterIncludes } from '../ValueFilter'
import { FilterKeys } from '../../common/Types'

export const tagMd = { ...md.channel.tags.val, ...{ Other: { value: 'Other', color: '#666', label: 'Non-political' } } }

export const barMd = {
  source: {
    rec: 'Video Recommendations',
    feed: 'Home Page Videos'
  },
  measures: {
    pctOfAccountRecs: {
      title: '% of persona’s recommendations', shortTitle: '% of total', x: { min: 0 }
    } as BarLayout,
    vsPoliticalViewsPp: {
      title: "percentage point difference between **persona's recommendations** and the portion of views to political videos", shortTitle: '**vs political views**', x: {}
    } as BarLayout,
    vsFreshPp: {
      title: "percentage point difference between **persona's recommendations** and an **anonymous viewer**", shortTitle: '**vs anonymous**', x: {}
    } as BarLayout
  }
}

type RecSource = keyof typeof barMd.source

export interface BarStat {
  source: RecSource
  account: string
  toTag: string
  recs: number
  pctOfAccountRecs: number
  freshPctOfAccount: number
  vsFreshPp: number
  vsPoliticalViewsPp: number
}

export interface BarFilter {
  source?: RecSource[]
  tags?: string[]
  accounts?: string[]
}

const chartGroup = (b: BarStat) => pick(b, ['account', 'source'])

export const usePersonaBar = (filter: BarFilter, noLoad?: boolean) => {
  const stats = useBarData(noLoad)
  const statsFiltered = stats?.filter(r => filterIncludes({ toTag: filter.tags, account: filter.accounts, source: filter.source }, r))
  return { cfg: { font: '14px sans-serif' }, stats, statsFiltered }
}

export const useBarData = (noLoad?: boolean) => {
  const [data, setData] = useState<BarStat[]>(null)
  useEffect(() => {
    if (noLoad) return
    loadBarData().then(d => setData(d))
  }, [noLoad])
  return data
}

export const loadBarData = async () => {
  const stats = await jRes<BarStat>('us_rec_stats_v2')
  return stats.map(r => ({ ...r, toTag: r.toTag ?? 'Other' })).filter(r => tagMd[r.toTag])
}



export interface Scale { min?: number, max?: number }
export interface BarLayout { title: string, shortTitle: string, x: Scale }

export const layoutCharts = (stats: BarStat[], statsFiltered: BarStat[], cfg: { width: number, font: string }) => {


  const byGroup = groupBy(statsFiltered, r => toJson(chartGroup(r)))
  const legendsByGroup = mapValues(byGroup, (rows, j) => {
    const tagTotals = mapValues(groupBy(rows, r => r.toTag), g => sumBy(g, r => r.pctOfAccountRecs))
    return layoutLegend(orderBy(keys(tagTotals), t => tagTotals[t], 'desc'), { pad: 10, between: 10, iconWidth: 20, itemHeight: 25, labelFont: `bold ${cfg.font}` })
  })

  const legendWith = max(values(legendsByGroup).map(l => l.bounds.w))
  const barPaddingX = getTextWidth('000%', cfg.font) // pad enough to fit a label in the gap
  const barWidth = (cfg.width - legendWith) / keys(barMd.measures).length - 10 // pad a little extra around all the charts


  // include measures that have at least one non-null value
  const measuresDisplayed = entriesToObj(entries(barMd.measures).filter(([m, _]) => statsFiltered.some(r => r[m] != null)))
  const measures = mapValues(measuresDisplayed, (c, m) => {
    const all = stats.map(r => r[m] as number) // scale across all data so that filtering between is comparible
    const x = {
      min: c.x?.min ?? min(all),
      max: c.x?.max ?? max(all)
    }
    const scale = scaleLinear<number>({ range: [barPaddingX, barWidth - barPaddingX], domain: [x.min, x.max] })
    return {
      ...c, x, scale
    }
  })

  const layout = mapEntries(byGroup, (rows, j) => {
    const { account, source }: Pick<BarStat, 'account' | 'source'> = parseJson(j)

    const legend = legendsByGroup[j]
    const referenceBars = indexBy(legend.items.map(i => ({ tag: i.tag, ...i.rect })), i => i.tag)
    const referenceBar = (r: BarStat) => referenceBars[r.toTag]

    const measureGroups = compact(mapEntries(measures, (c, m) => {
      const xZero = c.scale(0)
      const bars = compact(rows.map((r) => {
        const value = r[m]
        const x = c.scale(value)
        const neg = value < 0
        const refBar = referenceBar(r)
        return refBar && value !== null ? {
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

      const lines = [{ x1: xZero, y1: 0, x2: xZero, y2: legend.bounds.h }]
      return { x: 0, y: 0, w: barWidth, h: legend.bounds.h, bars, labels, lines, title: c.title, shortTitle: c.shortTitle }
    }))
    return { account, source, legend, charts: measureGroups }
  })
  return layout
}

export const layoutLegend = (toTags: string[], cfg: { pad: number; between: number; iconWidth: number; itemHeight: number; labelFont: string }) => {
  const legend = toTags
    .filter(t => tagMd[t]?.color)
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


