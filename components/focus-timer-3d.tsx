"use client"

import { useEffect, useState, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Sphere, MeshDistortMaterial, Sparkles, Float, Lightformer, Environment } from "@react-three/drei"
import * as THREE from "three"

export function FocusTimer3D({ isRunning, progress, mode }: { isRunning: boolean, progress: number, mode: 'work' | 'break' }) {
    const meshRef = useRef<THREE.Mesh>(null)

    // Base colors
    const workColor = "#6366f1" // Indigo
    const breakColor = "#34d399" // Emerald
    const idleColor = "#4b5563" // Gray

    const currentColor = isRunning
        ? (mode === 'work' ? workColor : breakColor)
        : idleColor

    useFrame((state) => {
        if (meshRef.current) {
            // Pulse faster when running, slow down when paused
            const speed = isRunning ? 2 : 0.5
            // Change material distortion based on progress (more chaotic near the end)
            const distortionAmount = 0.3 + (progress * 0.4)

            // Rotate the sphere
            meshRef.current.rotation.x = state.clock.elapsedTime * 0.2
            meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
        }
    })

    return (
        <>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} color={currentColor} />
            <pointLight position={[-10, -10, -5]} intensity={0.5} color="#c084fc" />

            <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                <Sphere ref={meshRef} args={[2, 64, 64]}>
                    <MeshDistortMaterial
                        color={currentColor}
                        emissive={currentColor}
                        emissiveIntensity={isRunning ? 0.8 : 0.2}
                        envMapIntensity={1}
                        clearcoat={1}
                        clearcoatRoughness={0.1}
                        metalness={0.9}
                        roughness={0.1}
                        distort={isRunning ? 0.3 + (progress * 0.3) : 0.1}
                        speed={isRunning ? 3 : 0.5}
                    />
                </Sphere>
            </Float>

            {/* Dynamic Sparkles based on timer progress */}
            {isRunning && (
                <Sparkles
                    count={100 + (progress * 200)}
                    scale={6}
                    size={4}
                    speed={0.4}
                    color={currentColor}
                />
            )}

            {/* Dramatic lighting reflections */}
            <Environment preset="city">
                <Lightformer form="rect" intensity={2} color={currentColor} position={[0, 5, -9]} scale={[10, 10, 1]} />
                <Lightformer form="circle" intensity={2} color="white" position={[5, 0, -5]} scale={[2, 2, 1]} />
            </Environment>
        </>
    )
}
