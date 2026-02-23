import { useMemo } from 'react';
import * as THREE from 'three';

export default function SwitchDetail() {
  const moduleGeom = useMemo(() => new THREE.BoxGeometry(0.3, 0.19, 0.53), []);
  const edgeGeom = useMemo(() => new THREE.EdgesGeometry(moduleGeom, 15), [moduleGeom]);
  const baseGeom = useMemo(() => new THREE.BoxGeometry(2.0, 0.05, 0.8), []);

  return (
    <group>
      {/* Copper baseplate */}
      <mesh geometry={baseGeom} position={[0, -0.12, 0]}>
        <meshStandardMaterial color="#dd8833" metalness={0.8} roughness={0.2} transparent opacity={0.4} />
      </mesh>

      {/* 6 switch modules */}
      {Array.from({ length: 6 }, (_, i) => (
        <group key={`sw-${i}`} position={[(i - 2.5) * 0.32, 0, 0]}>
          <mesh geometry={moduleGeom}>
            <meshBasicMaterial color="#080808" transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <lineSegments geometry={edgeGeom}>
            <lineBasicMaterial color="#8855cc" transparent opacity={0.5} toneMapped={false} />
          </lineSegments>
          {/* Trigger LED */}
          <mesh position={[0, 0.12, 0.2]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshBasicMaterial color="#00ff44" toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
