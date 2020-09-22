import { format } from 'date-fns'
import { resetWarningCache } from 'prop-types'
import numeral from 'numeral'

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
  const d = (typeof (date) == 'string') ? Date.parse(date) : date
  return format(d, 'do MMM yyyy')
}

export const numFormat = (n: number) =>
  n ? numeral(n).format(Math.floor(Math.log10(n)) % 3 == 0 ? '0[.]0a' : '0a') : null


export const delay = <T>(ms: number, value?: T): Promise<T> =>
  new Promise((resolve) => setTimeout(resolve(value), 100))