import { format, parseISO } from 'date-fns'
import { resetWarningCache } from 'prop-types'
import numeral from 'numeral'
import humanizeDuration from 'humanize-duration'
import { compact, reverse } from 'remeda'
import '@stardazed/streams-polyfill'


/** GET a json object and deserialize it */
export async function getJson<T>(url: RequestInfo, cfg?: RequestInit): Promise<T> {
  const res = await fetch(url, Object.assign({ method: 'GET' }, cfg))
  let json = await res.json()
  return json as T
}

function splitStream(splitOn: string): TransformStream {
  let buffer = ''
  return new TransformStream({
    transform(chunk, controller) {
      buffer += chunk
      const parts = buffer.split(splitOn)
      parts.slice(0, -1).forEach(part => controller.enqueue(part))
      buffer = parts[parts.length - 1]
    },
    flush(controller) {
      if (buffer) controller.enqueue(buffer)
    }
  })
}

function parseJSON<T>(): TransformStream<string, T> {
  return new TransformStream<string, T>({
    transform(chunk, controller) {
      controller.enqueue(JSON.parse(chunk))
    }
  })
}

export const jsonEquals = (a: any, b: any) => a == b || JSON.stringify(a) == JSON.stringify(b)

export async function getJsonl<T>(url: RequestInfo, cfg?: RequestInit): Promise<T[]> {
  const res = await fetch(url, Object.assign({ method: 'GET' }, cfg))
  if (!res.ok) throw res
  const reader = res.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(splitStream('\n'))
    .pipeThrough(parseJSON<T>())
    .getReader()

  const items = []
  while (true) {
    var r = await reader.read()
    if (r.done) break
    items.push(r.value)
  }
  return items
}

export const preloadImage = (url: string): Promise<void> => new Promise((resolve) => {
  var img = new Image()
  img.onload = () => resolve()
  img.src = url
})

export const preloadImages = (urls: string[]): Promise<void> => new Promise((resolve) => {
  let n = 0
  urls.forEach(url => {
    preloadImage(url).then(() => {
      n++
      if (n == urls.length)
        resolve()
    })
  })
})

/** like Object.assign, but doesn't mutate a */
export const assign = <T, U>(a: T, b: U, c?: any): T & U => Object.assign({}, a, b, c)

export const dateFormat = (date: Date | number | string) => {
  if (!date) return
  const d = (typeof (date) == 'string') ? parseISO(date) : date
  return format(d, 'do MMM yyyy')
}

export const numFormat = (n: number) =>
  n ? numeral(n).format(Math.floor(Math.log10(n)) % 3 == 0 ? '0[.]0a' : '0a') : null

export const delay = (ms: number) => new Promise(_ => setTimeout(_, ms))

const daySeconds = 24 * 60 * 60
const timeUnits: { [key: string]: TimeUnit } = {
  s: { s: 1 },
  m: { s: 60 },
  hr: { s: 60 * 60, plural: 'hrs' },
  day: { s: daySeconds, plural: 'days' },
  year: { s: 365 * daySeconds, plural: 'years' }
}

interface TimeUnit { s: number, plural?: string }

const labelUnit = (u: string, v: number) => {
  const space = u.length > 2 ? ' ' : ''
  return space + ((v == 1) ? u : (timeUnits[u].plural ?? u))
}

export const hoursFormat = (hours: number) => {
  let remainingSecs = hours * timeUnits.hr.s
  const units = reverse(Object.entries(timeUnits)).map(v => {
    const [unit, { s, plural }] = v
    if (remainingSecs - s > 0) {
      const val = Math.floor(remainingSecs / s)
      remainingSecs = remainingSecs - val * s
      return { unit, val: val }
    }
    return { unit, val: 0 }
  })
  const r = units.filter(u => u.val).slice(0, 2)
    .map(u => `${numFormat(u.val)}${labelUnit(u.unit, u.val)}`).join(' ')
  return r
}