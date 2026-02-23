import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { getDims3D } from '../../data/components';
import { useComponentGeometry } from './ModelLoader';
import useSimStore from '../../stores/useSimStore';
import holoVert from '../../shaders/hologram.vert?raw';
import holoFrag from '../../shaders/hologram.frag?raw';
import CapBankDetail from './CapBankDetail';
import SwitchDetail from './SwitchDetail';
import PFNDetail from './PFNDetail';
import IAStackDetail from './IAStackDetail';

const DETAIL_MAP = {
  caps: CapBankDetail,
  sw: SwitchDetail,
  pfn: PFNDetail,
  stack: IAStackDetail,
};

export default function HoloModule({ id, comp, position = [0, 0, 0] }) {
  const materialRef = useRef();
  const edgeGlowRef = useRef();
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);

  const selectedModule = useSimStore((s) => s.selectedModule);
  const isSelected = selectedModule === id;
  const isExpanded = useSimStore((s) => s.expandedModules.has(id));

  const [w, h, d] = getDims3D(id);
  const targetScale = isExpanded ? 1.5 : 1.0;
  const scaleRef = useRef(1.0);

  // Get geometry — GLB model override if available, otherwise procedural shape
  const geom = useComponentGeometry(id, w, h, d);
  const edgesGeom = useMemo(() => new THREE.EdgesGeometry(geom, 15), [geom]);

  // Shader uniforms — created once per mount
  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(comp.color) },
    uOpacity: { value: 0.1 },
    uTime: { value: 0 },
    uScanSpeed: { value: 0.4 },
    uSelected: { value: 0 },
    uHovered: { value: 0 },
  }), [comp.color]);

  const DetailComponent = DETAIL_MAP[id] || null;

  // Animate shader uniforms + expand/collapse scale every frame
  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uSelected.value = isSelected ? 1.0 : 0.0;
      materialRef.current.uniforms.uHovered.value = hovered ? 1.0 : 0.0;
    }
    if (edgeGlowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      edgeGlowRef.current.opacity = isSelected ? 0.9 + pulse : hovered ? 0.6 : 0.3;
      edgeGlowRef.current.color.set(isSelected ? '#ffffff' : hovered ? comp.color : '#00f0ff');
    }
    // Smooth expand/collapse scale lerp
    if (groupRef.current) {
      scaleRef.current += (targetScale - scaleRef.current) * Math.min(delta * 8, 1);
      const s = scaleRef.current;
      groupRef.current.scale.set(s, s, s);
    }
  });

  const handleClick = (e) => {
    e.stopPropagation();
    useSimStore.getState().selectModule(id);
    if (comp.exp) {
      useSimStore.getState().toggleExpand(id);
    }
  };

  const handlePointerEnter = (e) => {
    e.stopPropagation();
    setHovered(true);
    useSimStore.getState().setHovered(id);
    useSimStore.getState().showTooltip({
      text: comp.eli5,
      worldPos: [position[0], position[1] + h / 2 + 0.4, position[2] - 4],
      elementId: id,
    });
    document.body.style.cursor = 'pointer';
  };

  const handlePointerLeave = () => {
    setHovered(false);
    useSimStore.getState().setHovered(null);
    useSimStore.getState().hideTooltip();
    document.body.style.cursor = 'default';
  };

  return (
    <group position={position} ref={groupRef}>
      {/* Holographic face fill — custom shader */}
      <mesh
        geometry={geom}
        onClick={handleClick}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <shaderMaterial
          ref={materialRef}
          vertexShader={holoVert}
          fragmentShader={holoFrag}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          uniforms={uniforms}
        />
      </mesh>

      {/* Glowing edges (bloom-friendly) */}
      <lineSegments geometry={edgesGeom}>
        <lineBasicMaterial
          ref={edgeGlowRef}
          color="#00f0ff"
          transparent
          opacity={0.3}
          toneMapped={false}
        />
      </lineSegments>

      {/* Label below module */}
      <Html
        position={[0, -h / 2 - 0.2, 0]}
        center
        distanceFactor={6}
        style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}
      >
        <div style={{
          fontFamily: "'Inter', -apple-system, sans-serif",
          fontSize: '14px',
          fontWeight: isSelected ? 600 : 400,
          color: isSelected ? '#E8DDD3' : '#7A6F63',
          textAlign: 'center',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          textShadow: isSelected ? `0 0 12px ${comp.color}` : 'none',
        }}>
          {comp.name}
        </div>
      </Html>

      {/* EXP badge */}
      {comp.exp && (
        <Html
          position={[w / 2 + 0.15, h / 2, 0]}
          center
          distanceFactor={6}
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '10px',
            color: '#D4605A',
            fontWeight: 600,
            letterSpacing: '1px',
            textShadow: '0 0 6px rgba(212, 96, 90, 0.4)',
          }}>
            EXP
          </div>
        </Html>
      )}

      {/* Selection ring on ground */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -h / 2 + 0.01, 0]}>
          <ringGeometry args={[Math.max(w, d) * 0.6, Math.max(w, d) * 0.65, 32]} />
          <meshBasicMaterial
            color={comp.color}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* Expanded detail view */}
      {isExpanded && DetailComponent && (
        <group position={[0, h / 2 + 0.3, 0]}>
          <DetailComponent />
        </group>
      )}
    </group>
  );
}
