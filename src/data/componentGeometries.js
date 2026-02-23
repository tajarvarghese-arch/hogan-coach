/**
 * Procedural 3D geometries for each hardware component.
 * Each function returns a merged BufferGeometry that works with the holographic shader.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const cache = new Map();

/**
 * Get (or build + cache) the procedural geometry for a component.
 * @param {string} id  Component key (e.g. 'psu', 'xfmr')
 * @param {number} w   Target width  (X)
 * @param {number} h   Target height (Y)
 * @param {number} d   Target depth  (Z)
 */
export function getComponentGeometry(id, w, h, d) {
  const key = `${id}_${w}_${h}_${d}`;
  if (cache.has(key)) return cache.get(key);

  const builder = BUILDERS[id];
  let geom;
  if (builder) {
    geom = builder(w, h, d);
  } else {
    // Fallback: plain box
    geom = new THREE.BoxGeometry(w, h, d);
  }
  cache.set(key, geom);
  return geom;
}

/* ─── Helper: translate a geometry ─── */
function translate(geom, x, y, z) {
  const g = geom.clone();
  g.translate(x, y, z);
  return g;
}

/* ─── Helper: rotate then translate ─── */
function rotateX(geom, angle) {
  const g = geom.clone();
  g.rotateX(angle);
  return g;
}

function rotateY(geom, angle) {
  const g = geom.clone();
  g.rotateY(angle);
  return g;
}

function rotateZ(geom, angle) {
  const g = geom.clone();
  g.rotateZ(angle);
  return g;
}

/* ─── Helper: safe merge (filters nulls) ─── */
function merge(geometries) {
  const valid = geometries.filter(Boolean);
  if (valid.length === 0) return new THREE.BoxGeometry(0.1, 0.1, 0.1);
  if (valid.length === 1) return valid[0];
  return mergeGeometries(valid, false);
}

/* ================================================================
   COMPONENT GEOMETRY BUILDERS
   Each receives target (w, h, d) bounding box dimensions.
   ================================================================ */

