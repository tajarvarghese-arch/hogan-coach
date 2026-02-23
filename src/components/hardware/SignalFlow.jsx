import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';

export default function SignalFlowLine({ from, to, color = '#00f0ff', active = false }) {
  const lineRef = useRef();

  useFrame((state) => {
    if (lineRef.current && lineRef.current.material) {
      lineRef.current.material.dashOffset = -state.clock.elapsedTime * 0.5;
    }
  });

  if (!from || !to) return null;

  return (
    <Line
      ref={lineRef}
      points={[from, to]}
      color={color}
      lineWidth={active ? 2 : 1}
      transparent
      opacity={active ? 0.4 : 0.12}
      dashed
      dashSize={0.15}
      gapSize={0.1}
    />
  );
}
