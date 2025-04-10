"use client"

import { useRef, useState, useEffect, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Text, Float } from "@react-three/drei"
import type { TaskStats } from "@/lib/types"

// Simplified color function
function getCategoryColor(category: string): string {
  const colors = {
    Work: "#4f46e5",
    Personal: "#0ea5e9",
    Health: "#10b981",
    Learning: "#f59e0b",
  }
  return colors[category] || "#6b7280"
}

// Simplified task card component
function TaskCard({ category, completed, total, position, color }) {
  const completionPercentage = Math.round((completed / total) * 100) || 0

  return (
    <group position={position}>
      {/* Simple card background */}
      <mesh>
        <boxGeometry args={[2.5, 1.2, 0.1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Category title */}
      <Text position={[0, 0.3, 0.06]} fontSize={0.3} color={color} anchorX="center" anchorY="middle">
        {category}
      </Text>

      {/* Completion text */}
      <Text position={[0, 0, 0.06]} fontSize={0.25} color="#333333" anchorX="center" anchorY="middle">
        {`${completed}/${total} (${completionPercentage}%)`}
      </Text>

      {/* Progress bar background */}
      <mesh position={[0, -0.3, 0.06]} scale={[2, 0.15, 0.01]}>
        <boxGeometry />
        <meshStandardMaterial color="#e5e7eb" />
      </mesh>

      {/* Progress bar fill */}
      <mesh position={[-1 + completionPercentage / 100, -0.3, 0.07]} scale={[completionPercentage / 50, 0.15, 0.01]}>
        <boxGeometry />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}

// Simplified completion indicator
function CompletionIndicator({ percentage }) {
  const groupRef = useRef()

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005
    }
  })

  return (
    <group ref={groupRef}>
      {/* Central sphere */}
      <mesh>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#8b5cf6" />
      </mesh>

      {/* Percentage text */}
      <Text position={[0, 0, 1.1]} fontSize={0.5} color="white" anchorX="center" anchorY="middle">
        {`${percentage}%`}
      </Text>
    </group>
  )
}

// Main dashboard component
function TaskDashboard({ stats }) {
  const completionPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  // Memoize category cards to prevent unnecessary re-renders
  const categoryCards = useMemo(() => {
    return Object.entries(stats.categories).map(([category, data], index) => {
      const angle = (index / Object.keys(stats.categories).length) * Math.PI * 2
      const radius = 4 // Reduced radius for better performance
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius

      return (
        <TaskCard
          key={category}
          category={category}
          completed={data.completed}
          total={data.total}
          position={[x, 0, z]}
          color={getCategoryColor(category)}
        />
      )
    })
  }, [stats.categories])

  return (
    <group>
      {/* Simple platform */}
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[5, 5, 0.2, 16]} />
        <meshStandardMaterial color="#f3f4f6" />
      </mesh>

      {/* Completion indicator */}
      <Float floatIntensity={0.2} speed={1.5} rotationIntensity={0.1}>
        <CompletionIndicator percentage={completionPercentage} />
      </Float>

      {/* Category cards */}
      {categoryCards}
    </group>
  )
}

// Default demo data
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
    // Shorter loading time
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  // Memoize the Canvas component to prevent unnecessary re-renders
  const visualization = useMemo(
    () => (
      <Canvas
        dpr={[1, 2]} // Limit pixel ratio for better performance
        camera={{ position: [0, 2, 8], fov: 45 }}
        gl={{ antialias: false }} // Disable antialiasing for performance
        frameloop="demand" // Only render when needed
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <TaskDashboard stats={stats} />
        <OrbitControls
          enablePan={false}
          minDistance={6}
          maxDistance={15}
          enableDamping={false} // Disable damping for performance
        />
      </Canvas>
    ),
    [stats],
  )

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {visualization}
      <div className="absolute bottom-2 left-2 bg-white/80 p-2 rounded text-xs">
        <p className="font-medium">
          Tasks: {stats.completed}/{stats.total} completed
        </p>
      </div>
    </div>
  )
}
