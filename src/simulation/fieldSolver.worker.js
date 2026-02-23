import {
  initializeGrid,
  solveGaussSeidel,
  computeEField,
  updateConductivity,
  computeAblation,
  computeThermal,
  computeImpedance,
} from './fieldSolver.js';

let state = null;

self.onmessage = function (e) {
  const { type } = e.data;

  switch (type) {
    case 'INIT': {
      const { gridSize, electrodes, tissue, voltage } = e.data;
      const { phi, sigma, mask } = initializeGrid(gridSize, electrodes, voltage);
      state = {
        N: gridSize,
        phi,
        sigma,
        mask,
        ablation: new Float32Array(gridSize * gridSize),
        thermal: new Float32Array(gridSize * gridSize),
        tissue,
        dx: 1.0 / gridSize, // physical grid spacing in meters (normalized)
      };
      self.postMessage({ type: 'READY' });
      break;
    }

    case 'SOLVE_PULSE': {
      if (!state) return;
      const { voltage, pulseWidth, pulseIndex } = e.data;
      const { N, phi, mask, dx, tissue } = state;

      // Set electrode voltages for this pulse
      for (let i = 0; i < N * N; i++) {
        if (mask[i] === 1) phi[i] = voltage / 2;
        else if (mask[i] === 2) phi[i] = -voltage / 2;
      }

      // Initial solve
      solveGaussSeidel(phi, state.sigma, mask, N, 100, 1e-4);

      // Compute E-field
      const E = computeEField(phi, N, dx);

      // Update conductivity (poration feedback)
      state.sigma = updateConductivity(E, state.sigma, tissue, N);

      // Re-solve with updated conductivity
      solveGaussSeidel(phi, state.sigma, mask, N, 50, 1e-4);
      const E2 = computeEField(phi, N, dx);

      // Update ablation and thermal
      state.ablation = computeAblation(E2, tissue, N, state.ablation);
      state.thermal = computeThermal(E2, state.sigma, pulseWidth, tissue, N, state.thermal);

      // Compute impedance
      const impedance = computeImpedance(E2, state.sigma, N, voltage, dx);

      // Find peak temperature
      let peakTemp = 0;
      for (let i = 0; i < state.thermal.length; i++) {
        if (state.thermal[i] > peakTemp) peakTemp = state.thermal[i];
      }

      // Post results (copy arrays since we keep using them)
      self.postMessage({
        type: 'FIELD_SOLVED',
        field: new Float32Array(E2),
        conductivity: new Float32Array(state.sigma),
        ablation: new Float32Array(state.ablation),
        thermal: new Float32Array(state.thermal),
        impedance,
        peakTemp,
        pulseIndex,
      });
      break;
    }

    case 'UPDATE_ELECTRODES': {
      if (!state) return;
      const { electrodes, voltage, gridSize, tissue } = e.data;
      const { phi, sigma, mask } = initializeGrid(gridSize, electrodes, voltage);
      state.phi = phi;
      state.mask = mask;
      state.N = gridSize;
      if (tissue) state.tissue = tissue;
      self.postMessage({ type: 'READY' });
      break;
    }

    case 'RESET': {
      state = null;
      self.postMessage({ type: 'RESET_DONE' });
      break;
    }
  }
};
