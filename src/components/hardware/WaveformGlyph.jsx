import { useRef, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { WAVEFORM } from '../../data/energyFlowConfig';

const W = 100;
const H = 36;

function drawWaveform(ctx, type, offset, color) {
  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = 'rgba(13, 11, 9, 0.88)';
  ctx.fillRect(0, 0, W, H);

  // Border
  ctx.strokeStyle = color + '55';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

  // Center line
  ctx.strokeStyle = color + '18';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, H / 2);
  ctx.lineTo(W, H / 2);
  ctx.stroke();

  // Waveform trace
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();

  const waveY = 4;
  const waveH = H - 8;

  for (let px = 0; px < W; px++) {
    const x = (px / W) * 4.0 + offset;
    let y = 0.5;

    switch (type) {
      case WAVEFORM.DC_FLAT:
        y = 0.3 + 0.05 * Math.sin(x * 3.0);
        break;
      case WAVEFORM.AC_SINE:
        y = 0.5 + 0.4 * Math.sin(x * Math.PI * 2);
        break;
      case WAVEFORM.HF_SQUARE:
        y = (x % 1) < 0.5 ? 0.1 : 0.9;
        break;
      case WAVEFORM.HV_SINE:
        y = 0.5 + 0.45 * Math.sin(x * Math.PI * 2);
        break;
      case WAVEFORM.DC_HV:
        y = 0.25 + (Math.random() < 0.03 ? 0.3 : 0);
        break;
      case WAVEFORM.EXP_CHARGE: {
        const ch = 1.0 - Math.exp(-(x % 2.0) * 3.0);
        y = 0.9 - ch * 0.7;
        break;
      }
      case WAVEFORM.RAW_DISCHARGE: {
        const rd = Math.exp(-((x % 2.0)) * 5.0);
        y = 0.9 - rd * 0.7;
        break;
      }
      case WAVEFORM.RECT_PULSE: {
        const phase = x % 2.0;
        y = (phase > 0.2 && phase < 1.4) ? 0.15 : 0.85;
        break;
      }
      default:
        y = 0.5;
    }

    const screenY = waveY + y * waveH;
    if (px === 0) ctx.moveTo(px, screenY);
    else ctx.lineTo(px, screenY);
  }
  ctx.stroke();

  // Direction arrow
  ctx.fillStyle = color + 'AA';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('\u2192', W - 3, H - 1);
}

// Bar colors: voltage=warm amber, current=blue, power=red
const BAR_COLORS = { v: '#E8A84C', i: '#6A8ED4', p: '#D4605A' };

function MeterBar({ label, value, norm, color }) {
  const barW = Math.max(norm * 52, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '9px' }}>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '7px',
        color: '#7A6F63',
        width: '8px',
        textAlign: 'right',
        flexShrink: 0,
      }}>
        {label}
      </span>
      <div style={{
        width: '54px',
        height: '5px',
        background: 'rgba(255,255,255,0.04)',
        borderRadius: '2px',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <div style={{
          width: `${barW}px`,
          height: '100%',
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          borderRadius: '2px',
          boxShadow: norm > 0.7 ? `0 0 4px ${color}66` : 'none',
        }} />
      </div>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '6px',
        color: '#C4B5A5',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}>
        {value}
      </span>
    </div>
  );
}

export default function WaveformGlyph({ position, waveformType, color, label, meters }) {
  const canvasRef = useRef(null);
  const offsetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const animate = () => {
      offsetRef.current += 0.02;
      drawWaveform(ctx, waveformType, offsetRef.current, color);
      animId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animId);
  }, [waveformType, color]);

  return (
    <Html position={position} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        background: 'rgba(13, 11, 9, 0.75)',
        borderRadius: '4px',
        padding: '3px 4px 4px',
        border: `1px solid ${color}22`,
      }}>
        {/* Label */}
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '7px',
          color: color,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          fontWeight: 600,
          opacity: 0.9,
          whiteSpace: 'nowrap',
        }}>
          {label}
        </div>

        {/* Waveform canvas */}
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{
            borderRadius: '2px',
            display: 'block',
          }}
        />

        {/* V / I / P meter bars */}
        {meters && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginTop: '1px' }}>
            <MeterBar label="V" value={meters.vLabel} norm={meters.v} color={BAR_COLORS.v} />
            <MeterBar label="I" value={meters.iLabel} norm={meters.i} color={BAR_COLORS.i} />
            <MeterBar label="P" value={meters.pLabel} norm={meters.p} color={BAR_COLORS.p} />
          </div>
        )}
      </div>
    </Html>
  );
}
