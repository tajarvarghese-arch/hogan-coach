import useSimStore from '../../stores/useSimStore';

export default function DataReadouts() {
  const totalEnergy = useSimStore((s) => s.totalEnergy);
  const currentImpedance = useSimStore((s) => s.currentImpedance);
  const peakTemperature = useSimStore((s) => s.peakTemperature);
  const currentPulse = useSimStore((s) => s.currentPulse);
  const protocol = useSimStore((s) => s.protocol);
  const simStatus = useSimStore((s) => s.simStatus);

  const readouts = [
    { label: 'ENERGY', value: `${totalEnergy.toFixed(1)} J`, color: '#D4A574' },
    { label: 'IMPEDANCE', value: currentImpedance ? `${currentImpedance.toFixed(0)} Ω` : '--- Ω', color: '#D4A574' },
    { label: 'PEAK TEMP', value: `+${peakTemperature.toFixed(2)} °C`, color: peakTemperature > 2 ? '#ff3333' : '#ffaa00', warn: peakTemperature > 2 },
    { label: 'PULSE', value: `${currentPulse} / ${protocol.numPulses}`, color: '#00ff44' },
    { label: 'STATUS', value: simStatus.toUpperCase(), color: simStatus === 'running' ? '#00ff44' : simStatus === 'paused' ? '#ffaa00' : '#666' },
  ];

  return (
    <div style={{
      position: 'absolute',
      left: 20,
      top: 225,
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
      pointerEvents: 'none',
      zIndex: 10,
    }}>
      {readouts.map((r) => (
        <div key={r.label} style={{
          background: 'rgba(0, 10, 20, 0.8)',
          border: `1px solid ${r.color}22`,
          borderRadius: 2,
          padding: '3px 8px',
          fontFamily: "'Inter', -apple-system, sans-serif",
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          minWidth: 160,
          animation: r.warn ? 'pulseGlow 1s infinite' : 'none',
        }}>
          <span style={{ fontSize: 11, color: '#7A6F63', letterSpacing: 1 }}>{r.label}</span>
          <span style={{ fontSize: 12, color: r.color, fontWeight: 600 }}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}
