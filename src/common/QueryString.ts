import { ParseOptions, StringifyOptions, parse, stringify } from 'query-string'
import { useState } from 'react'
import { mapToObj } from 'remeda'
import { entries } from './Pipe'
import { assign } from './Utils'
import { useLocation } from '@gatsbyjs/reach-router'

export const navigateNoHistory = (to: string) => history.replaceState({}, '', to)

// originally from here  https://github.com/trevorblades/use-query-string

export type QsResult<T> = {
  [0]: Partial<T>
  [1]: (values: Partial<T>) => void
} & Array<any>

interface QueryOptions<T> {
  location?: Location,
  navigate?: (path: string) => void,
  parseOptions?: ParseOptions,
  stringifyOptions?: StringifyOptions,
  defaultState?: Partial<T>
}

export const useQuery = <T>(options?: QueryOptions<T>): QsResult<T> => {
  const { location, navigate, parseOptions, stringifyOptions, defaultState } = {
    ...{
      location: useLocation(),
      navigate: navigateNoHistory
    },
    ...options
  }
  const stringifyOps: StringifyOptions = { arrayFormat: 'bracket' }
  const initState = assign(defaultState, parse(location.search, { ...stringifyOps, ...parseOptions }) as any as Partial<T>)
  const [state, setState] = useState<Partial<T>>(initState)

  // pick and other functions can introduces undefined values, and we don't want to consider it when performing the spread.override of new values
  const removeUndefined = (item: Partial<T>): Partial<T> => mapToObj(entries(item).filter((_, v) => v !== undefined), e => e) as Partial<T>

  const setQuery = (values: Partial<T>): void => {
    const newQuery = {
      ...removeUndefined(state),
      ...removeUndefined(values)
    }
    setState(newQuery)
    console.log('setQuery', { state, values, newQuery })
    navigate(location.pathname + '?' + stringify(newQuery as any, { ...stringifyOps, ...stringifyOptions }))
  }

  return [state, setQuery]
}