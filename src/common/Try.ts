import { assign } from './Utils'


interface Options<T> {
  attempts: number
  delay: number
  shouldRetryResult: (e: T) => boolean
  shouldRetryError: (e: any) => boolean
}

const defaultOptions: Options<any> = {
  attempts: 3,
  delay: 500,
  shouldRetryResult: (e) => e?.ok === false,
  shouldRetryError: (e) => true
}

export const retry = async <T>(fn: () => Promise<T>, options?: Options<T>) => {
  const o = assign(defaultOptions, options)
  let attempts = 0
  while (attempts <= o.attempts) {
    attempts++
    try {
      const res = await fn()
      if (o.shouldRetryResult(res))
        console.error('retry-able result:', attempts, res)
      else
        return res
    }
    catch (e) {
      if (o.shouldRetryError)
        console.error('retry-able error:', attempts, e)
      else
        throw e
    }
  }
}


export const tryCatch = <TRes, TCatch>(tryFunc: () => TRes, catchFunc?: (ex: unknown) => TCatch): TRes | TCatch => {
  try {
    return tryFunc()
  } catch (ex: unknown) {
    return catchFunc?.(ex)
  }
}
