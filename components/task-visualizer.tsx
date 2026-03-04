"use client"

import { useRef, useState, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Float, Stars, Sparkles, Html, Trail } from "@react-three/drei"
import * as THREE from 'three'
import type { TaskStats } from "@/lib/types"

// Refined Category Colors matching the Next-Gen Theme
const CATEGORY_COLORS: Record<string, string> = {
  Work: "#818cf8", // Indigo
  Personal: "#22d3ee", // Cyan
  Health: "#34d399", // Emerald
  Learning: "#fbbf24", // Amber
  Uncategorized: "#f472b6" // Pink
}

const getCategoryColor = (category: string) => CATEGORY_COLORS[category] || CATEGORY_COLORS.Uncategorized

// Glowing Core representing total progress
function CentralCore({ completed, total }: { completed: number, total: number }) {
  const coreRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  const percentage = total > 0 ? (completed / total) : 0

  useFrame((state) => {
    if (coreRef.current && glowRef.current) {
      coreRef.current.rotation.y += 0.005
      coreRef.current.rotation.x += 0.002

      // Pulsing effect based on completion
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.05 + 1
      glowRef.current.scale.set(pulse, pulse, pulse)
    }
  })

  // Color transitions from red/amber (0%) to emerald (100%)
  const hue = percentage * 0.3 + 0.9 // Start at indigo/blue, move to cyan/green
  const coreColor = new THREE.Color().setHSL(hue % 1.0, 0.8, 0.6)

  return (
    <group>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[1.5, 1]} />
          <meshStandardMaterial
            color={coreColor}
            wireframe
            emissive={coreColor}
            emissiveIntensity={1}
          />
        </mesh>

        {/* Inner solid core */}
        <mesh>
          <sphereGeometry args={[1.0, 32, 32]} />
          <meshStandardMaterial
            color="#0f172a"
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>

        {/* Outer Glow */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[1.8, 32, 32]} />
          <meshBasicMaterial
            color={coreColor}
            transparent
            opacity={0.15}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        <Html center position={[0, 0, 0]} zIndexRange={[100, 0]}>
          <div className="flex flex-col items-center justify-center pointer-events-none select-none">
            <span className="text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] tracking-tighter">
              {Math.round(percentage * 100)}%
            </span>
            <span className="text-[10px] text-white/70 uppercase tracking-widest font-bold">
              Core Status
            </span>
          </div>
        </Html>
      </Float>
    </group>
  )
}

// Orbiting Category Nodes
function CategoryNode({ category, data, index, totalNodes }: { category: string, data: { completed: number, total: number }, index: number, totalNodes: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const sphereRef = useRef<THREE.Mesh>(null)
  const color = getCategoryColor(category)
  const progress = data.total > 0 ? (data.completed / data.total) : 0

  // Orbit parameters
  const radius = 5 + (index % 2 === 0 ? 1 : -0.5) // Staggered orbits
  const speed = 0.2 + (index * 0.05)
  const initialAngle = (index / totalNodes) * Math.PI * 2
  const yOffset = Math.sin(index * 13) * 2.5 // Random varying heights

  useFrame((state) => {
    if (groupRef.current) {
      // Orbiting logic
      const time = state.clock.elapsedTime
      groupRef.current.position.x = Math.cos(initialAngle + time * speed) * radius
      groupRef.current.position.z = Math.sin(initialAngle + time * speed) * radius
      groupRef.current.position.y = yOffset + Math.sin(time * speed * 1.5) * 0.5

      // Node rotation
      if (sphereRef.current) {
        sphereRef.current.rotation.y += 0.01
        sphereRef.current.rotation.x += 0.01
      }
    }
  })

  return (
    <group ref={groupRef}>
      <Trail width={0.3} color={new THREE.Color(color)} length={4} decay={1} attenuation={(t) => t * t}>
        <mesh ref={sphereRef}>
          <sphereGeometry args={[0.35, 32, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.8}
            roughness={0.2}
            metalness={0.8}
          />
          <pointLight color={color} intensity={1} distance={5} />
        </mesh>
      </Trail>

      {/* Halo indicating completion */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.6, 0.02, 16, 64, progress * Math.PI * 2]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Background ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.6, 0.01, 16, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>

      <Html position={[0, 0.8, 0]} center zIndexRange={[100, 0]}>
        <div className="glass-panel px-3 py-2 rounded-xl border border-white/20 whitespace-nowrap backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-transform hover:scale-105 select-none">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: color, color: color }} />
            <span className="text-sm font-bold text-white drop-shadow-md">{category}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-white/50 font-medium tracking-wide">PROGRESS</span>
            <span className="text-xs font-black text-white drop-shadow-lg">{data.completed}/{data.total}</span>
          </div>
          <div className="w-full h-1 bg-black/50 rounded-full mt-1.5 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress * 100}%`, backgroundColor: color }} />
          </div>
        </div>
      </Html>
    </group>
  )
}

function ConstellationNetwork({ stats }: { stats: TaskStats }) {
  const categories = Object.entries(stats.categories)

  return (
    <group>
      {/* Background Particles */}
      <Stars radius={50} depth={50} count={2500} factor={4} saturation={1} fade speed={1.5} />
      <Sparkles count={150} scale={15} size={2} speed={0.4} opacity={0.4} color="#818cf8" />
      <Sparkles count={100} scale={20} size={1} speed={0.2} opacity={0.2} color="#22d3ee" />

      {/* Central Core */}
      <CentralCore completed={stats.completed} total={stats.total} />

      {/* Orbiting Category Nodes */}
      {categories.map(([category, data], index) => (
        <CategoryNode
          key={category}
          category={category}
          data={data}
          index={index}
          totalNodes={categories.length}
        />
      ))}
    </group>
  )
}

const demoTaskStats: TaskStats = {
  completed: 8,
  total: 15,
  categories: {
    Work: { completed: 3, total: 5 },
    Personal: { completed: 2, total: 4 },
    Health: { completed: 1, total: 3 },
    Learning: { completed: 2, total: 3 },
  },
}

export function TaskVisualizer({ taskStats = demoTaskStats }: { taskStats?: TaskStats }) {
  const stats = taskStats || demoTaskStats
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
          <p className="mt-4 text-sm text-indigo-300 font-medium tracking-widest uppercase animate-pulse">Initializing 3D Engine...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-[600px] min-h-[500px] bg-transparent rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
      {/* Fallback ambient background in case 3D is slow to render */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#030014] via-indigo-950/20 to-[#030014] z-0" />

      <div className="absolute inset-0 z-10">
        <Canvas camera={{ position: [0, 5, 12], fov: 45 }}>
          <ambientLight intensity={0.2} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
          <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#818cf8" />

          <ConstellationNetwork stats={stats} />

          <OrbitControls
            enablePan={false}
            minDistance={5}
            maxDistance={25}
            autoRotate
            autoRotateSpeed={0.8}
            dampingFactor={0.05}
          />
        </Canvas>
      </div>

      {/* Floating HUD overlay */}
      <div className="absolute top-4 right-4 z-20 pointer-events-none">
        <div className="glass-panel px-4 py-3 rounded-xl border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] bg-black/40 backdrop-blur-xl">
          <p className="text-[10px] text-indigo-300 uppercase tracking-widest font-bold mb-1">Network Synchronization</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              {stats.completed}
            </span>
            <span className="text-sm font-medium text-white/50 mb-1">
              / {stats.total} Nodes Active
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
