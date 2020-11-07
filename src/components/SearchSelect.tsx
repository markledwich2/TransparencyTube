import React, { useState, useEffect, useRef, CSSProperties } from 'react'
import { keepInView, PopupStyle } from './InlineForm'
import { Search } from '@styled-icons/boxicons-regular'
import { Opt, UlStyled } from './InlineSelect'
import scrollIntoView from 'scroll-into-view-if-needed'
import { useDebounce } from '../common/Utils'

interface SearchSelectOptions<T> {
  onSelect: (item: T) => void
  search: (s: string) => Promise<T[]>
  itemRender: (item: T) => JSX.Element
  getKey?: (item: T) => string
  getLabel?: (item: T) => string
  placeholder?: string
  popupStyle?: CSSProperties
}

export const SearchSelect = <T,>({ onSelect, search, getKey, getLabel, itemRender, placeholder, popupStyle }: SearchSelectOptions<T>) => {
  const [results, setResults] = useState<T[]>(null)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 200)
  const [inputFocused, setInputFocused] = useState(false)
  const popupRef = useRef<HTMLDivElement>()
  const [idxFocused, setIdxFocused] = useState<number>(null)

  const handleClick = ({ target }) => {
    if (popupRef.current?.contains(target)) return
    setResults(null)
    setQuery('')
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(
    () => {
      if (debouncedQuery)
        search(debouncedQuery).then(results => {
          setResults(results?.slice(0, 50))
        })
      else
        setResults(null)
    },
    [debouncedQuery]
  )

  useEffect(() => {
    const node = popupRef.current?.querySelector('li.focused')
    if (node)
      scrollIntoView(node, { scrollMode: 'if-needed' })
  }, [idxFocused])

  //useEffect(() => keepInView(popupRef.current))

  const handleSelect = (r: T) => {
    setResults(null)
    setIdxFocused(null)
    setQuery('')
    onSelect(r)
  }

  const keyHandlers: Record<string, () => void> = {
    'ArrowDown': () => setIdxFocused(idxFocused != null ? Math.min(idxFocused + 1, results.length - 1) : 0),
    'ArrowUp': () => setIdxFocused(idxFocused != null ? Math.max(idxFocused - 1, 0) : 0),
    'Enter': () => idxFocused != null ? handleSelect(results[idxFocused]) : null
  }

  return <div style={{ position: 'relative' }} >
    <input
      type="text"
      placeholder={placeholder}
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onFocus={() => setInputFocused(true)}
      onBlur={() => setInputFocused(false)}
      onKeyDown={e => keyHandlers[e.key]?.()}
      style={{ width: '100%' }}
    />
    {!inputFocused && <Search style={{ position: 'absolute', right: '1em', top: '0.8em', color: 'var(--bg4)' }} />}
    {results && <PopupStyle ref={popupRef} style={{ ...popupStyle }}>
      <UlStyled style={{ padding: '1em' }}>
        {results.map((r, i) => <li
          key={getKey?.(r) ?? JSON.stringify(r)}
          className={idxFocused == i ? 'focused' : null}
          onClick={_ => handleSelect(r)}>
          {itemRender ? itemRender(r) : getLabel?.(r) ?? r['label']}
        </li>)}
      </UlStyled>
      {results?.length == 0 && <p style={{ padding: '2em 3em' }}>no channels found</p>}
    </PopupStyle>}
  </div>
}



