'use client'

import { useEffect, useMemo, useState } from 'react'

interface EnvInstallProps {
  durationMs?: number
  onDone: () => void
}

export default function EnvInstall({ durationMs = 2600, onDone }: EnvInstallProps) {
  const steps = useMemo(
    () => [
      'installing springra1n environment…',
      'installing springloader…',
      'installing default apps…',
      'patching springboard…',
      'finalizing…',
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
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2">springra1n</h1>
        <p className="text-sm text-gray-400 mb-6">{steps[stepIdx]}</p>

        <div className="w-full bg-gray-900 border border-gray-800 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>boot</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  )
}

