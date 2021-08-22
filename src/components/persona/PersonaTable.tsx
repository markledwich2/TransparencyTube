import React, { FunctionComponent as FC } from 'react'
import { assign, numFormat } from '../../common/Utils'
import Layout from '../Layout'
import { RecStatFilter, barMd, RecStat, usePersonaBar } from './PersonaBarUse'
import { AccountTag } from './PersonaBar'
import styled, { StyledProps } from 'styled-components'
import { hsl, scaleDiverging } from 'd3'
import { PivTable } from '../PivTable'
import { StyleProps } from '../Style'
import { Markdown } from '../Markdown'
import { StepText } from './PersonaSteps'
import { FilterKeys, PartialRecord } from '../../common/Types'
import { entries } from '../../common/Pipe'
import classNames from 'classnames'

const rbPallet = { neg: '#eb4258', pos: '#1fc2bf' }

const getColorTrans = (t: number) => {
  let h = hsl(t > 0.5 ? rbPallet.pos : rbPallet.neg)
  h.opacity = Math.abs(t - 0.5)
  return h
}

export type RecStatHighlight = PartialRecord<FilterKeys<RecStat, string>, (string | boolean)[]>
export type RecStatMeasure = FilterKeys<RecStat, number>

const groupCols = {
  row: 'account' as FilterKeys<RecStat, string>,
  col: 'toTag' as FilterKeys<RecStat, string>
}

const highlightClass = (h?: boolean) => h == null ? null : h ? 'highlight' : 'un-highlight'

export const PersonaTable: FC<StyleProps & { filter?: RecStatFilter, highlight?: RecStatHighlight, measure?: RecStatMeasure }> =
  ({ style, filter, highlight, measure }) => {

    measure ??= 'vsFreshPp'

    const dFilter = assign({ source: ['rec'] }, filter)
    const { statsFiltered } = usePersonaBar(dFilter)
    const dStats = statsFiltered?.filter(s => s.account != 'Fresh')

    //const [min, max] = bar?.statsFiltered ? extent(bar.statsFiltered.map(s => s[measureCol] as number)) : [-1, +1]
    const scale = scaleDiverging(getColorTrans).domain([-0.1, 0, 0.1]) // hard-code because our data looks better with a smaller range

    const cellInfo = (r: RecStat) => {
      let highlighted = highlight && r ? entries(highlight).every(([col, vals]) => vals.some(v => r[col] == v)) : null
      const value = r?.[measure]
      return { value, highlighted, backgroundColor: scale(value).toString() }
    }

    const headerInfo = (mode: keyof typeof groupCols, groupVal) => {
      const highlighted = highlight ? highlight[groupCols[mode]]?.includes(groupVal) : null
      return { highlighted, className: classNames('header', highlightClass(highlighted)) }
    }

    return <div style={style}>
      <StepText active>{barMd.measures[measure].title}</StepText>
      <TableStyle>
        <PivTable rows={dStats} rowGroup={groupCols.row} colGroup={groupCols.col}
          colHeader={(g) => <AccountTag className={headerInfo('col', g).className}
            account={g} noIcon style={{ writingMode: 'vertical-lr', padding: '1em 0.2em', margin: '0.5em' }} />}
          rowHeader={(g) => <AccountTag className={headerInfo('row', g).className}
            account={g} style={{ margin: '0.5em' }} />}
          cell={r => {
            const { value, highlighted, backgroundColor } = cellInfo(r)
            return <div style={{ backgroundColor }}
              className={classNames('val', highlightClass(highlighted))}>
              {numFormat(value * 100)}
            </div>
          }}
        />
      </TableStyle>
    </div>
  }

const TableStyle = styled.div`
  & {
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
  }
  thead th {
    background-color: var(--bg);
    z-index: 20;
    top: 0;
    position: sticky;
  }
  tbody th {
    background-color: var(--bg);
    z-index: 20;
    left: 0;
    position: sticky;
  }
  .highlight {
    z-index: 100;
  }
  .val.highlight {
    border: solid 3px rgba(var(--fgRgb), 0.4);
  }
  .un-highlight {
    filter: blur(1px);
  }
  .val {
    display:flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    min-height: 3em;
    min-width: 3em;
    border-radius: 3px;
    margin:1px;
  }
`
