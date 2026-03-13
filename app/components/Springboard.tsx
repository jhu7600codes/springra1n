'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface SpringboardProps {
  userId: string
}

export default function Springboard({ userId }: SpringboardProps) {
  const [apps, setApps] = useState<any[]>([])

  useEffect(() => {
    const fetchApps = async () => {
      const { data } = await supabase
        .from('apps')
        .select('*')
        .eq('user_id', userId)

      setApps(data || [])
    }

    if (userId) {
      fetchApps()
    }
  }, [userId])

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-20">
      <div className="max-w-2xl mx-auto flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-8 text-center">springra1n</h1>

        <div className="w-full grid grid-cols-4 gap-4 mb-6">
          {apps.map((app: any) => (
            <div
              key={app.id}
              className="aspect-square rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center cursor-pointer hover:opacity-80 transition"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">📦</div>
                <p className="text-xs text-gray-300 truncate px-2">{app.name}</p>
              </div>
            </div>
          ))}
        </div>

        {apps.length === 0 && (
          <div className="w-full flex flex-col items-center justify-center py-8 text-center text-gray-500">
            <p className="text-sm">no apps installed yet</p>
            <p className="text-xs text-gray-600 mt-1">open springloader to discover and add apps</p>
          </div>
        )}
      </div>

      {/* Android 3-button nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around items-center h-16">
        <button className="flex-1 flex items-center justify-center">←</button>
        <button className="flex-1 flex items-center justify-center">⌂</button>
        <button className="flex-1 flex items-center justify-center">≡</button>
      </div>
    </div>
  )
}
