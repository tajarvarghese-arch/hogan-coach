uniform vec3 uColor;
uniform float uOpacity;
uniform float uTime;
uniform float uScanSpeed;
uniform float uSelected;
uniform float uHovered;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vFresnel;

void main() {
  vec3 color = uColor;
  float alpha = uOpacity;

  // Internal grid pattern
  float gridX = step(0.97, fract(vUv.x * 16.0));
  float gridY = step(0.97, fract(vUv.y * 16.0));
  float grid = max(gridX, gridY) * 0.12;
  alpha += grid;
  color = mix(color, vec3(0.0, 0.94, 1.0), grid * 0.5);

  // Scanline sweep (thin bright band scrolling upward)
  float scanPos = fract(vWorldPosition.y * 2.0 - uTime * uScanSpeed);
  float scanline = smoothstep(0.0, 0.015, scanPos) * smoothstep(0.04, 0.015, scanPos);
  alpha += scanline * 0.25;
  color = mix(color, vec3(1.0), scanline * 0.6);

  // Fresnel edge glow
  float fresnelGlow = pow(vFresnel, 3.0) * 0.5;
  alpha += fresnelGlow;
  color = mix(color, vec3(0.0, 0.94, 1.0), fresnelGlow * 0.4);

  // Selection / hover boost
  float boost = uSelected * 0.35 + uHovered * 0.12;
  alpha += boost;

  // Subtle flicker for selected
  float flicker = 1.0 - uSelected * 0.05 * sin(uTime * 15.0);
  alpha *= flicker;

  gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.9));
}
