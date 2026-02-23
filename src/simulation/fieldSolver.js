/**
 * Finite-difference Laplace solver for electroporation field computation.
 * All functions are pure — no side effects — for use in Web Worker.
 */

export function initializeGrid(N, electrodes, voltage) {
  const phi = new Float64Array(N * N);
  const sigma = new Float64Array(N * N);
  const mask = new Uint8Array(N * N); // 0=free, 1=electrode+, 2=electrode-

  // Initialize uniform conductivity
  sigma.fill(0.2); // S/m, default liver

  // Place electrodes on the grid
  electrodes.forEach((elec) => {
    // Convert normalized position (-0.5 to 0.5) to grid coords
    const gi = Math.round((elec.x + 0.5) * (N - 1));
    const gj = Math.round((elec.z + 0.5) * (N - 1));

    // Electrode is a small cluster of cells (radius ~2 cells for 19-gauge)
    const radius = 2;
    for (let di = -radius; di <= radius; di++) {
      for (let dj = -radius; dj <= radius; dj++) {
        if (di * di + dj * dj > radius * radius) continue;
        const ii = gi + di;
        const jj = gj + dj;
        if (ii < 0 || ii >= N || jj < 0 || jj >= N) continue;
        const idx = jj * N + ii;
        mask[idx] = elec.polarity === '+' ? 1 : 2;
        phi[idx] = elec.polarity === '+' ? voltage / 2 : -voltage / 2;
      }
    }
  });

  return { phi, sigma, mask };
}

export function solveGaussSeidel(phi, sigma, mask, N, maxIter = 100, tolerance = 1e-4) {
  for (let iter = 0; iter < maxIter; iter++) {
    let maxResidual = 0;

    for (let j = 1; j < N - 1; j++) {
      for (let i = 1; i < N - 1; i++) {
        const idx = j * N + i;
        if (mask[idx] !== 0) continue;

        const sR = 0.5 * (sigma[idx] + sigma[idx + 1]);
        const sL = 0.5 * (sigma[idx] + sigma[idx - 1]);
        const sU = 0.5 * (sigma[idx] + sigma[idx - N]);
        const sD = 0.5 * (sigma[idx] + sigma[idx + N]);
        const sumS = sR + sL + sU + sD;

        if (sumS === 0) continue;

        const newPhi = (sR * phi[idx + 1] + sL * phi[idx - 1] +
                        sU * phi[idx - N] + sD * phi[idx + N]) / sumS;

        const residual = Math.abs(newPhi - phi[idx]);
        if (residual > maxResidual) maxResidual = residual;

        phi[idx] = newPhi;
      }
    }

    if (maxResidual < tolerance) break;
  }

  return phi;
}

export function computeEField(phi, N, dx) {
  const E = new Float32Array(N * N);

  for (let j = 1; j < N - 1; j++) {
    for (let i = 1; i < N - 1; i++) {
      const idx = j * N + i;
      const Ex = -(phi[idx + 1] - phi[idx - 1]) / (2 * dx);
      const Ey = -(phi[idx + N] - phi[idx - N]) / (2 * dx);
      E[idx] = Math.sqrt(Ex * Ex + Ey * Ey);
    }
  }

  return E;
}

export function updateConductivity(E, sigma, tissue, N) {
  const newSigma = new Float64Array(sigma);
  const Eth = tissue.eThreshold * 100; // V/cm -> V/m
  const k = Eth * 0.1; // sigmoid width

  for (let i = 0; i < N * N; i++) {
    const eVal = E[i];
    const sig = 1.0 / (1.0 + Math.exp(-(eVal - Eth) / k));
    newSigma[i] = tissue.baseConductivity +
      (tissue.poratedConductivity - tissue.baseConductivity) * sig;
  }

  return newSigma;
}

export function computeAblation(E, tissue, N, prevAblation) {
  const ablation = prevAblation ? new Float32Array(prevAblation) : new Float32Array(N * N);
  const Eth = tissue.eThreshold * 100; // V/cm -> V/m

  for (let i = 0; i < N * N; i++) {
    if (E[i] > Eth) {
      ablation[i] = Math.min(ablation[i] + 0.1, 1.0);
    }
  }

  return ablation;
}

export function computeThermal(E, sigma, pulseWidth, tissue, N, prevThermal) {
  const thermal = prevThermal ? new Float32Array(prevThermal) : new Float32Array(N * N);

  for (let i = 0; i < N * N; i++) {
    const deltaT = (sigma[i] * E[i] * E[i] * pulseWidth) / (tissue.density * tissue.heatCapacity);
    thermal[i] += deltaT;
  }

  return thermal;
}

export function computeImpedance(E, sigma, N, voltage, dx) {
  // Simple impedance estimate: Z = V / I, where I = integral of J*dA across midplane
  let totalCurrent = 0;
  const mid = Math.floor(N / 2);

  for (let j = 0; j < N; j++) {
    const idx = j * N + mid;
    totalCurrent += sigma[idx] * E[idx] * dx;
  }

  if (totalCurrent === 0) return 1000; // default high impedance
  return Math.abs(voltage / totalCurrent);
}
