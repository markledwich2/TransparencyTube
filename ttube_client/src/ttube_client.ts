import React, { ReactElement, createElement as el } from 'react'
import ReactDOM from 'react-dom'
import { VaccineChannel } from '../../src/components/pendulum/VaccineChannel'
import { VaccineVideo } from '../../src/components/pendulum/VaccineVideo'
import { ElectionFraudNarrative } from './components/ElectionFraudNarrative'
import { Root } from './components/Root'

const chartRender: { [prop: string]: (e: Element) => ReactElement } = {
    electionFraud: _ => el(ElectionFraudNarrative, {}),
    vaccineChannel: _ => el(VaccineChannel, {}),
    vaccineVideo: _ => el(VaccineVideo, {}),
}

export class TTubeClient {
    constructor() {
        this.render()
    }

    private render(): void {
        document.querySelectorAll("div.ttube, ttube").forEach(e => {
            const name: keyof typeof chartRender = e.getAttribute("chart") ?? 'default' as any
            const chartEl = chartRender[name]
            if (!chartEl) throw new Error(`no rendered with name ${name}`)
            ReactDOM.render(el(Root, null, chartEl(e)), e)
        })
    }
}

new TTubeClient()