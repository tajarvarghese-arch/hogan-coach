import { useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import useSimStore from '../../stores/useSimStore';

export default function CellInset() {
  const showCellInset = useSimStore((s) => s.showCellInset);
  const fieldData = useSimStore((s) => s.fieldData);
  const tissue = useSimStore((s) => s.tissue);

  if (!showCellInset) return null;

  // Estimate transmembrane voltage from average field
  let avgE = 0;
  if (fieldData) {
    let sum = 0;
    for (let i = 0; i < fieldData.length; i++) sum += fieldData[i];
    avgE = sum / fieldData.length;
  }
  const vm = 1.5 * avgE * tissue.cellRadius;
  const porated = Math.abs(vm) > tissue.porThreshold;

  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      left: 20,
      width: 240,
      height: 170,
      background: 'rgba(0, 10, 20, 0.85)',
      border: '1px solid rgba(0, 240, 255, 0.25)',
      borderRadius: 4,
      overflow: 'hidden',
      pointerEvents: 'auto',
      zIndex: 20,
    }}>
      {/* Header */}
      <div style={{
        padding: '4px 8px',
        borderBottom: '1px solid rgba(0, 240, 255, 0.15)',
        fontFamily: "'Inter', -apple-system, sans-serif",
        fontSize: '11px',
        color: '#D4A574',
        letterSpacing: '1.5px',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>// CELL MEMBRANE</span>
        <span style={{ color: porated ? '#00ff44' : '#666' }}>
          Vm: {(vm * 1e3).toFixed(1)}mV {porated ? '// PORATED' : ''}
        </span>
      </div>

      {/* 3D Cell view */}
      <Canvas
        camera={{ position: [0, 0, 4], fov: 40 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[3, 3, 3]} intensity={0.5} color="#00f0ff" />
        <CellMembrane porated={porated} vm={vm} />
      </Canvas>
    </div>
  );
}

function CellMembrane({ porated, vm }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  // Generate phospholipid positions in two layers
  const lipids = useMemo(() => {
    const items = [];
    const rows = 6;
    const cols = 12;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c - cols / 2 + 0.5) * 0.22;
        const y = (r - rows / 2 + 0.5) * 0.25;
        // Skip some in the center if porated
        const distFromCenter = Math.sqrt(x * x + y * y);
        items.push({ x, y, outer: true, skip: porated && distFromCenter < 0.3 });
        items.push({ x, y, outer: false, skip: porated && distFromCenter < 0.3 });
      }
    }
    return items;
  }, [porated]);

  return (
    <group ref={groupRef}>
      {/* Lipid bilayer */}
      {lipids.map((l, i) => {
        if (l.skip) return null;
        const z = l.outer ? 0.08 : -0.08;
        return (
          <group key={i} position={[l.x, l.y, z]}>
            {/* Head (sphere) */}
            <mesh position={[0, 0, l.outer ? 0.06 : -0.06]}>
              <sphereGeometry args={[0.04, 6, 6]} />
              <meshBasicMaterial
                color={l.outer ? '#3388ff' : '#3388ff'}
                transparent
                opacity={0.5}
              />
            </mesh>
            {/* Tail (line) */}
            <mesh>
              <cylinderGeometry args={[0.008, 0.008, 0.1, 4]} />
              <meshBasicMaterial color="#ffcc44" transparent opacity={0.3} />
            </mesh>
          </group>
        );
      })}

      {/* Pore glow when porated */}
      {porated && (
        <mesh position={[0, 0, 0]}>
          <ringGeometry args={[0.15, 0.35, 16]} />
          <meshBasicMaterial
            color="#00ff44"
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  );
}
