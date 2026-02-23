import useSimStore from '../../stores/useSimStore';
import PresetButtons from './PresetButtons';

export default function ProtocolPanel() {
  const protocol = useSimStore((s) => s.protocol);
  const setProtocol = useSimStore((s) => s.setProtocol);
  const simStatus = useSimStore((s) => s.simStatus);
  const currentPulse = useSimStore((s) => s.currentPulse);
  const startSim = useSimStore((s) => s.startSim);
  const pauseSim = useSimStore((s) => s.pauseSim);
  const resumeSim = useSimStore((s) => s.resumeSim);
  const resetSim = useSimStore((s) => s.resetSim);

  const sliders = [
    { label: 'VOLTAGE', key: 'voltage', min: 500, max: 3000, step: 50, unit: 'V', val: protocol.voltage },
    { label: 'PULSE WIDTH', key: 'pulseWidth', min: 50e-6, max: 100e-6, step: 5e-6, unit: 'us', val: protocol.pulseWidth, display: (v) => (v * 1e6).toFixed(0) },
    { label: 'NUM PULSES', key: 'numPulses', min: 10, max: 100, step: 5, unit: '', val: protocol.numPulses },
    { label: 'ELECTRODE GAP', key: 'electrodeSpacing', min: 10e-3, max: 25e-3, step: 1e-3, unit: 'mm', val: protocol.electrodeSpacing, display: (v) => (v * 1e3).toFixed(0) },
    { label: 'ELECTRODE PAIRS', key: 'numElectrodePairs', min: 1, max: 3, step: 1, unit: '', val: protocol.numElectrodePairs },
  ];

  return (
    <div style={{
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 290,
      background: 'linear-gradient(180deg, rgba(10, 16, 32, 0.92), rgba(6, 9, 15, 0.95))',
      borderLeft: '1px solid rgba(0, 240, 255, 0.15)',
      borderTop: '1px solid rgba(0, 240, 255, 0.15)',
      padding: '8px 10px',
      pointerEvents: 'auto',
      fontFamily: "'Inter', -apple-system, sans-serif",
      zIndex: 10,
      maxHeight: '50vh',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ fontSize: 11, color: '#D4A574', letterSpacing: 2, marginBottom: 6, fontWeight: 600, opacity: 0.6 }}>
        // PULSE PROTOCOL
      </div>

      {/* Simulation controls */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {simStatus === 'idle' && (
          <button className="holo-btn active" onClick={startSim} style={{ flex: 1, color: '#00ff44', borderColor: '#00ff4444' }}>
            START
          </button>
        )}
        {simStatus === 'running' && (
          <button className="holo-btn" onClick={pauseSim} style={{ flex: 1, color: '#ffaa00', borderColor: '#ffaa0044' }}>
            PAUSE
          </button>
        )}
        {simStatus === 'paused' && (
          <button className="holo-btn active" onClick={resumeSim} style={{ flex: 1, color: '#00ff44', borderColor: '#00ff4444' }}>
            RESUME
          </button>
        )}
        {simStatus === 'complete' && (
          <button className="holo-btn" disabled style={{ flex: 1, opacity: 0.4 }}>
            COMPLETE
          </button>
        )}
        <button className="holo-btn danger" onClick={resetSim} style={{ flex: 1 }}>
          RESET
        </button>
      </div>

      {/* Pulse counter */}
      {simStatus !== 'idle' && (
        <div style={{ fontSize: 11, color: '#7888a8', marginBottom: 6, textAlign: 'center' }}>
          PULSE {currentPulse} / {protocol.numPulses}
          <div style={{
            height: 2,
            background: 'rgba(0, 240, 255, 0.1)',
            borderRadius: 1,
            marginTop: 3,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${(currentPulse / protocol.numPulses) * 100}%`,
              background: 'linear-gradient(90deg, #00f0ff, #1e90ff)',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      )}

      {/* Clinical presets */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 11, color: '#7A6F63', marginBottom: 3, letterSpacing: 1 }}>CLINICAL PRESET</div>
        <PresetButtons />
      </div>

      {/* Sliders */}
      {sliders.map((s) => (
        <div key={s.key} style={{ marginBottom: 5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#7A6F63', marginBottom: 2 }}>
            <span>{s.label}</span>
            <span style={{ color: '#D4A574' }}>
              {s.display ? s.display(s.val) : s.val}{s.unit}
            </span>
          </div>
          <input
            type="range"
            min={s.min}
            max={s.max}
            step={s.step}
            value={s.val}
            onChange={(e) => setProtocol({ [s.key]: parseFloat(e.target.value) })}
            disabled={simStatus === 'running'}
            style={{
              width: '100%',
              height: 3,
              appearance: 'none',
              background: 'rgba(0, 240, 255, 0.1)',
              borderRadius: 2,
              outline: 'none',
              cursor: simStatus === 'running' ? 'not-allowed' : 'pointer',
              accentColor: '#D4A574',
            }}
          />
        </div>
      ))}
    </div>
  );
}
