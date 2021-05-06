import React, { useEffect, useRef, useState } from "react"

/**
  * Make an element scrollable by dragging
  * ML: taken from https://valtism.com/src/use-drag-scroll.html
  * @param buttons - Buttons user can drag with. See https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
  * @returns {React.MutableRefObject} -  The ref to be applied to to the element to make it draggable
  */
export default function useDraggable(buttons = [1, 4, 5], onClick: () => void = null) {
  // Ref to be attached to the element we want to drag
  const ref = useRef<HTMLDivElement>()
  // Position of the mouse on the page on mousedown
  const [startX, setStartX] = useState(0)
  const [startY, setStartY] = useState(0)
  // Amount the draggable element is already scrolled
  const [startScrollLeft, setStartScrollLeft] = useState(0)
  const [startScrollTop, setStartScrollTop] = useState(0)

  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    function handleDown(e) {
      // Only allow dragging inside of target element
      if (!ref.current.contains(e.target)) return
      // Set initial positions of mouse element scroll
      setStartX(e.pageX - ref.current.offsetLeft)
      setStartY(e.pageY - ref.current.offsetTop)
      setStartScrollLeft(ref.current.scrollLeft)
      setStartScrollTop(ref.current.scrollTop)
    }
    function handleMove(e: MouseEvent) {
      // Don't fire if other buttons are pressed
      if (!buttons.includes(e.buttons) || !ref.current.contains(e.target as Node)) return
      e.preventDefault()
      if (!isDragging) setIsDragging(true)
      // Position of mouse on the page
      const mouseX = e.pageX - ref.current.offsetLeft
      const mouseY = e.pageY - ref.current.offsetTop
      // Distance of the mouse from the origin of the last mousedown event
      const walkX = mouseX - startX
      const walkY = mouseY - startY
      // Set element scroll
      ref.current.scrollLeft = startScrollLeft - walkX
      ref.current.scrollTop = startScrollTop - walkY
    }

    function handleUp(e: MouseEvent) {
      if (!ref.current.contains(e.target as Node)) return
      if (isDragging)
        setIsDragging(false)
      else
        if (onClick) onClick()
    }

    // Add and clean up listeners
    document.addEventListener("mousedown", handleDown)
    document.addEventListener("mousemove", handleMove)
    document.addEventListener("mouseup", handleUp)

    return () => {
      document.removeEventListener("mousedown", handleDown)
      document.removeEventListener("mousemove", handleMove)
      document.removeEventListener("mouseup", handleUp)
    }
  })

  return { ref, isDragging }
}