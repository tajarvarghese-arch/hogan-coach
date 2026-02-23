import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useSimStore from '../../stores/useSimStore';
import energyVert from '../../shaders/energyFlow.vert?raw';
import energyFrag from '../../shaders/energyFlow.frag?raw';

export function buildCurve(from, to) {
  const mid = [
    (from[0] + to[0]) / 2,
    Math.max(from[1], to[1]) + 0.3,
    (from[2] + to[2]) / 2,
  ];
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(...from),
    new THREE.Vector3(...mid),
    new THREE.Vector3(...to),
  ]);
}

export default function EnergyFlowTube({ from, to, config, active }) {
  const matRef = useRef();
  const [hovered, setHovered] = useState(false);

  const curve = useMemo(() => buildCurve(from, to), [from, to]);

  // Radius proportional to CURRENT (thicker tube = more amps flowing)
  const currentNorm = config.meters?.i || 0.5;
  const radius = 0.015 + currentNorm * 0.055;

  // Voltage drives emission/brightness (higher voltage = brighter glow)
  const voltageNorm = config.meters?.v || 0.5;

  const tubeGeom = useMemo(
    () => new THREE.TubeGeometry(curve, 48, radius, 8, false),
    [curve, radius]
  );

  // Tooltip position: offset well above and behind the tube so it doesn't overlap
  const tooltipPos = useMemo(() => {
    const mid = curve.getPointAt(0.5);
    return [mid.x, mid.y + 2.5, mid.z - 5];
  }, [curve]);

  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(config.color) },
    uTime: { value: 0 },
    uWaveformType: { value: config.waveform },
    uSpeed: { value: config.speed || 0.5 },
    uEnergy: { value: config.energy || 0.5 },
    uVoltage: { value: voltageNorm },
    uActive: { value: active ? 1.0 : 0.0 },
    uHovered: { value: 0.0 },
  }), [config.color, config.waveform, config.speed, config.energy, voltageNorm, active]);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      matRef.current.uniforms.uActive.value = active ? 1.0 : 0.0;
      matRef.current.uniforms.uHovered.value = hovered ? 1.0 : 0.0;
    }
  });

  const handlePointerEnter = (e) => {
    e.stopPropagation();
    setHovered(true);
    if (config.tooltip) {
      useSimStore.getState().showTooltip({
        text: config.tooltip,
        worldPos: tooltipPos,
        elementId: `energy-${config.from}-${config.to}`,
      });
    }
    document.body.style.cursor = 'pointer';
  };

  const handlePointerLeave = () => {
    setHovered(false);
    useSimStore.getState().hideTooltip();
    document.body.style.cursor = 'default';
  };

  return (
    <mesh
      geometry={tubeGeom}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <shaderMaterial
        ref={matRef}
        vertexShader={energyVert}
        fragmentShader={energyFrag}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        toneMapped={false}
        uniforms={uniforms}
      />
    </mesh>
  );
}
