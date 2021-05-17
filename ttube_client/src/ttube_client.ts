import React, { ReactElement, createElement as el } from 'react'
import ReactDOM from 'react-dom'
import { NarrativeName } from '../../src/common/RecfluenceApi'
import { NarrativeHighlightComponent } from '../../src/components/pendulum/NarrativeHighlight'
import { NarrativeVideoComponent } from '../../src/components/pendulum/NarrativeVideo'
import { ElectionFraudNarrative } from './components/ElectionFraudNarrative'
import { Root } from './components/Root'




const chartRender: { [prop: string]: (e: Element) => ReactElement } = {
    electionFraud: _ => el(ElectionFraudNarrative, {}),
    vaccineChannel: _ => el(NarrativeHighlightComponent, {}), // backwards compatibility
    vaccineVideo: _ => el(NarrativeVideoComponent, {}), // backwards compatibility
    narrativeHighlight: (e) => el(NarrativeHighlightComponent, { narrative: e.getAttribute('narrative') as NarrativeName }),
    narrativeVideo: (e) => el(NarrativeVideoComponent, { narrative: e.getAttribute('narrative') as NarrativeName }),
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