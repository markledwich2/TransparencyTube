import { useState, useEffect } from 'react'

const getWindowDim = () => typeof window === 'undefined'
  ? ({ w: 800, h: 600 })
  : ({ w: window.innerWidth, h: window.innerHeight })

export const useWindowDim = () => {
  const [windowDimensions, setWindowDimensions] = useState(getWindowDim())
  useEffect(() => {
    const handleResize = () => setWindowDimensions(getWindowDim())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  return windowDimensions
}
