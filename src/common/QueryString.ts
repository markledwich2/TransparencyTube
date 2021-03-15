import { ParseOptions, StringifyOptions, parse, stringify } from 'query-string'
import { useState } from 'react'

export const navigateNoHistory = (to: string) => history.replaceState({}, '', to)

// originally from here  https://github.com/trevorblades/use-query-string

export type QsResult<T> = {
  [0]: T
  [1]: (values: Partial<T>) => void
} & Array<any>

export const useQuery = <T>(
  location: Location,
  navigate?: (path: string) => void,
  parseOptions?: ParseOptions,
  stringifyOptions?: StringifyOptions
): QsResult<T> => {
  if (!navigate) navigate = navigateNoHistory
  const defaultOptions: StringifyOptions = { arrayFormat: 'bracket' }
  const initState = parse(location.search, { ...defaultOptions, ...parseOptions }) as any as T
  const [state, setState] = useState<T>(initState)
  const setQuery = (values: Partial<T>): void => {
    const newQuery: T = {
      ...state,
      ...values
    }
    setState(newQuery)
    navigate(location.pathname + '?' + stringify(newQuery as any, { ...defaultOptions, ...stringifyOptions }))
  }

  return [state, setQuery]
}