import React, { useState, useEffect, useRef, CSSProperties } from 'react'
import { Search } from '@styled-icons/boxicons-regular'
import { CloseOutline } from '@styled-icons/evaicons-outline'
import { useDebounce } from '../common/Utils'
import { StyleProps } from './Layout'

interface SearchSelectOptions {
  search: string
  onSearch: (s) => void
  placeholder?: string

}


const inputIconStyle: React.CSSProperties = { position: 'absolute', right: '0.3em', top: '0em', color: 'var(--bg4)' }

const SearchText = ({ search, onSearch, placeholder, style }: SearchSelectOptions & StyleProps) => {
  const [inputFocused, setInputFocused] = useState(false)
  const [inputSearch, setInputSearch] = useState<string>(null)
  const value = inputSearch ?? search
  const debouncedSearch = useDebounce(value, 300)

  useEffect(
    () => {
      onSearch(debouncedSearch)
      setInputSearch(null)
    },
    [debouncedSearch]
  )

  return <span style={{ position: 'relative' }}>
    <input
      type='text'
      placeholder={placeholder}
      style={{ width: '20em', ...style }}
      onFocus={() => setInputFocused(true)}
      onBlur={() => setInputFocused(false)}
      onChange={e => setInputSearch(e.target.value)}
      value={value ?? ''}
    />
    {!inputFocused && !value && <Search style={inputIconStyle} />}
    {value && <CloseOutline className='clickable' style={inputIconStyle} onClick={() => {
      onSearch(null)
      setInputSearch(null)
    }} />}
  </span>
}

export default SearchText