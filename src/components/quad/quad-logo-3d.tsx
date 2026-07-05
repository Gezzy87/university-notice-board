"use client";

import { Component, Suspense, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

/**
 * The Quad logo as a rotating 3D cube.
 *
 * A rounded cube forms the body, and each of its six faces carries the Quad
 * mark — the 2×2 rounded-square grid (indigo / teal / teal / indigo) — as
 * slightly raised, beveled tiles. The whole thing tumbles on two axes so the
 * mark reads from every angle. Everything is generated in-code and lit with a
 * plain three-point rig, so nothing is fetched over the network.
 *
 * Colours match src/components/quad-logo.tsx:
 *   top-left / bottom-right  → indigo #4F46E5
 *   top-right / bottom-left  → teal   #0E9488
 */

const CUBE = 2.2; // cube edge length — sets how far the face tiles sit from centre

const TILE = 0.78; // face-tile size
const TILE_GAP = 0.14; // gap between the 4 tiles on a face
const TILE_RADIUS = 0.18; // corner radius of each tile
const TILE_DEPTH = 0.06; // how far tiles stand off the face

const COLORS = ["#4F46E5", "#0E9488", "#0E9488", "#4F46E5"] as const;

/** A rounded rectangle, extruded into a thin rounded slab, centred on origin. */
function buildRoundedSlab(size: number, radius: number, depth: number) {
  const s = size;
  const r = radius;
  const shape = new THREE.Shape();
  const x = -s / 2;
  const y = -s / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + s - r, y);
  shape.quadraticCurveTo(x + s, y, x + s, y + r);
  shape.lineTo(x + s, y + s - r);
  shape.quadraticCurveTo(x + s, y + s, x + s - r, y + s);
  shape.lineTo(x + r, y + s);
  shape.quadraticCurveTo(x, y + s, x, y + s - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 3,
    curveSegments: 12,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}

/** The 4-tile Quad grid stamped on one cube face (local XY plane). */
function FaceGrid({
  geometry,
  materials,
}: {
  geometry: THREE.BufferGeometry;
  materials: THREE.Material[];
}) {
  const step = (TILE + TILE_GAP) / 2;
  const layout: [number, number, number][] = [
    [-step, step, 0], // top-left    indigo
    [step, step, 0], // top-right   teal
    [-step, -step, 0], // bottom-left  teal
    [step, -step, 0], // bottom-right indigo
  ];
  return (
    <>
      {layout.map((pos, i) => (
        <mesh
          key={i}
          geometry={geometry}
          material={materials[i]}
          position={pos}
          castShadow
        />
      ))}
    </>
  );
}

function QuadMark() {
  const group = useRef<THREE.Group>(null);

  const tileGeometry = useMemo(
    () => buildRoundedSlab(TILE, TILE_RADIUS, TILE_DEPTH),
    []
  );

  const tileMaterials = useMemo(
    () =>
      COLORS.map(
        (c) =>
          new THREE.MeshStandardMaterial({
            color: c,
            roughness: 0.3,
            metalness: 0.1,
          })
      ),
    []
  );

  // The six faces: each entry is the transform that lifts the flat face-grid
  // (built in the XY plane, facing +Z) onto the cube surface.
  const half = CUBE / 2 + TILE_DEPTH / 2;
  const faces = useMemo<
    { position: [number, number, number]; rotation: [number, number, number] }[]
  >(
    () => [
      { position: [0, 0, half], rotation: [0, 0, 0] }, // +Z front
      { position: [0, 0, -half], rotation: [0, Math.PI, 0] }, // -Z back
      { position: [half, 0, 0], rotation: [0, Math.PI / 2, 0] }, // +X right
      { position: [-half, 0, 0], rotation: [0, -Math.PI / 2, 0] }, // -X left
      { position: [0, half, 0], rotation: [-Math.PI / 2, 0, 0] }, // +Y top
      { position: [0, -half, 0], rotation: [Math.PI / 2, 0, 0] }, // -Y bottom
    ],
    [half]
  );

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.5;
      group.current.rotation.x += delta * 0.22;
    }
  });

  return (
    <group ref={group}>
      {faces.map((f, i) => (
        <group key={i} position={f.position} rotation={f.rotation}>
          <FaceGrid geometry={tileGeometry} materials={tileMaterials} />
        </group>
      ))}
    </group>
  );
}

/** Catches any error thrown while rendering the WebGL scene. */
class CanvasErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            background: "#F6F7FC",
            color: "#4338CA",
            fontFamily: "system-ui, sans-serif",
            fontSize: 14,
            padding: 24,
            textAlign: "center",
          }}
        >
          3D view failed to start: {this.state.error.message}
        </div>
      );
    }
    return this.props.children;
  }
}

export function QuadLogo3D({ className }: { className?: string }) {
  return (
    <div
      className={className}
      style={{ width: "100%", height: "100%", background: "#F6F7FC" }}
    >
      <CanvasErrorBoundary>
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 0, 5], fov: 42 }}
          gl={{ antialias: true }}
        >
          <color attach="background" args={["#F6F7FC"]} />

          {/* Plain three-point lighting — no environment map, no network. */}
          <ambientLight intensity={0.7} />
          <directionalLight
            position={[3, 4, 5]}
            intensity={2.4}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-4, -2, -3]} intensity={0.6} />
          <pointLight position={[0, 0, 4]} intensity={0.5} />

          <Suspense fallback={null}>
            <QuadMark />
            <ContactShadows
              position={[0, -1.7, 0]}
              opacity={0.35}
              scale={7}
              blur={2.6}
              far={4}
            />
          </Suspense>

          <OrbitControls enablePan={false} minDistance={3.5} maxDistance={9} />
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}
