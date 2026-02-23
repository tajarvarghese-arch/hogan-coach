import { useMemo } from 'react';
import * as THREE from 'three';

const connLineArray = new Float32Array([0.15, 0, 0, 0.4, 0, 0]);

export default function PFNDetail() {
  const capGeom = useMemo(() => new THREE.BoxGeometry(0.2, 0.3, 0.2), []);
  const capEdge = useMemo(() => new THREE.EdgesGeometry(capGeom, 15), [capGeom]);

  return (
    <group>
      {/* 5 LC stages */}
      {Array.from({ length: 5 }, (_, i) => {
        const x = (i - 2) * 0.55;
        return (
          <group key={`lc-${i}`} position={[x, 0, 0]}>
            {/* Inductor (toroid) */}
            <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.1, 0.035, 8, 16]} />
              <meshBasicMaterial color="#d4873a" transparent opacity={0.35} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
            {/* Capacitor */}
            <mesh geometry={capGeom} position={[0, -0.15, 0]}>
              <meshBasicMaterial color="#1a6c1a" transparent opacity={0.2} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
            <lineSegments geometry={capEdge} position={[0, -0.15, 0]}>
              <lineBasicMaterial color="#fdcb6e" transparent opacity={0.5} toneMapped={false} />
            </lineSegments>
            {/* Connection line to next stage */}
            {i < 4 && (
              <line>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    args={[connLineArray, 3]}
                  />
                </bufferGeometry>
                <lineBasicMaterial color="#00f0ff" transparent opacity={0.3} />
              </line>
            )}
          </group>
        );
      })}
    </group>
  );
}
