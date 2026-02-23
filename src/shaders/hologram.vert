varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vFresnel;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;

  // Fresnel: brighter at glancing angles
  vec3 viewDir = normalize(cameraPosition - worldPos.xyz);
  vFresnel = 1.0 - abs(dot(viewDir, vNormal));

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
