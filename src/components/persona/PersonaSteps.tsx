import React, { CSSProperties, FC, ReactNode, useEffect, useRef, useState } from 'react'
import { mapValues } from 'remeda'
import { entries, mapEntries } from '../../common/Pipe'
import { Markdown, TextStyle } from '../Markdown'
import Scrollama, { OnStepProps, ScrollamaProps } from '../scrollama/Scrollama'
import { Step } from '../scrollama/Step'
import { StyleProps } from '../Style'
import { PersonaStepCfg } from './personaContent'

export interface StepCfg { txt: string, style?: CSSProperties }
export interface StepRunCfg extends StepCfg { i: number, name: string, section: string }
export type StepSectionsCfg<T> = Record<keyof T & string, Record<string, string | StepCfg>>

export const createStepSections = <T extends StepSectionsCfg<T>,>(cfg: T) => mapValues(cfg, (stepCfg, section) =>
  createSteps(stepCfg, section as any as string))
const createSteps = (sepCfg: Record<string, string | StepCfg>, section: string) =>
  mapEntries(sepCfg, (step, name, i) => ({ i, name, txt: typeof (step) == 'string' ? step : step.txt, section }))

type ChartWithStepsProps = {
  name: string
  steps: StepRunCfg[]
  onStepProgress?: ({ data, progress }: OnStepProps<StepRunCfg>) => void
  chartTop?: number
  textTop?: number
  chartStyle?: CSSProperties
  stepSpace?: string
} & Omit<ScrollamaProps<StepRunCfg>, 'children'>

export const ChartWithSteps: FC<ChartWithStepsProps> =
  ({ name, chartTop, children, chartStyle, textTop, steps, stepSpace, ...props }) => {
    const chartRef = useRef<HTMLDivElement>(null)
    const [chartHeight, setChartHeight] = useState<number>(null)
    useEffect(() => { if (chartRef.current) setChartHeight(chartRef.current.clientHeight) })

    //console.log('ChartWS', { name, chartHeight, textTop })

    return <div style={{ position: 'relative' }}>
      <div className='scroll-chart' ref={chartRef} style={{ position: 'sticky', top: chartTop ?? 0, ...chartStyle }}>
        {children}
      </div>
      <div className='scroll-text' style={{ position: 'relative', top: `${-(chartHeight ?? 0) + (textTop ?? 200)}px` }}>
        {chartHeight && <Scrollama {...props} >
          {steps.map((s, i) => <Step key={s.name} data={s}>
            <div style={{ marginBottom: i == steps.length - 1 ? null : stepSpace ?? '100vh', ...s.style }}><TP>{s.txt}</TP></div>
          </Step>)}
        </Scrollama>}
      </div>
    </div >
  }

export const InlineSteps: FC<{ steps: StepRunCfg[], stepSpace?: string }> = ({ steps, stepSpace }) => {
  return <>{steps.map((s, i) => <Step key={s.name} data={s}>
    <div style={{ marginBottom: i == steps.length - 1 ? null : stepSpace ?? '5em', ...s.style }}><TP>{s.txt}</TP></div>
  </Step>)}</>
}

const TP: FC<StyleProps & { children: string & ReactNode }> = ({ children, style }) => <TextStyle
  style={{
    margin: '0 auto', position: 'relative', background: 'var(--bg1)', maxWidth: '40em',
    padding: '1em',
    fontSize: '1.5em',
    backgroundColor: 'rgb(var(--bgRgb), 0.6)',
    backdropFilter: 'blur(20px)',
    pointerEvents: 'none',
    ...style
  }}>
  <Markdown children={children} />
</TextStyle>