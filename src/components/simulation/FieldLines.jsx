import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import useSimStore from '../../stores/useSimStore';

export default function FieldLines() {
  const showFieldLines = useSimStore((s) => s.showFieldLines);
  const protocol = useSimStore((s) => s.protocol);
  const simStatus = useSimStore((s) => s.simStatus);

  const spacing = protocol.electrodeSpacing * 100;

  // Generate field line curves between electrode pairs
  const lines = useMemo(() => {
    const result = [];
    const numLines = 8;

    for (let i = 0; i < numLines; i++) {
      const angle = (i / numLines) * Math.PI * 2;
      const r = 0.3;
      const points = [];
      const steps = 20;

      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const x = -spacing / 2 + t * spacing;
        const y = Math.sin(t * Math.PI) * r * Math.cos(angle) * 2;
        const z = Math.sin(t * Math.PI) * r * Math.sin(angle) * 2;
        points.push([x, y, z]);
      }
      result.push(points);
    }
    return result;
  }, [spacing]);

  if (!showFieldLines || simStatus === 'idle') return null;

  return (
    <group position={[0, 0, 0]}>
      {lines.map((pts, i) => (
        <AnimatedFieldLine key={i} points={pts} />
      ))}
    </group>
  );
}

function AnimatedFieldLine({ points }) {
  const lineRef = useRef();

  useFrame((state) => {
    if (lineRef.current && lineRef.current.material) {
      lineRef.current.material.dashOffset = -state.clock.elapsedTime * 0.8;
    }
  });

  return (
    <Line
      ref={lineRef}
      points={points}
      color="#00f0ff"
      lineWidth={1}
      transparent
      opacity={0.25}
      dashed
      dashSize={0.12}
      gapSize={0.08}
    />
  );
}
