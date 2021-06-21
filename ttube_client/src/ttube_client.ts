import React, { ReactElement, createElement as el } from 'react'
import ReactDOM from 'react-dom'
import { NarrativeName, NarrativeVideo } from '../../src/common/RecfluenceApi'
import { mapToObj } from 'remeda'
import { NarrativeHighlightComponent, NarrativeHighlightComponentProps } from '../../src/components/pendulum/NarrativeHighlight'
import { NarrativeVideoComponent, NarrativeVideoComponentProps } from '../../src/components/pendulum/NarrativeVideo'
import { ElectionFraudNarrative } from './components/ElectionFraudNarrative'
import { Root } from './components/Root'

type PropMap<T> = { name: (keyof T & string), cast?: (s: string) => any }
const isPropMap = (p: any): p is PropMap<any> => (p as PropMap<any>).name !== undefined
type PropName<T> = (keyof T & string)

const attributeProps = <T>(e: Element, props: (PropName<T> | PropMap<T>)[]) => {
    return mapToObj(props, p => {
        var [name, cast] = isPropMap(p) ? [p.name, p.cast] : [p as PropName<T>, null]
        var value = e.getAttribute(name)
        if (cast)
            value = cast(value)
        return [name, value]
    }) as any as T
}

const chartRender: { [prop: string]: (e: Element) => ReactElement } = {
    electionFraud: _ => el(ElectionFraudNarrative, {}),
    vaccineChannel: _ => el(NarrativeHighlightComponent, {}), // backwards compatibility
    vaccineVideo: _ => el(NarrativeVideoComponent, {}), // backwards compatibility
    narrativeHighlight: (e) => el(NarrativeHighlightComponent, attributeProps<NarrativeHighlightComponentProps>(e, ['narrative'])),
    narrativeVideo: (e) => el(NarrativeVideoComponent, attributeProps<NarrativeVideoComponentProps>(e,
        ['narrative', { name: 'sizeFactor', cast: s => s && Number.parseFloat(s) }])),
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