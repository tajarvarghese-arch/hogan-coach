import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useSimStore from '../../stores/useSimStore';
import { SIM_ELI5 } from '../../data/eli5';

export default function AblationZone() {
  const ablationData = useSimStore((s) => s.ablationData);
  const simStatus = useSimStore((s) => s.simStatus);
  const meshRef = useRef();

  // Compute ablation radius from data
  const ablationRadius = ablationData ? computeAblationRadius(ablationData) : 0;

  useFrame((state) => {
    if (!meshRef.current) return;
    const pulse = Math.sin(state.clock.elapsedTime * 1.5) * 0.05 + 1.0;
    meshRef.current.scale.set(pulse, pulse, pulse);
  });

  if (ablationRadius < 0.1 || simStatus === 'idle') return null;

  return (
    <mesh
      ref={meshRef}
      position={[0, 0, 0]}
      onPointerEnter={(e) => {
        e.stopPropagation();
        useSimStore.getState().showTooltip({
          text: SIM_ELI5.ablationZone,
          worldPos: [0, 1.5, 5],
          elementId: 'ablation',
        });
      }}
      onPointerLeave={() => useSimStore.getState().hideTooltip()}
    >
      <sphereGeometry args={[ablationRadius, 32, 16]} />
      <meshBasicMaterial
        color="#00ff44"
        transparent
        opacity={0.12}
        side={THREE.DoubleSide}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function computeAblationRadius(data) {
  // Count ablated cells, estimate radius
  let count = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i] > 0.5) count++;
  }
  const fraction = count / data.length;
  return Math.sqrt(fraction) * 2.5; // scale to scene
}
