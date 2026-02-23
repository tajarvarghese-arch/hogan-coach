import { useMemo } from 'react';
import * as THREE from 'three';

export default function IAStackDetail() {
  return (
    <group>
      {/* Central copper rod */}
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 2.6, 12]} />
        <meshStandardMaterial color="#dd8833" metalness={0.9} roughness={0.1} transparent opacity={0.6} />
      </mesh>

      {/* 10 toroid modules, fanned out vertically */}
      {Array.from({ length: 10 }, (_, i) => {
        const y = i * 0.26;
        return (
          <group key={`ia-${i}`} position={[0, y, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.35, 0.08, 8, 24]} />
              <meshBasicMaterial
                color="#555566"
                transparent
                opacity={0.15}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
            {/* Toroid edge glow */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.35, 0.081, 8, 24]} />
              <meshBasicMaterial
                color="#00b894"
                wireframe
                transparent
                opacity={0.2}
                toneMapped={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
