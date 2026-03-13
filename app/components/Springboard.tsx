'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AndroidNav from '@/components/AndroidNav'

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
    id: 'settings',
    name: 'settings',
    icon: '⚙️',
    type: 'route',
    target: '/settings',
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
  const [wallpaperStyle, setWallpaperStyle] = useState<React.CSSProperties>({
    backgroundColor: 'black',
  })
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

  useEffect(() => {
    let cancelled = false

    const fetchWallpaper = async () => {
      const { data, error } = await supabase
        .from('devices')
        .select('wallpaper_type, wallpaper_value, wallpaper_image_url')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('[springra1n/springboard] error fetching wallpaper', error)
        return
      }

      if (cancelled) return

      const type = data?.wallpaper_type as string | null | undefined
      const value = (data?.wallpaper_value as string | null | undefined) || ''
      const imageUrl = (data?.wallpaper_image_url as string | null | undefined) || ''

      if (type === 'image') {
        const url = imageUrl || value
        setWallpaperStyle({
          backgroundImage: url ? `url(${url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: 'black',
        })
      } else if (type === 'color') {
        setWallpaperStyle({
          backgroundColor: value || 'black',
        })
      } else if (type === 'gradient') {
        setWallpaperStyle({
          backgroundImage: value || 'linear-gradient(135deg, #0f172a, #000000)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        })
      } else {
        setWallpaperStyle({ backgroundColor: 'black' })
      }
    }

    if (userId) fetchWallpaper()
    return () => {
      cancelled = true
    }
  }, [userId])

  const combinedApps = useMemo(() => {
    // core apps are always available; user apps are from DB
    return [
      ...coreApps.map((a) => ({ kind: 'core' as const, data: a })),
      ...apps.map((a) => ({ kind: 'user' as const, data: a })),
    ]
  }, [apps])

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
    <div className="min-h-screen text-white p-4 pb-20" style={wallpaperStyle}>
      <div className="max-w-2xl mx-auto flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-4 text-center">springra1n</h1>
        <p className="text-xs text-gray-500 mb-6 text-center">
          tap an app to open it. use springloader to add more.
        </p>

        <div className="w-full grid grid-cols-4 gap-4 mb-6">
          {combinedApps.map((item) => {
            if (item.kind === 'core') {
              const app = item.data
              return (
                <button
                  key={`core-${app.id}`}
                  type="button"
                  onClick={() => handleCoreAppOpen(app)}
                  className="aspect-square rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur flex items-center justify-center cursor-pointer hover:opacity-90 transition border border-white/5"
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">{app.icon}</div>
                    <p className="text-[11px] text-gray-100 truncate px-2">
                      {app.name}
                    </p>
                  </div>
                </button>
              )
            }

            const app: any = item.data
            const appName = app.name || app.app_name || 'app'
            const url = app.url || app.app_url || ''

            return (
              <button
                key={`user-${app.id}`}
                type="button"
                onClick={() => {
                  if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
                    router.push(`/app/${app.id}`)
                  } else if (typeof url === 'string' && url.includes('://')) {
                    window.location.href = url
                  } else {
                    console.warn('[springra1n/springboard] app has no openable url', app)
                  }
                }}
                className="aspect-square rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur flex items-center justify-center cursor-pointer hover:opacity-90 transition border border-white/5"
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">📱</div>
                  <p className="text-[11px] text-gray-200 truncate px-2">
                    {appName}
                  </p>
                </div>
              </button>
            )
          })}
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

      <AndroidNav />
    </div>
  )
}
