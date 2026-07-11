import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'

type ViewerPostEffectsProps = {
  multisampling: number
}

export default function ViewerPostEffects({ multisampling }: ViewerPostEffectsProps) {
  return (
    <EffectComposer multisampling={multisampling}>
      <Bloom
        luminanceThreshold={0.78}
        luminanceSmoothing={0.35}
        intensity={0.38}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.14} darkness={0.62} />
    </EffectComposer>
  )
}
