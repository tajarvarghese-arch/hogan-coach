import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Grid } from '@react-three/drei';

export default function HologramEnvironment() {
  return (
    <group>
      <HoloGrid />
      <ParticleDust count={300} />
      <ambientLight intensity={0.15} />
      <pointLight position={[5, 8, 5]} intensity={0.4} color="#1e90ff" />
      <pointLight position={[-5, 6, -3]} intensity={0.2} color="#00f0ff" />
    </group>
  );
}

function HoloGrid() {
  return (
    <Grid
      position={[0, -0.01, 0]}
      args={[30, 30]}
      cellSize={0.5}
      cellThickness={0.3}
      cellColor="#00f0ff"
      sectionSize={2}
      sectionThickness={0.8}
      sectionColor="#1e90ff"
      fadeDistance={20}
      fadeStrength={1.5}
      infiniteGrid
    />
  );
}

function ParticleDust({ count = 300 }) {
  const ref = useRef();

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = Math.random() * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] += delta * 0.04;
      if (pos[i + 1] > 10) pos[i + 1] = -0.5;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#00f0ff"
        size={0.025}
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
