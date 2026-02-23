import { useRef, useEffect } from 'react';
import useSimStore from '../../stores/useSimStore';

export default function ECGTrace() {
  const canvasRef = useRef();
  const simStatus = useSimStore((s) => s.simStatus);
  const animRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    let frame;
    const draw = () => {
      animRef.current += 0.02;
      const t = animRef.current;

      ctx.fillStyle = 'rgba(0, 10, 20, 0.15)';
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = simStatus === 'running' ? '#00ff44' : '#1a3a1a';
      ctx.lineWidth = 1.2;
      ctx.shadowColor = '#00ff44';
      ctx.shadowBlur = simStatus === 'running' ? 3 : 0;
      ctx.beginPath();

      for (let x = 0; x < W; x++) {
        const phase = (x / W) * Math.PI * 4 + t;
        const mod = phase % (Math.PI * 2);
        let y = H / 2;

        // P wave
        if (mod > 0.5 && mod < 1.2) y -= Math.sin((mod - 0.5) / 0.7 * Math.PI) * 4;
        // QRS complex
        else if (mod > 1.8 && mod < 2.0) y += (mod - 1.8) / 0.2 * 6;
        else if (mod > 2.0 && mod < 2.15) y -= 20;
        else if (mod > 2.15 && mod < 2.35) y += 8;
        // T wave
        else if (mod > 3.0 && mod < 3.8) y -= Math.sin((mod - 3.0) / 0.8 * Math.PI) * 6;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // R-wave markers when running
      if (simStatus === 'running') {
        for (let i = 0; i < 3; i++) {
          const rx = ((t * 15 + i * W / 2) % W);
          ctx.fillStyle = 'rgba(255, 170, 0, 0.5)';
          ctx.fillRect(rx - 1, 0, 2, H);
          ctx.fillStyle = 'rgba(255, 170, 0, 0.4)';
          ctx.font = '11px "Inter", -apple-system, sans-serif';
          ctx.fillText('R', rx + 3, 8);
        }
      }

      frame = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frame);
  }, [simStatus]);

  return (
    <div style={{
      position: 'absolute',
      left: 20,
      bottom: 10,
      background: 'rgba(0, 10, 20, 0.7)',
      border: '1px solid rgba(0, 255, 68, 0.15)',
      borderRadius: 3,
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 10,
    }}>
      <div style={{
        padding: '2px 6px',
        borderBottom: '1px solid rgba(0, 255, 68, 0.1)',
        fontFamily: "'Inter', -apple-system, sans-serif",
        fontSize: '11px',
        color: '#1a5a1a',
        letterSpacing: '1.5px',
      }}>
        // ECG SYNC // R-WAVE GATING
      </div>
      <canvas ref={canvasRef} width={200} height={40} style={{ display: 'block' }} />
    </div>
  );
}
