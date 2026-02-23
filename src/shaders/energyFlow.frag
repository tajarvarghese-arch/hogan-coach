uniform vec3 uColor;
uniform float uTime;
uniform int uWaveformType;
uniform float uSpeed;
uniform float uEnergy;
uniform float uVoltage;  // 0-1: drives emission/brightness (higher V = brighter/more dangerous)
uniform float uActive;
uniform float uHovered;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;

// Hash for noise
float hash(float n) {
  return fract(sin(n) * 43758.5453);
}

// ═══════ WAVEFORM PATTERNS ═══════

float waveformDcFlat(float x) {
  // Steady DC with directional chevron pattern (arrows showing current flow)
  float base = 0.7;
  // Chevron: repeating V-shapes pointing in flow direction
  float chevronPhase = fract(x * 2.0);
  float chevron = 1.0 - abs(chevronPhase - 0.5) * 2.0;
  chevron = smoothstep(0.3, 0.5, chevron) * 0.3;
  // Subtle ripple
  float ripple = sin(x * 5.0) * 0.05;
  return base + chevron + ripple;
}

float waveformAcSine(float x) {
  // Smooth sine wave — clean analog signal
  float s = sin(x * 6.2832);
  return 0.5 + 0.5 * s;
}

float waveformHfSquare(float x) {
  // Sharp square wave — digital switching pattern
  // Distinct on/off bands with sharp transitions
  float phase = fract(x * 3.0);
  float square = smoothstep(0.48, 0.50, phase) - smoothstep(0.98, 1.0, phase);
  // Add edge glow at transitions
  float edge1 = exp(-abs(phase - 0.5) * 40.0) * 0.4;
  float edge2 = exp(-abs(phase - 1.0) * 40.0) * 0.4;
  return square * 0.8 + 0.1 + edge1 + edge2;
}

float waveformHvSine(float x) {
  // High-voltage sine with dangerous peak clipping glow
  float s = sin(x * 6.2832);
  float base = 0.5 + 0.5 * s;
  // Bright clipping at peaks — danger indication
  float clipHigh = smoothstep(0.88, 1.0, base) * 0.6;
  float clipLow = smoothstep(0.88, 1.0, 1.0 - base) * 0.3;
  return base + clipHigh + clipLow;
}

float waveformDcHv(float x) {
  // Intense bright constant with electrical spark flickers
  float base = 0.85;
  // Occasional bright sparks
  float sparkSeed = floor(x * 15.0);
  float spark = pow(hash(sparkSeed), 16.0) * 0.6;
  // Subtle high-frequency electrical noise
  float noise = hash(x * 100.0 + uTime * 3.0) * 0.08;
  return base + spark + noise;
}

float waveformExpCharge(float x) {
  // Slow exponential buildup — energy accumulating in capacitor
  float phase = fract(x * 0.8);
  float charge = 1.0 - exp(-phase * 3.5);
  // Add pulsing glow at full charge
  float fullGlow = smoothstep(0.85, 1.0, charge) * (0.5 + 0.3 * sin(uTime * 8.0));
  return charge * 0.8 + fullGlow;
}

float waveformRawDischarge(float x) {
  // Bright flash followed by rapid exponential decay
  float phase = fract(x * 1.5);
  float spike = exp(-phase * 6.0);
  // Initial flash is very bright (bloom-triggering)
  float flash = exp(-phase * 20.0) * 0.5;
  return spike + flash;
}

float waveformRectPulse(float x) {
  // Clean flat-topped rectangular pulse — the therapeutic waveform
  float phase = fract(x * 1.5);
  // Sharp rise and fall
  float rise = smoothstep(0.02, 0.06, phase);
  float fall = 1.0 - smoothstep(0.55, 0.59, phase);
  float rect = rise * fall;
  // Bright edges at transitions (rise/fall emphasis)
  float riseEdge = exp(-abs(phase - 0.04) * 60.0) * 0.3;
  float fallEdge = exp(-abs(phase - 0.57) * 60.0) * 0.3;
  return rect * 0.85 + 0.05 + riseEdge + fallEdge;
}

float getWaveform(int type, float x) {
  if (type == 0) return waveformDcFlat(x);
  if (type == 1) return waveformAcSine(x);
  if (type == 2) return waveformHfSquare(x);
  if (type == 3) return waveformHvSine(x);
  if (type == 4) return waveformDcHv(x);
  if (type == 5) return waveformExpCharge(x);
  if (type == 6) return waveformRawDischarge(x);
  if (type == 7) return waveformRectPulse(x);
  return 0.5;
}

void main() {
  // Scrolling waveform pattern along tube length
  float scrollX = vUv.x * 6.0 - uTime * uSpeed;
  float wave = getWaveform(uWaveformType, scrollX);

  // Cross-section profile: bright center, fading edges (tube roundness)
  float edgeDist = abs(vUv.y * 2.0 - 1.0);
  float profile = 1.0 - edgeDist;
  profile = pow(profile, 0.6);

  // Core glow — brighter at center
  float coreGlow = pow(profile, 3.0) * 0.4;

  // Combine waveform with profile
  float intensity = wave * profile;

  // Energy scales overall brightness
  float energyScale = 0.3 + uEnergy * 0.7;
  intensity *= energyScale;

  // Active/inactive fade
  float activeFade = mix(0.05, 1.0, uActive);
  intensity *= activeFade;

  // Hover brightness boost
  intensity *= 1.0 + uHovered * 0.6;

  // Color: mix base color with white for bright areas
  vec3 color = mix(uColor, vec3(1.0), coreGlow * wave);

  // Hover: shift color toward white
  color = mix(color, vec3(1.0), uHovered * 0.15);

  // Emission boost for bloom — driven by VOLTAGE (higher V = brighter glow, more dangerous feel)
  float emission = 0.6 + uVoltage * 2.0 + uHovered * 0.8;
  color *= emission;

  float alpha = clamp(intensity * 0.8, 0.0, 0.95);

  gl_FragColor = vec4(color, alpha);
}
