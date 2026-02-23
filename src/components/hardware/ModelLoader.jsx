/**
 * GLB model override hook.
 * If a .glb file exists at /models/{id}.glb, it loads and returns the merged geometry.
 * Otherwise, falls back to the procedural geometry from componentGeometries.js.
 *
 * Usage: const geometry = useComponentGeometry(id, w, h, d);
 */
import { useMemo, useState, useEffect } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { getComponentGeometry } from '../../data/componentGeometries';

// Track which model IDs we've already tried (and failed) to load
const failedModels = new Set();

/**
 * Try to fetch a GLB model; return merged geometry scaled to bounding box.
 * Returns null if file doesn't exist.
 */
export function useGLBGeometry(id, w, h, d) {
  const [geometry, setGeometry] = useState(null);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (failedModels.has(id)) {
      setTried(true);
      return;
    }

    const loader = new GLTFLoader();
    const url = `/models/${id}.glb`;

    // First check if file exists with HEAD request
    fetch(url, { method: 'HEAD' })
      .then((res) => {
        if (!res.ok || res.headers.get('content-type')?.includes('text/html')) {
          // File doesn't exist (Vite returns HTML for 404s)
          failedModels.add(id);
          setTried(true);
          return;
        }
        // File exists, load it
        loader.load(
          url,
          (gltf) => {
            const geometries = [];
            gltf.scene.traverse((child) => {
              if (child.isMesh && child.geometry) {
                const g = child.geometry.clone();
                // Apply any transforms from the scene hierarchy
                child.updateWorldMatrix(true, false);
                g.applyMatrix4(child.matrixWorld);
                geometries.push(g);
              }
            });

            if (geometries.length > 0) {
              const merged = geometries.length === 1
                ? geometries[0]
                : mergeGeometries(geometries, false);

              // Scale to fit target bounding box
              merged.computeBoundingBox();
              const box = merged.boundingBox;
              const size = new THREE.Vector3();
              box.getSize(size);
              const center = new THREE.Vector3();
              box.getCenter(center);

              // Scale uniformly to fit
              const scaleX = size.x > 0 ? w / size.x : 1;
              const scaleY = size.y > 0 ? h / size.y : 1;
              const scaleZ = size.z > 0 ? d / size.z : 1;
              const scale = Math.min(scaleX, scaleY, scaleZ);

              merged.translate(-center.x, -center.y, -center.z);
              merged.scale(scale, scale, scale);

              setGeometry(merged);
            }
            setTried(true);
          },
          undefined,
          () => {
            failedModels.add(id);
            setTried(true);
          }
        );
      })
      .catch(() => {
        failedModels.add(id);
        setTried(true);
      });
  }, [id, w, h, d]);

  return { geometry, loading: !tried };
}

/**
 * Primary hook: returns the best available geometry for a component.
 * GLB model if available, otherwise procedural.
 */
export function useComponentGeometry(id, w, h, d) {
  const { geometry: glbGeom } = useGLBGeometry(id, w, h, d);
  const proceduralGeom = useMemo(() => getComponentGeometry(id, w, h, d), [id, w, h, d]);
  return glbGeom || proceduralGeom;
}
