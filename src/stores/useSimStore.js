import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { PRESETS } from '../data/tissuePresets';

const useSimStore = create(subscribeWithSelector((set) => ({
  // ---- Topology ----
  topology: 'igbt',
  setTopology: (t) => set({ topology: t, selectedModule: null, hoveredModule: null, expandedModules: new Set(), detailTab: 'function' }),

  // ---- Hardware selection ----
  selectedModule: null,
  hoveredModule: null,
  expandedModules: new Set(),
  selectModule: (id) => set((s) => ({
    selectedModule: s.selectedModule === id ? null : id,
  })),
  toggleExpand: (id) => set((s) => {
    const next = new Set(s.expandedModules);
    next.has(id) ? next.delete(id) : next.add(id);
    return { expandedModules: next };
  }),
  setHovered: (id) => set({ hoveredModule: id }),

  // ---- Detail panel tab ----
  detailTab: 'function',
  setDetailTab: (t) => set({ detailTab: t }),

  // ---- View mode ----
  viewMode: 'detail',
  showHardware: true,
  showSimulation: true,
  showWaveform: true,
  showFieldLines: true,
  showEField: true,
  showTemperature: false,
  showCellInset: false,
  showTraces: true,
  showEnergyFlow: true,
  toggleVisibility: (key) => set((s) => ({ [key]: !s[key] })),

  // ---- Pulse protocol ----
  protocol: {
    voltage: 1500,
    pulseWidth: 70e-6,
    numPulses: 90,
    frequency: 1,
    electrodeSpacing: 15e-3,
    numElectrodePairs: 1,
    preset: 'liver',
  },
  setProtocol: (patch) => set((s) => ({ protocol: { ...s.protocol, ...patch } })),
  loadPreset: (presetName) => set((s) => {
    const p = PRESETS[presetName];
    if (!p) return {};
    return {
      protocol: {
        ...s.protocol,
        voltage: p.voltage,
        pulseWidth: p.pulseWidth,
        numPulses: p.numPulses,
        electrodeSpacing: p.electrodeSpacing,
        numElectrodePairs: p.numElectrodePairs,
        preset: presetName,
      },
      tissue: {
        ...s.tissue,
        baseConductivity: p.conductivity,
        poratedConductivity: p.poratedConductivity,
        eThreshold: p.eThreshold,
        density: p.density,
        heatCapacity: p.heatCapacity,
      },
    };
  }),

  // ---- Simulation state ----
  simStatus: 'idle',
  currentPulse: 0,
  startSim: () => set({ simStatus: 'running', currentPulse: 0 }),
  pauseSim: () => set({ simStatus: 'paused' }),
  resumeSim: () => set({ simStatus: 'running' }),
  resetSim: () => set({
    simStatus: 'idle',
    currentPulse: 0,
    fieldData: null,
    conductivityData: null,
    ablationData: null,
    thermalData: null,
    waveformHistory: [],
    totalEnergy: 0,
    currentImpedance: null,
    peakTemperature: 0,
  }),
  advancePulse: () => set((s) => ({ currentPulse: s.currentPulse + 1 })),

  // ---- Simulation results (from Worker) ----
  fieldData: null,
  conductivityData: null,
  ablationData: null,
  thermalData: null,
  gridSize: 100,
  waveformHistory: [],
  totalEnergy: 0,
  currentImpedance: null,
  peakTemperature: 0,
  updateFieldResults: (payload) => set({
    fieldData: payload.field,
    conductivityData: payload.conductivity,
    ablationData: payload.ablation,
    thermalData: payload.thermal,
    currentImpedance: payload.impedance,
    peakTemperature: payload.peakTemp,
  }),

  // ---- Tissue parameters ----
  tissue: {
    baseConductivity: 0.2,
    poratedConductivity: 0.8,
    eThreshold: 500,
    cellRadius: 10e-6,
    porThreshold: 1.0,
    density: 1060,
    heatCapacity: 3600,
  },
  setTissue: (patch) => set((s) => ({ tissue: { ...s.tissue, ...patch } })),

  // ---- Camera target ----
  cameraTarget: null,
  setCameraTarget: (t) => set({ cameraTarget: t }),

  // ---- Tooltip ----
  tooltip: null,
  showTooltip: (data) => set({ tooltip: data }),
  hideTooltip: () => set({ tooltip: null }),
})));

export default useSimStore;
