import { Html } from '@react-three/drei';
import useSimStore from '../../stores/useSimStore';

export default function HoloTooltip() {
  const tooltip = useSimStore((s) => s.tooltip);

  if (!tooltip) return null;

  return (
    <Html
      position={tooltip.worldPos}
      center
      distanceFactor={10}
      style={{ pointerEvents: 'none' }}
    >
      <div className="holo-tooltip">
        <div className="corner tl" />
        <div className="corner tr" />
        <div className="corner bl" />
        <div className="corner br" />
        {typeof tooltip.text === 'string' ? (
          <p style={{ margin: 0 }}>{tooltip.text}</p>
        ) : (
          <>
            {tooltip.text.title && <div className="tt-title">{tooltip.text.title}</div>}
            {tooltip.text.body && <div className="tt-body">{tooltip.text.body}</div>}
            {tooltip.text.formula && <div className="tt-formula">{tooltip.text.formula}</div>}
            {tooltip.text.body2 && <div className="tt-body">{tooltip.text.body2}</div>}
            {tooltip.text.formula2 && <div className="tt-formula">{tooltip.text.formula2}</div>}
            {tooltip.text.body3 && <div className="tt-body">{tooltip.text.body3}</div>}
            {tooltip.text.law && <div className="tt-law">{tooltip.text.law}</div>}
          </>
        )}
      </div>
    </Html>
  );
}
