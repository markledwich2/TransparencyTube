import React, { CSSProperties, FC, PropsWithChildren, ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import R, { flatMap, map, mapValues, pipe } from 'remeda'
import { entries, mapEntries } from '../../common/Pipe'
import { useWindowDim } from '../../common/Window'
import { Markdown, TextStyle } from '../Markdown'
import Scrollama, { OnStepProps, ScrollamaProps } from '../scrollama/Scrollama'
import { Step } from '../scrollama/Step'
import { StyleProps } from '../Style'

export interface StepCfg { txt: string | string[], style?: CSSProperties }
export interface StepRunCfg { i: number, name: string, section: string, txt: string, style?: CSSProperties }
export type StepSectionsCfg<K extends string, U> = Record<K, Record<string, string | StepCfg & U>>

export const createStepSections = <K, U>(cfg: StepSectionsCfg<K & string, U>) => mapValues(cfg, (stepCfg, section) =>
  createSteps(stepCfg, section as any as string))

const createSteps = <U,>(stepCfg: Record<string, string | StepCfg & U>, section: string): (StepRunCfg & U)[] => {
  var stepProps = (s: (string | StepCfg & U)) => typeof (s) == 'string' ? { txt: s } : (s)
  var res = pipe(
    map(entries(stepCfg), ([name, s]) => ({ name, section, ...stepProps(s) })),
    flatMap(s => typeof (s.txt) == 'string' ? [s] : s.txt.map(t => ({ ...s, txt: t }))),
    map.indexed((s, i) => ({ i, ...s } as StepRunCfg & U))
  )
  return res
}

type ChartWithStepsProps<T extends StepRunCfg> = {
  name: string
  steps: T[]
  onStepProgress?: (props: OnStepProps<T>) => void
  chartTop?: number
  textTop?: number // either an integer in pixels, or a % of window height
  chartStyle?: CSSProperties
  stepSpace?: string
} & Omit<ScrollamaProps<T>, 'children'>


const stepId = ({ i, section, name }: StepRunCfg) => [i, section, name].join('|')

export const ChartWithSteps =
  <T extends StepRunCfg,>({ name, chartTop, children, chartStyle, textTop, steps, stepSpace, onStepProgress, ...props }: PropsWithChildren<ChartWithStepsProps<T>>) => {
    const chartRef = useRef<HTMLDivElement>(null)
    const [chartHeight, setChartHeight] = useState<number>(null)
    useEffect(() => { if (chartRef.current) setChartHeight(chartRef.current.clientHeight) })

    const window = useWindowDim()
    const textTopPx = textTop ? (Number.isInteger(textTop) ? textTop : textTop * window.h) : 100

    const [stepState, setStepState] = useState<StepRunCfg>(null)
    const onStep = useCallback((s: OnStepProps<T>) => {
      setStepState(s?.data)
      onStepProgress(s)
    }, [])

    return <div style={{ position: 'relative' }}>
      <div ref={chartRef} style={{ position: 'sticky', top: chartTop ?? 0, ...chartStyle }}>
        {children}
      </div>
      <div style={{ position: 'relative', top: `${-(chartHeight ?? 0) + textTopPx}px`, pointerEvents: 'none' }}>
        {chartHeight && <Scrollama {...props} onStepProgress={onStep} >
          {steps.map((s, i) => <Step key={`${s.name}-${s.i}`} data={s}>
            <div style={{ paddingBottom: i == steps.length - 1 ? null : stepSpace ?? '100vh', ...s.style }}>
              <TP active={stepState && stepId(stepState) == stepId(s)}>{s.txt}</TP>
            </div>
          </Step>)}
        </Scrollama>}
      </div>
    </div>
  }

export const InlineSteps: FC<{ steps: StepRunCfg[], stepSpace?: string }> = ({ steps, stepSpace }) => <>
  {steps.map((s, i) => <Step key={s.name} data={s}>
    <div style={{ marginBottom: i == steps.length - 1 ? null : stepSpace ?? '1em', ...s.style }}><TP active>{s.txt}</TP></div>
  </Step>)}
</>

const TP: FC<StyleProps & { children: string & ReactNode, active?: boolean }> = ({ children, style, active }) => <TextStyle
  style={{
    margin: '0 auto', position: 'relative', background: 'var(--bg1)', maxWidth: '40em',
    padding: '1em',
    fontSize: '1.6em',
    backgroundColor: 'rgb(var(--bgRgb), 0.8)',
    backdropFilter: 'blur(20px)',
    filter: active ? null : 'opacity(0.6)',
    pointerEvents: 'none',
    ...style
  }}>
  <Markdown children={children} />
</TextStyle>