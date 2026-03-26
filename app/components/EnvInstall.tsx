'use client'

import { useEffect, useMemo, useState } from 'react'

interface EnvInstallProps {
  durationMs?: number
  onDone: () => void
}

export default function EnvInstall({ durationMs = 2600, onDone }: EnvInstallProps) {
  const steps = useMemo(
    () => [
      'Installing springra1n environment...',
      'Installing springloader...',
      'Installing default apps...',
      'Patching springboard...',
      'Finalizing...',
    ],
    []
  )

  const [progress, setProgress] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)

  useEffect(() => {
    let raf = 0
    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const nextProgress = Math.floor(t * 100)
      setProgress(nextProgress)
      setStepIdx(Math.min(steps.length - 1, Math.floor(t * steps.length)))

      if (t >= 1) {
        onDone()
        return
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [durationMs, onDone, steps.length])

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="text-5xl mb-6">🍎</div>
      
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-center mb-1">springra1n</h1>
        <p className="text-sm text-gray-500 text-center mb-8">Setting up your environment</p>

        <div className="w-full bg-gray-900 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-600 mt-3">
          <span>Preparing...</span>
          <span>{progress}%</span>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400 animate-pulse">{steps[stepIdx]}</p>
        </div>
      </div>

      <div className="absolute bottom-8 text-xs text-gray-700">
        Do not close this page
      </div>
    </div>
  )
}

