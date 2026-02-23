import { useMemo } from 'react';
import useSimStore from '../../stores/useSimStore';
import { getComps, getIds, getChain, getExtra, dims, SUPPORT } from '../../data/components';

export default function DetailPanel() {
  const topology = useSimStore((s) => s.topology);
  const selectedModule = useSimStore((s) => s.selectedModule);
  const hoveredModule = useSimStore((s) => s.hoveredModule);
  const detailTab = useSimStore((s) => s.detailTab);
  const setDetailTab = useSimStore((s) => s.setDetailTab);
  const selectModule = useSimStore((s) => s.selectModule);
  const setHovered = useSimStore((s) => s.setHovered);

  const comps = useMemo(() => getComps(topology), [topology]);
  const ids = useMemo(() => getIds(topology), [topology]);
  const chain = useMemo(() => getChain(topology), [topology]);
  const extra = useMemo(() => getExtra(topology), [topology]);
  const accent = topology === 'igbt' ? '#3b7dd8' : '#e17055';

  // Build all connections
  const allConns = useMemo(() => {
    const chainConns = [];
    for (let i = 0; i < chain.length - 1; i++) chainConns.push([chain[i], chain[i + 1]]);
    return [...chainConns, ...extra];
  }, [chain, extra]);

  // Active component (selected > hovered)
  const activeId = selectedModule && comps[selectedModule] ? selectedModule
    : hoveredModule && comps[hoveredModule] ? hoveredModule : null;
  const active = activeId ? { id: activeId, ...comps[activeId] } : null;

  if (active) {
    return (
      <div className="detail-panel">
        {/* Header */}
        <div className="detail-header">
          <div className="detail-accent-bar" style={{
            background: active.color,
            boxShadow: `0 0 8px ${active.color}44`,
          }} />
          <div style={{ flex: 1 }}>
            <div className="detail-name">{active.name}</div>
            <div className="detail-meta">
              {active.exp && <span className="badge-exp">EXPANDABLE</span>}
              {dims[active.id] && (
                <span className="badge-dims">{dims[active.id].join('x')}mm</span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="detail-tabs">
          {['function', 'eli5', 'specs', 'connections'].map((k) => (
            <button
              key={k}
              className={`detail-tab ${detailTab === k ? 'active' : ''}`}
              onClick={() => setDetailTab(k)}
              style={detailTab === k ? {
                background: active.color + '18',
                borderColor: active.color + '44',
                color: active.color,
              } : {}}
            >
              {k === 'eli5' ? 'ELI5' : k.slice(0, 4).toUpperCase()}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {detailTab === 'function' && (
          <div className="detail-content">{active.fn}</div>
        )}

        {detailTab === 'eli5' && (
          <div className="eli5-box">
            <div className="eli5-label">// FIRST PRINCIPLES</div>
            {typeof active.eli5 === 'string' ? (
              <div className="eli5-text">{active.eli5}</div>
            ) : (
              <>
                {active.eli5.title && <div className="eli5-title">{active.eli5.title}</div>}
                {active.eli5.body && <div className="eli5-text">{active.eli5.body}</div>}
                {active.eli5.formula && <div className="eli5-formula">{active.eli5.formula}</div>}
                {active.eli5.body2 && <div className="eli5-text">{active.eli5.body2}</div>}
                {active.eli5.formula2 && <div className="eli5-formula">{active.eli5.formula2}</div>}
                {active.eli5.body3 && <div className="eli5-text">{active.eli5.body3}</div>}
                {active.eli5.law && <div className="eli5-law">{active.eli5.law}</div>}
              </>
            )}
          </div>
        )}

        {detailTab === 'specs' && (
          <div className="specs-table">
            {active.sp.split('|').map((s, i, a) => {
              const parts = s.split(':');
              return (
                <div
                  key={i}
                  className="spec-row"
                  style={i < a.length - 1 ? { borderBottom: `1px solid ${accent}0a` } : {}}
                >
                  <span className="spec-key">{parts[0].trim()}</span>
                  <span className="spec-val">{parts.slice(1).join(':').trim()}</span>
                </div>
              );
            })}
          </div>
        )}

        {detailTab === 'connections' && (
          <div>
            {allConns.filter(([a]) => a === active.id).length > 0 && (
              <div style={{ marginBottom: 5 }}>
                <div className="conn-section-label">// OUTPUT TO</div>
                {allConns.filter(([a]) => a === active.id).map(([, tid]) => {
                  const t = comps[tid];
                  if (!t) return null;
                  return (
                    <div
                      key={tid}
                      className="conn-item"
                      style={{ background: t.color + '08', border: `1px solid ${t.color}1a` }}
                      onClick={() => selectModule(tid)}
                    >
                      <div className="conn-dot" style={{ background: t.color, boxShadow: `0 0 4px ${t.color}44` }} />
                      <span className="conn-arrow">{'\u2192'}</span>
                      <span className="conn-name">{t.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {allConns.filter(([, b]) => b === active.id).length > 0 && (
              <div>
                <div className="conn-section-label">// INPUT FROM</div>
                {allConns.filter(([, b]) => b === active.id).map(([fid]) => {
                  const f = comps[fid];
                  if (!f) return null;
                  return (
                    <div
                      key={fid}
                      className="conn-item"
                      style={{ background: f.color + '08', border: `1px solid ${f.color}14` }}
                      onClick={() => selectModule(fid)}
                    >
                      <div className="conn-dot" style={{ background: f.color, boxShadow: `0 0 4px ${f.color}44` }} />
                      <span className="conn-arrow">{'\u2190'}</span>
                      <span className="conn-name">{f.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // No active component — show index
  return (
    <div className="detail-panel">
      <div className="comp-index-label">// COMPONENT INDEX</div>
      {ids.map((id) => {
        const comp = comps[id];
        if (!comp) return null;
        const isSel = selectedModule === id;
        const isHov = hoveredModule === id;
        return (
          <div
            key={id}
            className={`comp-index-item ${isSel ? 'selected' : ''}`}
            style={{
              background: isSel ? comp.color + '14' : isHov ? 'rgba(255,255,255,0.02)' : 'transparent',
              borderLeftColor: isSel ? comp.color : 'transparent',
            }}
            onClick={() => selectModule(id)}
            onMouseEnter={() => setHovered(id)}
            onMouseLeave={() => setHovered(null)}
          >
            <div
              className="comp-index-dot"
              style={{
                background: comp.color,
                boxShadow: isSel ? `0 0 6px ${comp.color}66` : 'none',
              }}
            />
            <span
              className="comp-index-name"
              style={{
                color: isSel ? '#b8c8e0' : `${accent}66`,
                fontWeight: isSel ? 600 : 400,
              }}
            >
              {comp.name}
            </span>
            {comp.exp && <span className="comp-index-exp">EXP</span>}
            {dims[id] && <span className="comp-index-dim">{dims[id][0]}mm</span>}
          </div>
        );
      })}
    </div>
  );
}
