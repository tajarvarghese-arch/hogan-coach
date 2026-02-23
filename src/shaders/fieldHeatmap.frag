uniform sampler2D uFieldTexture;
uniform float uMaxField;
uniform float uThreshold;
uniform float uTime;

varying vec2 vUv;

vec3 fieldColorRamp(float t) {
  // Blue -> Cyan -> White ramp
  vec3 blue = vec3(0.05, 0.1, 0.4);
  vec3 cyan = vec3(0.0, 0.8, 1.0);
  vec3 white = vec3(1.0, 1.0, 1.0);

  if (t < 0.5) {
    return mix(blue, cyan, t * 2.0);
  } else {
    return mix(cyan, white, (t - 0.5) * 2.0);
  }
}

void main() {
  float fieldVal = texture2D(uFieldTexture, vUv).r;
  float normalized = clamp(fieldVal / uMaxField, 0.0, 1.0);

  vec3 color = fieldColorRamp(normalized);
  float alpha = smoothstep(0.05, 0.2, normalized) * 0.7;

  // Threshold contour line
  float threshNorm = uThreshold / uMaxField;
  float contour = smoothstep(0.0, 0.02, abs(normalized - threshNorm));
  contour = 1.0 - contour;
  color = mix(color, vec3(0.0, 1.0, 0.4), contour * 0.8);
  alpha = max(alpha, contour * 0.6);

  // Subtle pulse animation
  float pulse = sin(uTime * 2.0) * 0.05 + 1.0;
  alpha *= pulse;

  gl_FragColor = vec4(color, alpha);
}
