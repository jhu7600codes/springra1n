'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface SpringboardProps {
  userId: string
}

type CoreAppType = 'route' | 'url' | 'scheme'

interface CoreApp {
  id: string
  name: string
  icon: string
  type: CoreAppType
  target: string
}

const coreApps: CoreApp[] = [
  {
    id: 'springloader',
    name: 'springloader',
    icon: '📦',
    type: 'route',
    target: '/springloader',
  },
  {
    id: 'livecontainer',
    name: 'livecontainer',
    icon: '📲',
    type: 'scheme',
    target: 'livecontainer://',
  },
  {
    id: 'springra1n-web',
    name: 'web app',
    icon: '🌐',
    type: 'url',
    target: 'https://springra1n.app',
  },
]

export default function Springboard({ userId }: SpringboardProps) {
  const [apps, setApps] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchApps = async () => {
      console.log('[springra1n/springboard] fetchApps for user', { userId })
      const { data, error } = await supabase
        .from('apps')
        .select('*')
        .eq('user_id', userId)

      if (error) {
        console.error('[springra1n/springboard] error fetching apps', error)
      } else {
        console.log('[springra1n/springboard] apps fetched', {
          count: data?.length || 0,
        })
      }
      if (!cancelled) {
        setApps(data || [])
      }
    }

    let cancelled = false

    if (userId) {
      console.log('[springra1n/springboard] useEffect userId set, fetching apps')
      fetchApps()
    }

    return () => {
      cancelled = true
    }
  }, [userId])

  const handleCoreAppOpen = (app: CoreApp) => {
    console.log('[springra1n/springboard] open core app', app)
    if (app.type === 'route') {
      router.push(app.target)
    } else if (app.type === 'url' || app.type === 'scheme') {
      window.location.href = app.target
    }
  }

  console.log('[springra1n/springboard] render', {
    userId,
    appCount: apps.length,
  })

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-20">
      <div className="max-w-2xl mx-auto flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-4 text-center">springra1n</h1>
        <p className="text-xs text-gray-500 mb-6 text-center">
          tap an app to open it. use springloader to add more.
        </p>

        <div className="w-full grid grid-cols-4 gap-4 mb-6">
          {coreApps.map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() => handleCoreAppOpen(app)}
              className="aspect-square rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center cursor-pointer hover:opacity-80 transition"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">{app.icon}</div>
                <p className="text-[11px] text-gray-200 truncate px-2">
                  {app.name}
                </p>
              </div>
            </button>
          ))}

          {apps.map((app: any) => (
            <div
              key={app.id}
              className="aspect-square rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center cursor-pointer hover:opacity-80 transition"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">📱</div>
                <p className="text-[11px] text-gray-300 truncate px-2">
                  {app.name}
                </p>
              </div>
            </div>
          ))}
        </div>

        {apps.length === 0 && (
          <div className="w-full flex flex-col items-center justify-center py-4 text-center text-gray-500">
            <p className="text-sm">no user apps installed yet</p>
            <p className="text-xs text-gray-600 mt-1">
              open springloader to sideload apps via urls.
            </p>
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
