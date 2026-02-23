import { useMemo } from 'react';
import * as THREE from 'three';
import useSimStore from '../../stores/useSimStore';
import { Html } from '@react-three/drei';
import { SIM_ELI5 } from '../../data/eli5';

const tissueBoxGeom = new THREE.BoxGeometry(5, 1.5, 5);
const tissueEdgesGeom = new THREE.EdgesGeometry(tissueBoxGeom, 15);

export default function TissueVolume() {
  const protocol = useSimStore((s) => s.protocol);
  const spacing = protocol.electrodeSpacing * 100; // m -> scene units (approx)
  const numPairs = protocol.numElectrodePairs;

  // Generate electrode positions
  const electrodes = useMemo(() => {
    const elecs = [];
    for (let p = 0; p < numPairs; p++) {
      const offset = (p - (numPairs - 1) / 2) * spacing * 1.5;
      elecs.push({ x: offset - spacing / 2, z: 0, polarity: '+' });
      elecs.push({ x: offset + spacing / 2, z: 0, polarity: '-' });
    }
    return elecs;
  }, [numPairs, spacing]);

  return (
    <group position={[0, 0, 0]}>
      {/* Tissue slab */}
      <mesh
        onPointerEnter={(e) => {
          e.stopPropagation();
          useSimStore.getState().showTooltip({
            text: SIM_ELI5.tissue,
            worldPos: [0, 2, 5],
            elementId: 'tissue',
          });
        }}
        onPointerLeave={() => useSimStore.getState().hideTooltip()}
      >
        <boxGeometry args={[5, 1.5, 5]} />
        <meshStandardMaterial
          color="#4a2525"
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
          depthWrite={false}
          wireframe={false}
        />
      </mesh>

      {/* Tissue wireframe overlay */}
      <mesh>
        <boxGeometry args={[5, 1.5, 5]} />
        <meshBasicMaterial
          color="#4a2525"
          wireframe
          transparent
          opacity={0.06}
        />
      </mesh>

      {/* Tissue edge glow */}
      <lineSegments geometry={tissueEdgesGeom}>
        <lineBasicMaterial color="#ff4444" transparent opacity={0.15} toneMapped={false} />
      </lineSegments>

      {/* Electrode needles */}
      {electrodes.map((e, i) => (
        <group key={`elec-${i}`} position={[e.x, 0, e.z]}>
          {/* Needle body */}
          <mesh>
            <cylinderGeometry args={[0.03, 0.02, 2.0, 8]} />
            <meshStandardMaterial
              color="#c0c0c0"
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          {/* Glowing tip */}
          <mesh position={[0, -1.0, 0]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial
              color={e.polarity === '+' ? '#ff4444' : '#4444ff'}
              toneMapped={false}
            />
          </mesh>
          {/* Polarity label */}
          <Html position={[0, 1.2, 0]} center distanceFactor={6} style={{ pointerEvents: 'none' }}>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '13px',
              color: e.polarity === '+' ? '#D4605A' : '#6A8ED4',
              fontWeight: 600,
            }}>
              {e.polarity}
            </div>
          </Html>
        </group>
      ))}

      {/* Label */}
      <Html position={[0, -1.3, 0]} center distanceFactor={7} style={{ pointerEvents: 'none' }}>
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '13px',
          fontWeight: 400,
          color: '#7A6F63',
          textTransform: 'uppercase',
          letterSpacing: '2px',
        }}>
          Tissue Volume // {protocol.preset?.toUpperCase() || 'LIVER'}
        </div>
      </Html>
    </group>
  );
}
