import { parseISO } from 'date-fns'
import { format, utcToZonedTime } from "date-fns-tz"
import { resetWarningCache } from 'prop-types'
import numeral from 'numeral'
import humanizeDuration from 'humanize-duration'
import { compact, reverse } from 'remeda'
import '@stardazed/streams-polyfill'
import { keys } from './Pipe'


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

export const shallowEquals = <T>(a: T, b: T) =>
  keys(a).length === keys(b).length &&
  keys(a).every(key => b.hasOwnProperty(key) && a[key] === b[key])

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

/** formats the given date or string. If tz is not specified it will be displayed in the local time */
export const dateFormat = (date: Date | string, tz?: string | 'UTC') => {
  if (!date) return
  const d: Date = (typeof (date) == 'string') ? parseISO(date) : date
  const fmt = 'do MMM yyyy'
  return tz ? format(utcToZonedTime(d, tz), fmt, { timeZone: tz }) //https://stackoverflow.com/questions/58561169/date-fns-how-do-i-format-to-utc
    : format(d, fmt)
}

export const numFormat = (n: number) =>
  n ? numeral(n).format(Math.floor(Math.log10(n)) % 3 == 0 ? '0[.]0a' : '0a') : null

export const delay = (ms: number) => new Promise(_ => setTimeout(_, ms))

const daySeconds = 24 * 60 * 60
type TimeUnitType = 'sec' | 'min' | 'hr' | 'day' | 'year'
const timeUnits: { [key in TimeUnitType]: TimeUnit } = {
  sec: { s: 1 },
  min: { s: 60 },
  hr: { s: 60 * 60 },
  day: { s: daySeconds },
  year: { s: 365 * daySeconds }
}

interface TimeUnit { s: number, plural?: string }

const labelUnit = (u: string, v: number) => ((v == 1) ? u : (timeUnits[u].plural ?? `${u}s`))

export const hoursFormat = (hours: number, numUnits: number = 1, maxUnit: TimeUnitType | null = 'hr') => {
  let remainingSecs = hours * timeUnits.hr.s
  let parts: { unit: string, val: number }[] = []
  reverse(Object.entries(timeUnits))
    .forEach(v => {
      const [unit, { s }] = v
      if (maxUnit && s > timeUnits[maxUnit].s) // skip if unit is bigger than max Unit
        return
      if (parts.length <= numUnits && remainingSecs - s > 0) {
        const unitPortion = remainingSecs / s
        const val = parts.length == numUnits - 1 ? unitPortion : Math.floor(unitPortion)
        remainingSecs = remainingSecs - val * s
        parts.push({ unit, val })
      }
    })


  const r = parts.map(u => {
    const fNum = numFormat(u.val)
    const space = u.unit.length > 2 || !Number.isInteger(fNum[fNum.length - 1]) ? ' ' : ''
    return `${fNum}${space}${labelUnit(u.unit, u.val)}`
  }).join(' ')
  return r
}

export const safeLocation = (): Location => typeof window === 'undefined' ? null : window.location

export const navigateNoHistory = (to: string) => history.replaceState({}, '', to)

export type PartialRecord<K extends keyof any, T> = {
  [P in K]?: T
}