const BUILDERS = {

  // ─── AC/DC POWER SUPPLY ───
  psu(w, h, d) {
    const parts = [];
    // Main housing
    parts.push(new THREE.BoxGeometry(w, h * 0.85, d));
    // Ventilation slots on top
    for (let i = 0; i < 6; i++) {
      const slotX = (i - 2.5) * (w * 0.14);
      parts.push(translate(
        new THREE.BoxGeometry(w * 0.08, h * 0.05, d * 0.7),
        slotX, h * 0.45, 0
      ));
    }
    // IEC connector on back
    parts.push(translate(
      new THREE.BoxGeometry(w * 0.2, h * 0.2, d * 0.08),
      0, -h * 0.1, -d * 0.5
    ));
    // Fan grill (cylinder)
    parts.push(translate(
      rotateX(new THREE.CylinderGeometry(h * 0.25, h * 0.25, d * 0.04, 12), Math.PI / 2),
      w * 0.25, 0, d * 0.5
    ));
    return merge(parts);
  },

  // ─── HF INVERTER & GATE DRIVER ───
  inv(w, h, d) {
    const parts = [];
    // PCB board (flat slab)
    parts.push(new THREE.BoxGeometry(w, h * 0.15, d));
    // 4 TO-247 packages
    for (let i = 0; i < 4; i++) {
      const x = (i - 1.5) * (w * 0.2);
      parts.push(translate(
        new THREE.BoxGeometry(w * 0.1, h * 0.25, d * 0.15),
        x, h * 0.2, -d * 0.15
      ));
    }
    // Heatsink fins on back side
    for (let i = 0; i < 8; i++) {
      const x = (i - 3.5) * (w * 0.1);
      parts.push(translate(
        new THREE.BoxGeometry(w * 0.02, h * 0.6, d * 0.25),
        x, h * 0.3, d * 0.3
      ));
    }
    // Heatsink base
    parts.push(translate(
      new THREE.BoxGeometry(w * 0.85, h * 0.08, d * 0.25),
      0, h * 0.05, d * 0.3
    ));
    return merge(parts);
  },

  // ─── HV FERRITE TRANSFORMER (TOROIDAL) ───
  xfmr(w, h, d) {
    const parts = [];
    const r = Math.min(w, d) * 0.35;
    const tube = r * 0.25;
    // Main toroid core
    parts.push(rotateX(new THREE.TorusGeometry(r, tube, 12, 24), Math.PI / 2));
    // Coil winding ring (thinner, wraps around core)
    parts.push(rotateX(new THREE.TorusGeometry(r, tube * 1.4, 8, 24), Math.PI / 2));
    // Secondary winding (offset, thinner)
    parts.push(translate(
      rotateX(new THREE.TorusGeometry(r * 0.85, tube * 0.3, 6, 32), Math.PI / 2),
      0, tube * 0.5, 0
    ));
    // Mounting base plate
    parts.push(translate(
      new THREE.BoxGeometry(w * 0.8, h * 0.06, d * 0.8),
      0, -r - tube * 0.5, 0
    ));
    return merge(parts);
  },

  // ─── COCKCROFT-WALTON RECTIFIER ───
  rect(w, h, d) {
    const parts = [];
    // PCB board
    parts.push(new THREE.BoxGeometry(w, h * 0.15, d));
    // 5 stages: alternating diodes (boxes) and caps (cylinders)
    for (let i = 0; i < 5; i++) {
      const x = (i - 2) * (w * 0.18);
      // Diode package
      parts.push(translate(
        new THREE.BoxGeometry(w * 0.06, h * 0.35, d * 0.12),
        x - w * 0.04, h * 0.25, -d * 0.2
      ));
      // Capacitor (cylinder)
      parts.push(translate(
        new THREE.CylinderGeometry(d * 0.08, d * 0.08, h * 0.5, 8),
        x + w * 0.04, h * 0.3, d * 0.15
      ));
    }
    // Bleeder resistor row
    for (let i = 0; i < 5; i++) {
      const x = (i - 2) * (w * 0.18);
      parts.push(translate(
        rotateZ(new THREE.CylinderGeometry(d * 0.02, d * 0.02, w * 0.1, 6), Math.PI / 2),
        x, h * 0.15, d * 0.35
      ));
    }
    return merge(parts);
  },

  // ─── HV CAPACITOR BANK (WIMA FKP1 RED BOXES) ───
  caps(w, h, d) {
    const parts = [];
    // Mounting tray
    parts.push(translate(
      new THREE.BoxGeometry(w, h * 0.04, d),
      0, -h * 0.48, 0
    ));
    // 3x4 grid of rectangular film capacitors
    const rows = 3, cols = 4;
    const capW = w * 0.2, capH = h * 0.8, capD = d * 0.2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c - (cols - 1) / 2) * (w * 0.23);
        const z = (r - (rows - 1) / 2) * (d * 0.3);
        parts.push(translate(
          new THREE.BoxGeometry(capW, capH, capD),
          x, 0, z
        ));
      }
    }
    // Bus bar connections on top
    parts.push(translate(
      new THREE.BoxGeometry(w * 0.85, h * 0.03, d * 0.05),
      0, h * 0.42, -d * 0.35
    ));
    parts.push(translate(
      new THREE.BoxGeometry(w * 0.85, h * 0.03, d * 0.05),
      0, h * 0.42, d * 0.35
    ));
    return merge(parts);
  },

  // ─── SERIES-STACKED SiC SWITCHES ───
  sw(w, h, d) {
    const parts = [];
    // Copper baseplate
    parts.push(translate(
      new THREE.BoxGeometry(w, h * 0.06, d),
      0, -h * 0.47, 0
    ));
    // 6 switch modules (XM3 packages)
    for (let i = 0; i < 6; i++) {
      const x = (i - 2.5) * (w * 0.15);
      parts.push(translate(
        new THREE.BoxGeometry(w * 0.1, h * 0.65, d * 0.5),
        x, -h * 0.05, 0
      ));
      // Trigger cylinder (fiber optic) on top
      parts.push(translate(
        new THREE.CylinderGeometry(w * 0.015, w * 0.015, h * 0.15, 6),
        x, h * 0.35, d * 0.15
      ));
    }
    // Water cooling channels (thin cylinders beneath baseplate)
    parts.push(translate(
      rotateZ(new THREE.CylinderGeometry(h * 0.03, h * 0.03, w * 0.9, 8), Math.PI / 2),
      0, -h * 0.48, -d * 0.25
    ));
    parts.push(translate(
      rotateZ(new THREE.CylinderGeometry(h * 0.03, h * 0.03, w * 0.9, 8), Math.PI / 2),
      0, -h * 0.48, d * 0.25
    ));
    return merge(parts);
  },

  // ─── PULSE FORMING NETWORK ───
  pfn(w, h, d) {
    const parts = [];
    // Base rail
    parts.push(translate(
      new THREE.BoxGeometry(w, h * 0.08, d * 0.3),
      0, -h * 0.46, 0
    ));
    // 5 LC stages
    for (let i = 0; i < 5; i++) {
      const x = (i - 2) * (w * 0.18);
      // Inductor (toroid)
      parts.push(translate(
        rotateX(new THREE.TorusGeometry(d * 0.15, d * 0.05, 8, 12), Math.PI / 2),
        x, h * 0.15, -d * 0.15
      ));
      // Capacitor (box)
      parts.push(translate(
        new THREE.BoxGeometry(w * 0.08, h * 0.55, d * 0.2),
        x, -h * 0.05, d * 0.2
      ));
    }
    // Connecting bus bar
    parts.push(translate(
      new THREE.BoxGeometry(w * 0.85, h * 0.03, d * 0.04),
      0, h * 0.3, -d * 0.15
    ));
    return merge(parts);
  },

  // ─── MCU + FPGA CONTROL BOARD ───
  mcu(w, h, d) {
    const parts = [];
    // Green PCB slab
    parts.push(new THREE.BoxGeometry(w, h * 0.12, d));
    // Central QFP/BGA chip
    parts.push(translate(
      new THREE.BoxGeometry(w * 0.18, h * 0.15, d * 0.18),
      0, h * 0.14, 0
    ));
    // FPGA chip (second IC)
    parts.push(translate(
      new THREE.BoxGeometry(w * 0.14, h * 0.12, d * 0.14),
      -w * 0.25, h * 0.12, 0
    ));
    // SMD components (small bumps)
    for (let i = 0; i < 8; i++) {
      const x = (i - 3.5) * (w * 0.08);
      parts.push(translate(
        new THREE.BoxGeometry(w * 0.04, h * 0.08, d * 0.03),
        x, h * 0.1, -d * 0.3
      ));
    }
    // Pin header rows on edges
    for (let i = 0; i < 12; i++) {
      parts.push(translate(
        new THREE.BoxGeometry(w * 0.015, h * 0.35, d * 0.015),
        (i - 5.5) * (w * 0.07), -h * 0.15, d * 0.45
      ));
    }
    // Crystal oscillator
    parts.push(translate(
      new THREE.CylinderGeometry(d * 0.03, d * 0.03, h * 0.1, 6),
      w * 0.3, h * 0.1, -d * 0.15
    ));
    return merge(parts);
  },

  // ─── HV OUTPUT & ELECTRODES ───
  output(w, h, d) {
    const parts = [];
    // Panel face
    parts.push(new THREE.BoxGeometry(w, h, d * 0.15));
    // 6 Lemo HV connectors (2 rows of 3 torus rings)
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        const x = (c - 1) * (w * 0.28);
        const y = (r - 0.5) * (h * 0.35);
        parts.push(translate(
          rotateX(new THREE.TorusGeometry(w * 0.08, w * 0.025, 8, 12), Math.PI / 2),
          x, y, d * 0.1
        ));
        // Connector pin (cylinder)
        parts.push(translate(
          rotateX(new THREE.CylinderGeometry(w * 0.02, w * 0.02, d * 0.2, 6), Math.PI / 2),
          x, y, d * 0.15
        ));
      }
    }
    // Status LED
    parts.push(translate(
      new THREE.SphereGeometry(w * 0.04, 8, 8),
      w * 0.35, h * 0.35, d * 0.1
    ));
    return merge(parts);
  },

  // ─── 7-INCH TOUCHSCREEN ───
  ui(w, h, d) {
    const parts = [];
    // Outer bezel frame
    parts.push(new THREE.BoxGeometry(w, h, d * 0.3));
    // Display recess (slightly inset on front face)
    parts.push(translate(
      new THREE.BoxGeometry(w * 0.85, h * 0.02, d * 0.65),
      0, h * 0.02, d * 0.05
    ));
    // Screen surface (thin bright panel)
    parts.push(translate(
      new THREE.BoxGeometry(w * 0.8, h * 0.01, d * 0.6),
      0, h * 0.04, d * 0.05
    ));
    // Ribbon cable connector on back
    parts.push(translate(
      new THREE.BoxGeometry(w * 0.25, h * 0.3, d * 0.06),
      0, -h * 0.2, -d * 0.18
    ));
    // Button row below screen
    for (let i = 0; i < 3; i++) {
      parts.push(translate(
        new THREE.CylinderGeometry(w * 0.02, w * 0.02, h * 0.03, 8),
        (i - 1) * (w * 0.12), -h * 0.01, d * 0.4
      ));
    }
    return merge(parts);
  },

  // ─── SAFETY INTERLOCK & E-STOP ───
  safety(w, h, d) {
    const parts = [];
    // Red panel box
    parts.push(new THREE.BoxGeometry(w, h * 0.6, d * 0.15));
    // Mushroom E-stop button (hemisphere + cylinder)
    parts.push(translate(
      new THREE.SphereGeometry(w * 0.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      0, h * 0.15, d * 0.15
    ));
    parts.push(translate(
      new THREE.CylinderGeometry(w * 0.15, w * 0.18, h * 0.12, 12),
      0, h * 0.05, d * 0.15
    ));
    // Yellow safety ring (torus around button)
    parts.push(translate(
      rotateX(new THREE.TorusGeometry(w * 0.22, w * 0.03, 8, 16), Math.PI / 2),
      0, h * 0.03, d * 0.15
    ));
    // Keyswitch cylinder
    parts.push(translate(
      new THREE.CylinderGeometry(w * 0.05, w * 0.05, h * 0.1, 8),
      w * 0.3, 0, d * 0.15
    ));
    // Footswitch connector
    parts.push(translate(
      rotateX(new THREE.CylinderGeometry(w * 0.04, w * 0.04, d * 0.1, 8), Math.PI / 2),
      -w * 0.3, -h * 0.15, d * 0.08
    ));
    // GFI module
    parts.push(translate(
      new THREE.BoxGeometry(w * 0.2, h * 0.15, d * 0.1),
      0, -h * 0.25, -d * 0.05
    ));
    return merge(parts);
  },

  // ─── LIQUID COOLING SYSTEM ───
  cooling(w, h, d) {
    const parts = [];
    // Radiator fin array (12 parallel fins)
    const finCount = 12;
    for (let i = 0; i < finCount; i++) {
      const x = (i - (finCount - 1) / 2) * (w * 0.055);
      parts.push(translate(
        new THREE.BoxGeometry(w * 0.012, h * 0.85, d * 0.6),
        x, 0, -d * 0.15
      ));
    }
    // Radiator frame
    parts.push(translate(
      new THREE.BoxGeometry(w * 0.7, h * 0.04, d * 0.6),
      0, h * 0.45, -d * 0.15
    ));
    parts.push(translate(
      new THREE.BoxGeometry(w * 0.7, h * 0.04, d * 0.6),
      0, -h * 0.45, -d * 0.15
    ));
    // 2 fans (torus shroud + cylinder hub)
    for (let f = 0; f < 2; f++) {
      const fz = d * 0.3;
      const fx = (f - 0.5) * (w * 0.35);
      // Fan shroud
      parts.push(translate(
        rotateX(new THREE.TorusGeometry(h * 0.25, h * 0.03, 8, 16), Math.PI / 2),
        fx, 0, fz
      ));
      // Fan hub
      parts.push(translate(
        rotateX(new THREE.CylinderGeometry(h * 0.06, h * 0.06, d * 0.06, 8), Math.PI / 2),
        fx, 0, fz
      ));
      // Fan blades (4 thin boxes rotated)
      for (let b = 0; b < 4; b++) {
        const angle = (b / 4) * Math.PI;
        const bx = Math.cos(angle) * h * 0.13;
        const by = Math.sin(angle) * h * 0.13;
        parts.push(translate(
          new THREE.BoxGeometry(h * 0.22, h * 0.06, d * 0.01),
          fx + bx * 0.3, by, fz
        ));
      }
    }
    // Pump cylinder
    parts.push(translate(
      new THREE.CylinderGeometry(d * 0.08, d * 0.08, h * 0.25, 8),
      w * 0.4, -h * 0.15, 0
    ));
    // Hose connectors
    parts.push(translate(
      rotateZ(new THREE.CylinderGeometry(d * 0.03, d * 0.03, w * 0.12, 6), Math.PI / 2),
      w * 0.42, h * 0.1, d * 0.2
    ));
    return merge(parts);
  },

  // ─── INDUCTIVE ADDER STACK ───
  stack(w, h, d) {
    const parts = [];
    const stackCount = 10;
    const r = Math.min(w, d) * 0.32;
    const tube = r * 0.18;
    // Central copper rod
    parts.push(new THREE.CylinderGeometry(r * 0.12, r * 0.12, h * 0.95, 10));
    // 10 toroid modules stacked vertically
    for (let i = 0; i < stackCount; i++) {
      const y = (i - (stackCount - 1) / 2) * (h * 0.085);
      parts.push(translate(
        rotateX(new THREE.TorusGeometry(r, tube, 8, 20), Math.PI / 2),
        0, y, 0
      ));
    }
    // Top and bottom end caps
    parts.push(translate(
      new THREE.CylinderGeometry(r * 0.4, r * 0.3, h * 0.04, 12),
      0, h * 0.48, 0
    ));
    parts.push(translate(
      new THREE.CylinderGeometry(r * 0.3, r * 0.4, h * 0.04, 12),
      0, -h * 0.48, 0
    ));
    return merge(parts);
  },

  // ─── GaN DRIVE BOARDS ───
  drv(w, h, d) {
    const parts = [];
    // Small flat PCB
    parts.push(new THREE.BoxGeometry(w, h * 0.12, d));
    // 4 GaN BGA packages (tiny flat squares)
    for (let i = 0; i < 4; i++) {
      const x = (i - 1.5) * (w * 0.2);
      parts.push(translate(
        new THREE.BoxGeometry(w * 0.08, h * 0.1, d * 0.08),
        x, h * 0.11, -d * 0.1
      ));
    }
    // Gate driver ICs
    parts.push(translate(
      new THREE.BoxGeometry(w * 0.12, h * 0.08, d * 0.08),
      -w * 0.15, h * 0.1, d * 0.2
    ));
    parts.push(translate(
      new THREE.BoxGeometry(w * 0.12, h * 0.08, d * 0.08),
      w * 0.15, h * 0.1, d * 0.2
    ));
    // Connector strip
    for (let i = 0; i < 6; i++) {
      parts.push(translate(
        new THREE.BoxGeometry(w * 0.015, h * 0.3, d * 0.015),
        (i - 2.5) * (w * 0.08), -h * 0.12, d * 0.42
      ));
    }
    return merge(parts);
  },

  // ─── MODULE CAPACITOR ARRAY ───
  lcap(w, h, d) {
    const parts = [];
    // PCB strip
    parts.push(translate(
      new THREE.BoxGeometry(w, h * 0.1, d),
      0, -h * 0.35, 0
    ));
    // 10 small cylindrical capacitors in a row
    for (let i = 0; i < 10; i++) {
      const x = (i - 4.5) * (w * 0.09);
      parts.push(translate(
        new THREE.CylinderGeometry(d * 0.1, d * 0.1, h * 0.6, 8),
        x, h * 0.05, 0
      ));
    }
    // Bus bar on top
    parts.push(translate(
      new THREE.BoxGeometry(w * 0.9, h * 0.04, d * 0.06),
      0, h * 0.38, 0
    ));
    return merge(parts);
  },

  // ─── METGLAS TOROIDAL CORES ───
  core(w, h, d) {
    const parts = [];
    const r = Math.min(h, d) * 0.28;
    const tube = r * 0.3;
    // 3 toroids side by side
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * (w * 0.3);
      parts.push(translate(
        rotateX(new THREE.TorusGeometry(r, tube, 10, 20), Math.PI / 2),
        x, 0, 0
      ));
    }
    // Mounting rail
    parts.push(translate(
      new THREE.BoxGeometry(w * 0.9, h * 0.06, d * 0.15),
      0, -r - tube * 0.7, 0
    ));
    // Epoxy coating rings (slightly larger, thinner toroids)
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * (w * 0.3);
      parts.push(translate(
        rotateX(new THREE.TorusGeometry(r * 1.05, tube * 0.15, 6, 20), Math.PI / 2),
        x, 0, 0
      ));
    }
    return merge(parts);
  },

  // ─── SERIES SECONDARY BUS ───
  sbus(w, h, d) {
    const parts = [];
    const outerR = Math.min(h, d) * 0.3;
    const innerR = outerR * 0.4;
    // Inner conductor (copper rod)
    parts.push(
      rotateZ(new THREE.CylinderGeometry(innerR, innerR, w * 0.85, 10), Math.PI / 2)
    );
    // Outer PTFE insulator
    parts.push(
      rotateZ(new THREE.CylinderGeometry(outerR, outerR, w * 0.8, 12), Math.PI / 2)
    );
    // Brass end connectors (wider cylinders at each end)
    parts.push(translate(
      rotateZ(new THREE.CylinderGeometry(outerR * 1.3, outerR * 1.3, w * 0.06, 12), Math.PI / 2),
      -w * 0.43, 0, 0
    ));
    parts.push(translate(
      rotateZ(new THREE.CylinderGeometry(outerR * 1.3, outerR * 1.3, w * 0.06, 12), Math.PI / 2),
      w * 0.43, 0, 0
    ));
    // Mounting clamps
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * (w * 0.3);
      parts.push(translate(
        rotateX(new THREE.TorusGeometry(outerR * 1.1, outerR * 0.1, 6, 12), Math.PI / 2),
        x, 0, 0
      ));
    }
    return merge(parts);
  },
};
