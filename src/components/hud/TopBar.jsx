import useSimStore from '../../stores/useSimStore';

export default function TopBar() {
  const topology = useSimStore((s) => s.topology);
  const setTopology = useSimStore((s) => s.setTopology);
  const showTraces = useSimStore((s) => s.showTraces);
  const showEnergyFlow = useSimStore((s) => s.showEnergyFlow);
  const toggleVisibility = useSimStore((s) => s.toggleVisibility);

  const accent = topology === 'igbt' ? '#3b7dd8' : '#e17055';

  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{
          width: 3, height: 28,
          background: `linear-gradient(180deg, ${accent}, transparent)`,
          borderRadius: 2, marginTop: 2, flexShrink: 0,
        }} />
        <div style={{ flex: 1 }}>
          <div className="topbar-brand">Stark Industries // R&D Division</div>
          <div className="topbar-title">
            10 kV IRE Pulse Generator{' '}
            <span>// {topology === 'igbt' ? 'MARX-BANK' : 'INDUCTIVE ADDER'}</span>
          </div>
        </div>
      </div>

      <div className="topbar-controls">
        {[['igbt', 'IGBT / Marx-Bank'], ['ia', 'Inductive Adder']].map(([t, label]) => (
          <button
            key={t}
            className={`holo-btn ${topology === t ? 'active' : ''}`}
            onClick={() => setTopology(t)}
            style={topology === t ? { borderColor: accent, color: accent, background: accent + '15' } : {}}
          >
            {label.toUpperCase()}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        <button
          className={`holo-btn ${showTraces ? 'active' : ''}`}
          onClick={() => toggleVisibility('showTraces')}
        >
          TRACES {showTraces ? 'ON' : 'OFF'}
        </button>

        <button
          className={`holo-btn ${showEnergyFlow ? 'active' : ''}`}
          onClick={() => toggleVisibility('showEnergyFlow')}
          style={showEnergyFlow ? { borderColor: '#E8A84C', color: '#E8A84C', background: '#E8A84C15' } : {}}
        >
          ENERGY {showEnergyFlow ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );
}
