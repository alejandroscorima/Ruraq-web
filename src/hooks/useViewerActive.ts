import { useEffect, useState, type RefObject } from 'react'

export function useViewerActive(targetRef: RefObject<HTMLElement | null>) {
  const [intersecting, setIntersecting] = useState(true)
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState === 'visible',
  )

  useEffect(() => {
    const node = targetRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => setIntersecting(entry.isIntersecting),
      { threshold: 0.08, rootMargin: '80px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [targetRef])

  useEffect(() => {
    const onVisibilityChange = () => {
      setPageVisible(document.visibilityState === 'visible')
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  return intersecting && pageVisible
}
