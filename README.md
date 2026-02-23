# 10kV Electroporation Pulse Generator — Stark Edition

Interactive 3D isometric visualization of a medical-grade IRE (Irreversible Electroporation) pulse generator with two topology options.

## Quick Start

1. Open this folder in VS Code
2. Open the terminal in VS Code (`` Ctrl+` `` or `View → Terminal`)
3. Run these two commands:

```bash
npm install
npm run dev
```

4. Your browser will automatically open to `http://localhost:3000`

## If You Don't Have Node.js Installed

Download and install Node.js first from: https://nodejs.org  
(Choose the LTS version — the big green button)

Then restart VS Code and run the commands above.

## Features

- **Two Topologies**: IGBT Marx-Bank and Inductive Adder — toggle at the top
- **Click any component** to see technical specs, connections, and ELI5 explanations
- **Chassis Layout**: 3D isometric view showing how all parts fit in a 4U medical rack
- **Holographic UI**: Stark Industries-style HUD with glow effects, scan lines, and floating callouts
- **Real-world scale**: All component dimensions sourced from manufacturer datasheets (WIMA, Wolfspeed, Metglas, EPC)

## Tech Stack

- React 18
- Pure SVG (no 3D libraries)
- Vite dev server
