"use client"

import { Canvas, useFrame } from "@react-three/fiber"
import { Float, Environment, Sparkles, OrbitControls, MeshTransmissionMaterial, Icosahedron, Sphere } from "@react-three/drei"
import dynamic from "next/dynamic"
import { useRef } from "react"
import * as THREE from "three"

// Animated task orbs orbiting a central core
function OrbitingTasks() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.1
    }
  })

  // Create 6 glowing task orbs
  return (
    <group ref={groupRef}>
      {[...Array(6)].map((_, i) => {
        const angle = (i / 6) * Math.PI * 2
        // Varying radius and height for a dynamic, chaotic orbit
        const radius = 2.5 + Math.sin(i * 2) * 0.5
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        const y = Math.sin(angle * 3 + i) * 1.5

        const colors = ['#8b5cf6', '#ec4899', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444']

        return (
          <Float key={i} speed={2 + i * 0.5} rotationIntensity={2} floatIntensity={1.5} position={[x, y, z]}>
            <Sphere args={[0.15, 32, 32]}>
              <meshStandardMaterial
                color={colors[i]}
                emissive={colors[i]}
                emissiveIntensity={2}
                toneMapped={false}
              />
            </Sphere>
            {/* Trail effect using a smaller sphere */}
            <Sphere args={[0.08, 16, 16]} position={[-0.3, 0, -0.3]}>
              <meshStandardMaterial
                color={colors[i]}
                emissive={colors[i]}
                emissiveIntensity={1}
                transparent
                opacity={0.5}
                toneMapped={false}
              />
            </Sphere>
          </Float>
        )
      })}
    </group>
  )
}

function FocusCrystal() {
  const crystalRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (crystalRef.current) {
      crystalRef.current.rotation.y = state.clock.elapsedTime * 0.1
      crystalRef.current.rotation.x = state.clock.elapsedTime * 0.15
    }
  })

  return (
    <Float speed={1.5} rotationIntensity={0.8} floatIntensity={1}>
      <Icosahedron ref={crystalRef} args={[1.5, 0]}>
        {/* Advanced Glass Shader Material */}
        <MeshTransmissionMaterial
          backside
          samples={4}
          thickness={0.8}
          chromaticAberration={0.5}
          anisotropy={0.2}
          distortion={0.3}
          distortionScale={0.2}
          temporalDistortion={0.1}
          ior={1.4}
          color="#c7d2fe"
        />
      </Icosahedron>

      {/* Internal core light glowing from inside the glass */}
      <Sphere args={[0.4, 16, 16]}>
        <meshBasicMaterial color="#ffffff" />
        <pointLight intensity={2} color="#8b5cf6" distance={5} />
      </Sphere>
    </Float>
  )
}

// Dynamically import the SceneContent to prevent SSR hydration errors
const SceneContent = dynamic(() => Promise.resolve(() => {
  return (
    <>
      <ambientLight intensity={0.4} color="#4c1d95" />
      <directionalLight position={[10, 10, 5]} intensity={2} color="#ffffff" />
      <directionalLight position={[-10, -10, -5]} intensity={1} color="#ec4899" />

      <FocusCrystal />
      <OrbitingTasks />

      {/* Background stardust (slow moving) */}
      <Sparkles count={300} scale={12} size={1} speed={0.2} opacity={0.4} color="#c7d2fe" />
      {/* Foreground energetic particles (fast moving) */}
      <Sparkles count={50} scale={8} size={2.5} speed={1.5} noise={1} opacity={0.8} color="#fbcfe8" />

      {/* Studio environment for photorealistic glass reflections */}
      <Environment preset="city" />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI / 2 + 0.2}
        minPolarAngle={Math.PI / 2 - 0.4}
      />
    </>
  )
}), { ssr: false })

export function Home3DPreview() {
  return (
    <div className="w-full h-full bg-[#030014] rounded-xl overflow-hidden relative border border-white/10 shadow-2xl">
      {/* Gradient Vignette overlay for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#030014_100%)] z-10 pointer-events-none opacity-60" />

      <Canvas camera={{ position: [0, 0, 7], fov: 45 }} gl={{ antialias: true, alpha: false }}>
        <SceneContent />
      </Canvas>

      {/* Overlay UI to make it feel integrated and premium */}
      <div className="absolute top-6 left-6 z-20 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
          <span className="text-white/80 text-xs font-medium tracking-wider uppercase">Live Dashboard</span>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-between items-end pointer-events-none">
        <div className="space-y-2 backdrop-blur-md bg-white/5 border border-white/10 p-3 rounded-lg shadow-xl">
          <p className="text-white/70 text-[10px] font-bold tracking-[0.2em] uppercase">Task Constellation</p>
          <div className="flex gap-1.5">
            <div className="h-1 w-12 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            <div className="h-1 w-4 bg-pink-500 rounded-full shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
            <div className="h-1 w-8 bg-sky-500 rounded-full shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
          </div>
        </div>
      </div>
    </div>
  )
}
