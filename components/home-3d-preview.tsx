"use client"

import { useEffect, useState } from "react"

export function Home3DPreview() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Use a simple placeholder instead of Three.js to avoid context issues
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  // Handle errors
  const handleError = () => {
    setHasError(true)
  }

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl">
        <div className="text-center p-4">
          <p className="text-gray-500">3D visualization unavailable</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl overflow-hidden">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <div className={`w-full h-full transition-opacity duration-500 ${isLoaded ? "opacity-100" : "opacity-0"}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full">
            {/* Static visualization instead of Three.js */}
            <div className="absolute w-24 h-24 bg-purple-500 rounded-lg top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 shadow-lg animate-float"></div>
            <div className="absolute w-16 h-16 bg-blue-500 rounded-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-lg animate-float-delay"></div>
            <div className="absolute w-20 h-20 bg-pink-500 rounded-lg bottom-1/4 right-1/4 transform translate-x-1/2 translate-y-1/2 shadow-lg animate-float-delay-2"></div>

            {/* Task connections */}
            <div className="absolute top-0 left-0 w-full h-full">
              <svg width="100%" height="100%" className="absolute inset-0">
                <line x1="25%" y1="25%" x2="50%" y2="50%" stroke="rgba(139, 92, 246, 0.5)" strokeWidth="2" />
                <line x1="50%" y1="50%" x2="75%" y2="75%" stroke="rgba(139, 92, 246, 0.5)" strokeWidth="2" />
              </svg>
            </div>

            {/* Particles */}
            <div className="absolute w-3 h-3 bg-purple-300 rounded-full top-1/3 left-1/3 animate-pulse"></div>
            <div className="absolute w-2 h-2 bg-blue-300 rounded-full top-2/3 left-1/2 animate-pulse-delay"></div>
            <div className="absolute w-4 h-4 bg-pink-300 rounded-full bottom-1/3 right-1/3 animate-pulse-delay-2"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
