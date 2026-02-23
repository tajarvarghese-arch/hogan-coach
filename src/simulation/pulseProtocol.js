import useSimStore from '../stores/useSimStore';

let worker = null;
let pulseTimer = null;

export function initWorker() {
  if (worker) worker.terminate();

  worker = new Worker(
    new URL('./fieldSolver.worker.js', import.meta.url),
    { type: 'module' }
  );

  worker.onmessage = handleWorkerMessage;
  return worker;
}

export function terminateWorker() {
  if (pulseTimer) clearTimeout(pulseTimer);
  if (worker) worker.terminate();
  worker = null;
}

function handleWorkerMessage(e) {
  const { type } = e.data;
  const store = useSimStore.getState();

  switch (type) {
    case 'READY':
      // Worker initialized, start first pulse if running
      if (store.simStatus === 'running') {
        firePulse(0);
      }
      break;

    case 'FIELD_SOLVED': {
      const { field, conductivity, ablation, thermal, impedance, peakTemp, pulseIndex } = e.data;

      // Update store with results
      store.updateFieldResults({ field, conductivity, ablation, thermal, impedance, peakTemp });

      // Add to waveform history
      const protocol = store.protocol;
      const newHistory = [...store.waveformHistory];
      // Add pulse spike
      newHistory.push({ t: pulseIndex, v: 0 });
      newHistory.push({ t: pulseIndex + 0.01, v: protocol.voltage });
      newHistory.push({ t: pulseIndex + 0.02, v: protocol.voltage });
      newHistory.push({ t: pulseIndex + 0.03, v: 0 });

      // Calculate energy for this pulse: E = V^2 / Z * pulseWidth
      const pulseEnergy = impedance > 0
        ? (protocol.voltage * protocol.voltage / impedance) * protocol.pulseWidth
        : 0;

      useSimStore.setState({
        waveformHistory: newHistory,
        totalEnergy: store.totalEnergy + pulseEnergy,
      });

      store.advancePulse();

      // Schedule next pulse
      const nextPulse = store.currentPulse + 1;
      if (nextPulse < protocol.numPulses && store.simStatus === 'running') {
        const delay = Math.max(50, (1000 / protocol.frequency) - 50); // ms between pulses
        pulseTimer = setTimeout(() => {
          if (useSimStore.getState().simStatus === 'running') {
            firePulse(nextPulse);
          }
        }, delay);
      } else if (nextPulse >= protocol.numPulses) {
        useSimStore.setState({ simStatus: 'complete' });
      }
      break;
    }
  }
}

function firePulse(pulseIndex) {
  if (!worker) return;
  const { protocol } = useSimStore.getState();

  worker.postMessage({
    type: 'SOLVE_PULSE',
    voltage: protocol.voltage,
    pulseWidth: protocol.pulseWidth,
    pulseIndex,
  });
}

export function startSimulation() {
  const store = useSimStore.getState();
  const { protocol, tissue, gridSize } = store;

  // Build electrode positions (normalized -0.5 to 0.5)
  const spacing = protocol.electrodeSpacing * 100; // to scene scale
  const normalizedSpacing = spacing / 5; // tissue is 5 units wide
  const electrodes = [];

  for (let p = 0; p < protocol.numElectrodePairs; p++) {
    const offset = (p - (protocol.numElectrodePairs - 1) / 2) * normalizedSpacing * 1.5;
    electrodes.push({ x: offset - normalizedSpacing / 2, z: 0, polarity: '+' });
    electrodes.push({ x: offset + normalizedSpacing / 2, z: 0, polarity: '-' });
  }

  initWorker();

  worker.postMessage({
    type: 'INIT',
    gridSize,
    electrodes,
    tissue,
    voltage: protocol.voltage,
  });
}

export function resetSimulation() {
  if (pulseTimer) clearTimeout(pulseTimer);
  if (worker) {
    worker.terminate();
    worker = null;
  }
}

// Subscribe to simulation state changes
useSimStore.subscribe(
  (state) => state.simStatus,
  (status) => {
    if (status === 'running' && !worker) {
      startSimulation();
    } else if (status === 'running' && worker) {
      // Resume: fire next pulse
      const { currentPulse } = useSimStore.getState();
      firePulse(currentPulse);
    } else if (status === 'idle') {
      resetSimulation();
    }
  }
);
