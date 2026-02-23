import { useRef, useEffect } from 'react';
import useSimStore from '../../stores/useSimStore';

export default function WaveformPanel() {
  const canvasRef = useRef();
  const waveformHistory = useSimStore((s) => s.waveformHistory);
  const protocol = useSimStore((s) => s.protocol);
  const showWaveform = useSimStore((s) => s.showWaveform);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    // Clear
    ctx.fillStyle = 'rgba(0, 10, 20, 0.9)';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 10; i++) {
      const x = (i / 10) * W;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let i = 0; i < 5; i++) {
      const y = (i / 5) * H;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Draw waveform
    if (waveformHistory.length > 0) {
      const maxV = protocol.voltage;
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 4;
      ctx.beginPath();

      waveformHistory.forEach((pt, i) => {
        const x = (i / Math.max(waveformHistory.length - 1, 1)) * W;
        const y = H - (pt.v / maxV) * H * 0.85 - H * 0.05;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Axis labels
    ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.font = '11px "Inter", -apple-system, sans-serif';
    ctx.fillText(`${protocol.voltage}V`, 3, 12);
    ctx.fillText('0V', 3, H - 3);
    ctx.fillText('TIME →', W - 40, H - 3);
  }, [waveformHistory, protocol.voltage]);

  if (!showWaveform) return null;

  return (
    <div style={{
      position: 'absolute',
      left: 20,
      top: 70,
      background: 'rgba(0, 10, 20, 0.85)',
      border: '1px solid rgba(0, 240, 255, 0.2)',
      borderRadius: 4,
      overflow: 'hidden',
      pointerEvents: 'auto',
      zIndex: 10,
    }}>
      <div style={{
        padding: '3px 8px',
        borderBottom: '1px solid rgba(0, 240, 255, 0.1)',
        fontFamily: "'Inter', -apple-system, sans-serif",
        fontSize: '11px',
        color: '#D4A574',
        letterSpacing: '1.5px',
      }}>
        // PULSE WAVEFORM
      </div>
      <canvas
        ref={canvasRef}
        width={280}
        height={140}
        style={{ display: 'block' }}
      />
    </div>
  );
}
