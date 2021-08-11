import { MutableRefObject, useCallback, useRef, useState } from 'react'

export const useStateRef = <T>(defaultValue: T): [T, (val: T) => void, MutableRefObject<T>] => {
  const [state, setState] = useState(defaultValue)
  const ref = useRef(state)
  var dispatch = useCallback(function (val: T) {
    ref.current = typeof val === "function" ?
      val(ref.current) : val
    setState(ref.current)
  }, [])
  return [state, dispatch, ref]
}