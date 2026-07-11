import { useEffect, useState } from 'react'

export type ViewerQuality = 'low' | 'medium' | 'high'

export type ViewerQualitySettings = {
  tier: ViewerQuality
  maxDpr: number
  antialias: boolean
  bloom: boolean
  environment: boolean
  environmentResolution: number
  contactShadowResolution: number
  contactShadowBlur: number
  flickerLights: boolean
  effectMultisampling: number
}

const QUALITY_SETTINGS: Record<ViewerQuality, ViewerQualitySettings> = {
  low: {
    tier: 'low',
    maxDpr: 1,
    antialias: false,
    bloom: false,
    environment: false,
    environmentResolution: 128,
    contactShadowResolution: 128,
    contactShadowBlur: 2.8,
    flickerLights: false,
    effectMultisampling: 0,
  },
  medium: {
    tier: 'medium',
    maxDpr: 1.25,
    antialias: true,
    bloom: false,
    environment: true,
    environmentResolution: 256,
    contactShadowResolution: 256,
    contactShadowBlur: 2.4,
    flickerLights: false,
    effectMultisampling: 0,
  },
  high: {
    tier: 'high',
    maxDpr: 1.75,
    antialias: true,
    bloom: true,
    environment: true,
    environmentResolution: 512,
    contactShadowResolution: 384,
    contactShadowBlur: 2.2,
    flickerLights: true,
    effectMultisampling: 2,
  },
}

function detectTier(): ViewerQuality {
  if (typeof window === 'undefined') return 'medium'

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches
  const narrow = window.innerWidth < 768
  const lowMemory =
    'deviceMemory' in navigator &&
    Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory) <= 4
  const lowCpu = (navigator.hardwareConcurrency ?? 8) <= 4

  if (reducedMotion || (coarsePointer && narrow) || (lowMemory && narrow)) {
    return 'low'
  }

  if (narrow || coarsePointer || lowCpu) {
    return 'medium'
  }

  return 'high'
}

export function useViewerQuality() {
  const [tier, setTier] = useState<ViewerQuality>(detectTier)

  useEffect(() => {
    const update = () => setTier(detectTier())

    window.addEventListener('resize', update)
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    motion.addEventListener('change', update)

    return () => {
      window.removeEventListener('resize', update)
      motion.removeEventListener('change', update)
    }
  }, [])

  return QUALITY_SETTINGS[tier]
}
