import React, { CSSProperties, FC, PropsWithChildren, ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import InView, { useInView } from 'react-intersection-observer'
import R, { flatMap, map, mapToObj, mapValues, pipe } from 'remeda'
import { entries, mapEntries, mapValuesIdx } from '../../common/Pipe'
import { useWindowDim } from '../../common/Window'
import { Markdown, TextStyle } from '../Markdown'
import Scrollama, { OnStepProps, ScrollamaProps } from '../scrollama/Scrollama'
import { Step, StepProps } from '../scrollama/Step'
import { StyleProps } from '../Style'

export interface StepCfg { txt: string | string[], style?: CSSProperties }
export interface StepRunCfg {
  stepIndex: number
  sectionIndex: number
  stepPct: number // the percent progress of this step of it's section
  name: string
  section: string
  txt: string
  style?: CSSProperties
  textStyle?: CSSProperties
}
export type StepSectionsCfg<K extends string, U> = Record<K, Record<string, string | StepCfg & U>>

export const createStepSections = <K, U>(cfg: StepSectionsCfg<K & string, U>) =>
  mapValuesIdx(cfg, (stepCfg, section, i) => createSteps(stepCfg, section, i))

const createSteps = <U,>(stepCfg: Record<string, string | StepCfg & U>, section: string, sectionIndex: number): (StepRunCfg & U)[] => {
  var stepProps = (s: (string | StepCfg & U)) => typeof (s) == 'string' ? { txt: s } : (s)
  const steps1 = pipe(
    map(entries(stepCfg), ([name, s]) => ({ name, section, ...stepProps(s) })),
    flatMap(s => typeof (s.txt) == 'string' ? [s] : s.txt.map(t => ({ ...s, txt: t })))
  )
  return steps1.map((s, i) => ({ stepIndex: i, sectionIndex, stepPct: i == 0 ? 0 : i / steps1.length, ...s } as StepRunCfg & U))
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

const stepId = ({ stepIndex: i, section, name }: StepRunCfg) => [i, section, name].join('|')

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

    return <div data-name='ChartWithSteps-Outer' style={{ position: 'relative' }}>
      <div data-name='ChartWithSteps-ChartDiv' ref={chartRef} style={{ position: 'sticky', top: chartTop ?? 0, ...chartStyle }}>
        {children}
      </div>
      <div data-name='ChartWithSteps-StepContent' style={{ position: 'relative', top: `${-(chartHeight ?? 0) + textTopPx}px`, pointerEvents: 'none' }}>
        {chartHeight && <Scrollama {...props} onStepProgress={onStep} >
          {steps.map((s, i) => <Step key={`${s.name}-${s.stepIndex}`} data={s}>
            <div style={{
              paddingBottom: i == steps.length - 1 ? null : stepSpace ?? '100vh',

              ...s.style
            }}>
              <TP active={stepState && stepId(stepState) == stepId(s)} style={s.textStyle}>{s.txt}</TP>
            </div>
          </Step>)}
        </Scrollama>}
      </div>
    </div>
  }

export const InlineSteps = <T extends StepRunCfg>({ steps, stepSpace, onStepProgress }:
  { steps: T[], stepSpace?: string } & Pick<StepProps<T>, 'onStepProgress'>) => <>
    {steps.map((s, i) => <InlineStep
      key={i}
      style={{
        marginBottom: i == steps.length - 1 ? null : stepSpace ?? '1em',
        ...s.style
      }}
      onStepProgress={onStepProgress}
      step={s} />)}
  </>

const InlineStep = <T extends StepRunCfg>({ step, onStepProgress, style }: { step: T } & StyleProps & Pick<StepProps<T>, 'onStepProgress'>) => {
  return <InView
    onChange={(inView, entry) => {
      if (!inView) return
      return onStepProgress?.({ data: step, progress: 0 })
    }}>
    <div style={style}><TP active style={step.textStyle}>{step.txt}</TP></div>
  </InView>
}

const TP: FC<StyleProps & { children: string & ReactNode, active?: boolean }> = ({ children, style, active }) => <TextStyle
  style={{
    margin: '0 auto', position: 'relative', background: 'var(--bg1)', maxWidth: '40em',
    padding: '0.5em 1em',
    fontSize: '1.6em',
    backgroundColor: 'rgb(var(--bgRgb), 0.8)',
    backdropFilter: 'blur(20px)',
    filter: active ? null : 'opacity(0.6)',
    pointerEvents: 'none',
    borderRadius: '10px',
    ...style
  }}>
  <Markdown children={children} />
</TextStyle>