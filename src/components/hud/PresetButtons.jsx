import useSimStore from '../../stores/useSimStore';
import { PRESETS } from '../../data/tissuePresets';

export default function PresetButtons() {
  const loadPreset = useSimStore((s) => s.loadPreset);
  const currentPreset = useSimStore((s) => s.protocol.preset);

  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
      {Object.entries(PRESETS).map(([key, preset]) => (
        <button
          key={key}
          className={`holo-btn ${currentPreset === key ? 'active' : ''}`}
          onClick={() => loadPreset(key)}
          style={{ fontSize: 7, padding: '2px 6px' }}
        >
          {preset.label.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
