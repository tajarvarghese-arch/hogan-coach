import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useSimStore from '../../stores/useSimStore';

export default function ElectricField() {
  const fieldData = useSimStore((s) => s.fieldData);
  const gridSize = useSimStore((s) => s.gridSize);
  const showEField = useSimStore((s) => s.showEField);
  const meshRef = useRef();
  const textureRef = useRef();

  // Create data texture
  const dataTexture = useMemo(() => {
    const data = new Uint8Array(gridSize * gridSize * 4);
    const tex = new THREE.DataTexture(data, gridSize, gridSize, THREE.RGBAFormat);
    tex.needsUpdate = true;
    textureRef.current = tex;
    return tex;
  }, [gridSize]);

  // Update texture when field data changes
  useEffect(() => {
    if (!fieldData || !textureRef.current) return;

    const data = textureRef.current.image.data;
    let maxE = 0;
    for (let i = 0; i < fieldData.length; i++) {
      if (fieldData[i] > maxE) maxE = fieldData[i];
    }
    if (maxE === 0) maxE = 1;

    for (let i = 0; i < gridSize * gridSize; i++) {
      const t = Math.min(fieldData[i] / maxE, 1.0);
      // Blue -> Cyan -> White
      const r = Math.floor(t * t * 255);
      const g = Math.floor(Math.min(t * 1.5, 1) * 255);
      const b = 255;
      const a = Math.floor(Math.pow(t, 0.5) * 180);

      data[i * 4] = r;
      data[i * 4 + 1] = g;
      data[i * 4 + 2] = b;
      data[i * 4 + 3] = a;
    }
    textureRef.current.needsUpdate = true;
  }, [fieldData, gridSize]);

  if (!showEField) return null;

  return (
    <mesh
      ref={meshRef}
      position={[0, 0.76, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[5, 5]} />
      <meshBasicMaterial
        map={dataTexture}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}
