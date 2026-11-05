/**
 * Efectos post (bloom/vignette). Desactivados de forma segura:
 * el paquete @react-three/postprocessing a veces rompe el build Docker/Vite.
 * Cuando el entorno sea estable se puede reactivar el EffectComposer.
 */
type ViewerPostEffectsProps = {
  multisampling: number
}

export default function ViewerPostEffects(_props: ViewerPostEffectsProps) {
  return null
}
