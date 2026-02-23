import { Canvas } from '@react-three/fiber';
import Scene from './components/Scene';
import TopBar from './components/hud/TopBar';
import DetailPanel from './components/hud/DetailPanel';
import ProtocolPanel from './components/hud/ProtocolPanel';
import WaveformPanel from './components/hud/WaveformPanel';
import DataReadouts from './components/hud/DataReadouts';
import ECGTrace from './components/hud/ECGTrace';
import CellInset from './components/simulation/CellInset';
import useSimStore from './stores/useSimStore';
import './styles/hud.css';

// Initialize simulation protocol module (side-effect: subscribes to store)
import './simulation/pulseProtocol';

export default function App() {
  const handleMiss = () => {
    const { selectedModule } = useSimStore.getState();
    if (selectedModule) {
      useSimStore.getState().selectModule(selectedModule);
    }
  };

  return (
    <div style={{ width: '100%', height: '100vh', background: '#0a0a0f', overflow: 'hidden' }}>
      {/* Full-screen 3D canvas */}
      <Canvas
        camera={{ position: [8, 6, 8], fov: 50 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        style={{ position: 'absolute', inset: 0 }}
        onPointerMissed={handleMiss}
      >
        <Scene />
      </Canvas>

      {/* HTML overlay layer */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
        <TopBar />
        <DetailPanel />
        <ProtocolPanel />
        <WaveformPanel />
        <DataReadouts />
        <ECGTrace />
        <CellInset />
      </div>
    </div>
  );
}
