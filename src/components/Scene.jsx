import { Suspense } from 'react';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import HologramEnvironment from './HologramEnvironment';
import PulseGenerator from './hardware/PulseGenerator';
import TissueVolume from './simulation/TissueVolume';
import ElectricField from './simulation/ElectricField';
import FieldLines from './simulation/FieldLines';
import AblationZone from './simulation/AblationZone';
import HoloTooltip from './ui/HoloTooltip';
import useSimStore from '../stores/useSimStore';

export default function Scene() {
  const showSimulation = useSimStore((s) => s.showSimulation);

  return (
    <>
      <color attach="background" args={['#0a0a0f']} />
      <fog attach="fog" args={['#0a0a0f', 15, 35]} />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={25}
        maxPolarAngle={Math.PI / 2.1}
      />

      <Suspense fallback={null}>
        <HologramEnvironment />
        <PulseGenerator />

        {showSimulation && (
          <group position={[0, 0, 5]}>
            <TissueVolume />
            <ElectricField />
            <FieldLines />
            <AblationZone />
          </group>
        )}

        <HoloTooltip />
      </Suspense>

      <EffectComposer>
        <Bloom
          intensity={0.8}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Vignette darkness={0.5} offset={0.3} />
      </EffectComposer>
    </>
  );
}
