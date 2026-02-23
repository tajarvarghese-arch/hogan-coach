import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 32;

export default function EnergyFlowParticles({ curve, color, energy, active }) {
  const pointsRef = useRef();
  const tRef = useRef(new Float32Array(PARTICLE_COUNT));

  // Initialize evenly spaced t values
  useMemo(() => {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      tRef.current[i] = i / PARTICLE_COUNT;
    }
  }, []);

  const positions = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);
  const sizes = useMemo(() => {
    const s = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      s[i] = 0.03 + energy * 0.05;
    }
    return s;
  }, [energy]);

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return g;
  }, [positions, sizes]);

  const speed = 0.15 + energy * 0.25;

  useFrame((state, delta) => {
    if (!pointsRef.current || !active) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const t = tRef.current;
    const vec = new THREE.Vector3();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      t[i] = (t[i] + delta * speed) % 1.0;
      curve.getPointAt(t[i], vec);
      posAttr.array[i * 3] = vec.x;
      posAttr.array[i * 3 + 1] = vec.y;
      posAttr.array[i * 3 + 2] = vec.z;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geom}>
      <pointsMaterial
        color={color}
        size={0.04 + energy * 0.06}
        transparent
        opacity={active ? 0.7 : 0.05}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
        sizeAttenuation
      />
    </points>
  );
}
