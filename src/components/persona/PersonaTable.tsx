import React, { FunctionComponent as FC } from 'react'
import { numFormat } from '../../common/Utils'
import Layout from '../Layout'
import { barMd, usePersonaBar } from './PersonaBarUse'
import { AccountTag } from './PersonaBar'
import styled, { StyledProps } from 'styled-components'
import { hsl, scaleDiverging } from 'd3'
import { PivTable } from '../PivTable'
import { StyleProps } from '../Style'
import { Markdown } from '../Markdown'
import { StepText } from './PersonaSteps'

const rbPallet = { neg: '#eb4258', pos: '#1fc2bf' }

const getColorTrans = (t: number) => {
  let h = hsl(t > 0.5 ? rbPallet.pos : rbPallet.neg)
  h.opacity = Math.abs(t - 0.5)
  return h
}

export const PersonaTable: FC<StyleProps> = ({ style }) => {
  const { statsFiltered } = usePersonaBar({ source: ['rec'] })
  const stats = statsFiltered?.filter(s => s.account != 'Fresh')

  const measureCol = 'vsFreshPp'
  //const [min, max] = bar?.statsFiltered ? extent(bar.statsFiltered.map(s => s[measureCol] as number)) : [-1, +1]
  const scale = scaleDiverging(getColorTrans).domain([-0.1, 0, 0.1]) // hard-code because our data looks better with a smaller range

  return <>
    <StyleTable style={style}>
      <StepText active>{barMd.measures[measureCol].title}</StepText>
      <PivTable rows={stats} rowGroup='account' colGroup='toTag'
        colHeader={(g) => <AccountTag account={g} noIcon style={{ writingMode: 'vertical-lr', padding: '1em 0.2em', margin: '0.5em' }} />}
        rowHeader={(g) => <AccountTag account={g} style={{ margin: '0.5em' }} />}
        cell={r => {
          const v = r[measureCol]
          return <div className='val-cell'>{numFormat(v * 100)}</div>
        }}
        cellStyle={r => {
          const v = r?.[measureCol]
          return v ? { backgroundColor: scale(v).toString() } : null
        }}
      />
    </StyleTable>
  </>
}

const StyleTable = styled.div`
  .val-cell {
    display:flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    min-height: 3.5em;
    min-width: 3.5em;
  }
`
