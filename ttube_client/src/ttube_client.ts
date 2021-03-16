import React, { ReactElement, createElement as el } from 'react'
import ReactDOM from 'react-dom'
import { Hello } from './components/Hello'
import { ElectionFraudNarrative } from './components/ElectionFraudNarrative'
import { Root } from './components/Root'

const chartRender: { [prop: string]: (e: Element) => ReactElement } = {
    hello: e => el(Hello, { message: e.getAttribute('message') ?? 'no message found' }),
    electionFraud: _ => el(ElectionFraudNarrative, {})
}

export class TTubeClient {
    constructor() {
        this.render()
    }

    private render(): void {
        document.querySelectorAll("ttube").forEach(e => {
            const name: keyof typeof chartRender = e.getAttribute("chart") ?? 'default' as any
            const chartEl = chartRender[name]
            if (!chartEl) throw new Error(`no rendered with name ${name}`)
            ReactDOM.render(el(Root, null, chartEl(e)), e)
        })
    }
}

new TTubeClient()