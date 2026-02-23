import { useMemo } from 'react';
import HoloModule from './HoloModule';
import SignalFlowLine from './SignalFlow';
import EnergyFlowTube, { buildCurve } from './EnergyFlowTube';
import EnergyFlowParticles from './EnergyFlowParticles';
import WaveformGlyph from './WaveformGlyph';
import useSimStore from '../../stores/useSimStore';
import { getComps, getChain, getExtra, getDims3D, SUPPORT } from '../../data/components';
import { getEnergySegments } from '../../data/energyFlowConfig';

export default function PulseGenerator() {
  const topology = useSimStore((s) => s.topology);
  const showTraces = useSimStore((s) => s.showTraces);
  const showEnergyFlow = useSimStore((s) => s.showEnergyFlow);
  const selectedModule = useSimStore((s) => s.selectedModule);

  const comps = useMemo(() => getComps(topology), [topology]);
  const chain = useMemo(() => getChain(topology), [topology]);
  const extra = useMemo(() => getExtra(topology), [topology]);
  const energySegments = useMemo(() => getEnergySegments(topology), [topology]);

  // Compute 3D positions for signal chain (left to right along X)
  const layout = useMemo(() => {
    const positions = {};
    let cx = -6;

    chain.forEach((id) => {
      const [w, h] = getDims3D(id);
      positions[id] = [cx + w / 2, h / 2, 0];
      cx += w + 0.4;
    });

    let sx = -5;
    SUPPORT.forEach((id) => {
      const [w, h] = getDims3D(id);
      positions[id] = [sx + w / 2, h / 2, 3];
      sx += w + 0.4;
    });

    if (topology === 'ia' && positions.stack && !positions.lcap) {
      const [, h] = getDims3D('lcap');
      positions.lcap = [positions.stack[0] + 0.5, h / 2, -2];
    }

    return positions;
  }, [topology, chain]);

  // Split connections: chain (energy flow) vs extra (simple traces)
  const chainConns = useMemo(() => {
    const conns = [];
    for (let i = 0; i < chain.length - 1; i++) {
      conns.push([chain[i], chain[i + 1]]);
    }
    return conns;
  }, [chain]);

  // All component IDs
  const allIds = useMemo(() => {
    const ids = new Set([...chain, ...SUPPORT]);
    Object.keys(comps).forEach((k) => ids.add(k));
    return [...ids];
  }, [chain, comps]);

  const isFlowing = showEnergyFlow && showTraces;

  return (
    <group position={[0, 0, -4]}>
      {/* Chain connections — energy flow tubes + particles + glyphs */}
      {showTraces && chainConns.map(([fromId, toId]) => {
        const from = layout[fromId];
        const to = layout[toId];
        if (!from || !to) return null;
        const seg = energySegments.find((s) => s.from === fromId && s.to === toId);
        if (!seg) {
          const comp = comps[fromId];
          return (
            <SignalFlowLine
              key={`conn-${fromId}-${toId}`}
              from={from}
              to={to}
              color={comp?.color || '#D4A574'}
              active={selectedModule === fromId || selectedModule === toId}
            />
          );
        }
        const curve = buildCurve(from, to);
        const midpoint = curve.getPointAt(0.5);
        return (
          <group key={`energy-${fromId}-${toId}`}>
            <EnergyFlowTube from={from} to={to} config={seg} active={isFlowing} />
            <EnergyFlowParticles
              curve={curve}
              color={seg.color}
              energy={seg.energy}
              active={isFlowing}
            />
            {isFlowing && (
              <WaveformGlyph
                position={[midpoint.x, midpoint.y + 0.3, midpoint.z]}
                waveformType={seg.waveform}
                color={seg.color}
                label={seg.label}
                meters={seg.meters}
              />
            )}
          </group>
        );
      })}

      {/* Extra connections — simple dashed traces */}
      {showTraces && extra.map(([fromId, toId]) => {
        const from = layout[fromId];
        const to = layout[toId];
        if (!from || !to) return null;
        const comp = comps[fromId];
        const isActive = selectedModule === fromId || selectedModule === toId;
        return (
          <SignalFlowLine
            key={`extra-${fromId}-${toId}`}
            from={from}
            to={to}
            color={comp?.color || '#D4A574'}
            active={isActive}
          />
        );
      })}

      {/* Hardware modules */}
      {allIds.map((id) => {
        const comp = comps[id];
        const pos = layout[id];
        if (!comp || !pos) return null;
        return (
          <HoloModule
            key={id}
            id={id}
            comp={comp}
            position={pos}
          />
        );
      })}
    </group>
  );
}
