import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export default function CapBankDetail() {
  const caps = useMemo(() => {
    const items = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        items.push({
          key: `cap-${r}-${c}`,
          pos: [(c - 1.5) * 0.45, r * 0.55 + 0.1, 0],
          voltage: (8000 + Math.random() * 2000).toFixed(0),
        });
      }
    }
    return items;
  }, []);

  const capGeom = useMemo(() => new THREE.BoxGeometry(0.35, 0.42, 0.35), []);
  const edgeGeom = useMemo(() => new THREE.EdgesGeometry(capGeom, 15), [capGeom]);

  return (
    <group>
      {caps.map((cap) => (
        <group key={cap.key} position={cap.pos}>
          <mesh geometry={capGeom}>
            <meshBasicMaterial color="#cc2222" transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <lineSegments geometry={edgeGeom}>
            <lineBasicMaterial color="#ff4444" transparent opacity={0.5} toneMapped={false} />
          </lineSegments>
          <Html position={[0, 0.28, 0]} center distanceFactor={6} style={{ pointerEvents: 'none' }}>
            <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", fontSize: '11px', color: '#ff6666', whiteSpace: 'nowrap' }}>
              {cap.voltage}V
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}
