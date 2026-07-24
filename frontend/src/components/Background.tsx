import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function generateAmbientParticlesGeometry(count = 12000) {
  const positions = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  const randoms = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 55;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 55;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 30 - 5;

    scales[i] = Math.random();

    randoms[i * 3] = Math.random();
    randoms[i * 3 + 1] = Math.random();
    randoms[i * 3 + 2] = Math.random();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
  geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 3));

  return geometry;
}

const vertexShader = `
uniform float uTime;
uniform vec2 uMouse;
attribute float aScale;
attribute vec3 aRandom;
varying float vScale;
varying vec3 vRandom;

void main() {
  vScale = aScale;
  vRandom = aRandom;
  vec3 pos = position;

  // Fluid / cosmic-dust drift motion
  float speed = 0.15 + aRandom.x * 0.25;
  pos.x += sin(uTime * speed + aRandom.y * 6.28) * (0.8 + aRandom.z * 0.4);
  pos.y += cos(uTime * (speed * 0.85) + aRandom.x * 6.28) * (0.7 + aRandom.y * 0.4);
  pos.z += sin(uTime * 0.25 + pos.x * 0.05 + pos.y * 0.05) * 0.5;

  // Damped mouse parallax interaction
  pos.x += uMouse.x * 2.5 * (0.6 + aRandom.z * 0.8);
  pos.y += uMouse.y * 2.5 * (0.6 + aRandom.z * 0.8);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  // Size attenuation
  gl_PointSize = (9.0 * aScale + 2.5) * (12.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = `
varying float vScale;
varying vec3 vRandom;

void main() {
  vec2 uv = gl_PointCoord.xy - 0.5;

  // ASCII '+' cross for larger particles, soft dot for smaller
  float lineX = step(abs(uv.y), 0.08) * step(abs(uv.x), 0.35);
  float lineY = step(abs(uv.x), 0.08) * step(abs(uv.y), 0.35);
  float crossShape = max(lineX, lineY);

  float dist = length(uv);
  float dotShape = 1.0 - smoothstep(0.2, 0.45, dist);

  float shape = mix(dotShape, crossShape, step(0.55, vScale));

  if (shape < 0.08) discard;

  // Silver/grey atmosphere particle palette matching dragonfly reference
  vec3 baseColor = vec3(0.52, 0.55, 0.58);
  vec3 highlightColor = vec3(0.72, 0.75, 0.78);
  vec3 color = mix(baseColor, highlightColor, step(0.82, vRandom.x));

  gl_FragColor = vec4(color, shape * 0.4);
}
`;

function AmbientParticles() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Points>(null);
  const mouseTarget = useRef({ x: 0, y: 0 });
  const currentMouse = useRef({ x: 0, y: 0 });

  const geometry = useMemo(() => generateAmbientParticlesGeometry(12000), []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) }
    }),
    []
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseTarget.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseTarget.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state) => {
    // Damped lerp mouse tracking
    currentMouse.current.x += (mouseTarget.current.x - currentMouse.current.x) * 0.04;
    currentMouse.current.y += (mouseTarget.current.y - currentMouse.current.y) * 0.04;

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uMouse.value.set(
        currentMouse.current.x,
        currentMouse.current.y
      );
    }

    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.015;
    }
  });

  return (
    <points ref={meshRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        fragmentShader={fragmentShader}
        vertexShader={vertexShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function Background() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        backgroundColor: '#07090b' // Dark near-black background per spec
      }}
    >
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
        <AmbientParticles />
      </Canvas>
    </div>
  );
}
