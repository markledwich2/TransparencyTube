import { parseISO } from 'date-fns'
import { format, utcToZonedTime } from "date-fns-tz"
import { resetWarningCache } from 'prop-types'
import numeral from 'numeral'
import humanizeDuration from 'humanize-duration'
import { compact, reverse, mapToObj } from 'remeda'
import '@stardazed/streams-polyfill'
import { entries, keys } from './Pipe'
import { useEffect, useState } from 'react'



export const parseJson = <T>(json: string) => JSON.parse(json) as T
export const toJson = (o: any) => JSON.stringify(o)

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

/** like Object.assign, but is immutable and removes undefined from a first */
export const merge = <T, U>(a: T, b: U): T & U => assign(removeUndefined(a), removeUndefined(b))

export const removeUndefined = <T>(a: T): T => mapToObj(entries(a).filter(([_, v]) => v !== undefined), kv => kv) as T

/** formats the given date or string. If tz is not specified it will be displayed in the local time */
export const dateFormat = (date: Date | string, tz?: string | 'UTC', fmt: string = 'do MMM yyyy') => {
  if (!date) return
  const d: Date = (typeof (date) == 'string') ? parseISO(date) : date
  if (isNaN(d.getTime())) return
  return tz ? format(utcToZonedTime(d, tz), fmt, { timeZone: tz }) //https://stackoverflow.com/questions/58561169/date-fns-how-do-i-format-to-utc
    : format(d, fmt)
}

export const numFormat = (n: number) =>
  n != null ? numeral(n).format(n < 1 || Math.floor(Math.log10(n)) % 3 == 0 ? '0[.]0a' : '0a') : null

export const delay = (ms: number) => new Promise(_ => setTimeout(_, ms))

const daySeconds = 24 * 60 * 60
type TimeUnitType = 's' | 'm' | 'hr' | 'day' | 'year'
const timeUnits: { [key in TimeUnitType]: TimeUnit } = {
  s: { s: 1 },
  m: { s: 60 },
  hr: { s: 60 * 60 },
  day: { s: daySeconds },
  year: { s: 365 * daySeconds }
}

interface TimeUnit { s: number, plural?: string }

const labelUnit = (u: string, v: number) => ((v == 1 || u.length == 1) ? u : (timeUnits[u].plural ?? `${u}s`))

export const secondsFormat = (secs: number, numUnits: number = 1, maxUnit: TimeUnitType | null = null) =>
  hoursFormat(secs / timeUnits.hr.s, numUnits, maxUnit)

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
      // <1s needs to end with 0s.
      if (unit == 's' && parts.length == 0)
        return parts.push({ unit, val: remainingSecs })
    })

  const r = parts.map(u => {
    const fNum = numFormat(u.val)
    // use a space between the unit if the formatted number/unit string is lengthy/decimal/end-in-unit
    const space = u.unit.length > 2 || !/^[0-9]+$/.test(fNum) ? ' ' : ''
    return `${fNum}${space}${labelUnit(u.unit, u.val)}`
  }).join(' ')
  return r
}

export const safeLocation = (): Location => typeof window === 'undefined' ? null : window.location

export const navigateNoHistory = (to: string) => history.replaceState({}, '', to)

export type PartialRecord<K extends keyof any, T> = {
  [P in K]?: T
}

export const useDebounce = <T>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(
    () => {
      const handler = setTimeout(() => {
        setDebouncedValue(value)
      }, delay)
      return () => { clearTimeout(handler) }
    },
    [value]
  )
  return debouncedValue
}

export const windowMissing = typeof window === 'undefined'

export const logIfError = <T>(m: () => T): (T | null) => {
  try {
    return m()
  }
  catch (e) {
    console.error(e)
  }
  return null
}

/*** This is a simple, *insecure* hash that's short, fast, and has no dependencies. see https://gist.github.com/jlevy/c246006675becc446360a798e2b2d781 */
export const simpleHash = str => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash &= hash // Convert to 32bit integer
  }
  return hash
}