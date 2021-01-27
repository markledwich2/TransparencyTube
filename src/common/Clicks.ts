import React, { MutableRefObject, useEffect } from 'react'

/**
 * Hook to handle clicks outside the given element
 * @param ref reference to the dom element you want to have the OnOutside even fire when something else is clicked
 * @param onOutside handles when anything outside the element is clicked
 */
export const useClickOutside = (ref: MutableRefObject<Element>, onOutside: (n: Node) => void) => {
  useEffect(() => {
    const listener = (e: MouseEvent | TouchEvent) => {
      const n = e.target as Node
      if (!ref.current || ref.current.contains(n)) return
      onOutside(n)
    }

    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    return () => {
      document.removeEventListener('mousedown', e => listener)
      document.removeEventListener('touchstart', e => listener)
    }
  }, [ref, onOutside])
}