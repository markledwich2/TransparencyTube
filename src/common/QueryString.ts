import {
  ParseOptions,
  StringifyOptions,
  parse,
  stringify
} from 'query-string'
import { useState } from 'react'

// taken from here, and added typing https://github.com/trevorblades/use-query-string

export type QsResult<T> = {
  [0]: T
  [1]: (values: Partial<T>) => void
} & Array<any>

export const useQuery = <T extends Record<string, string | string[]>>(
  location: Location,
  navigate: (path: string) => void,
  parseOptions?: ParseOptions,
  stringifyOptions?: StringifyOptions
): QsResult<T> => {
  const [state, setState] = useState<T>(parse(location.search, parseOptions) as any as T)

  const setQuery = (values: Partial<T>): void => {
    const newQuery: T = {
      ...state,
      ...values
    }
    setState(newQuery)
    navigate(location.pathname + '?' + stringify(newQuery, stringifyOptions))
  }

  return [state, setQuery]
}