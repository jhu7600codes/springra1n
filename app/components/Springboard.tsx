'use client'

import { useMemo, useState, useEffect } from 'react'
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
  iconBg: string
  type: CoreAppType
  target: string
}

const coreApps: CoreApp[] = [
  {
    id: 'springloader',
    name: 'Springloader',
    icon: '📦',
    iconBg: 'from-amber-500 to-orange-600',
    type: 'route',
    target: '/springloader',
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: '⚙️',
    iconBg: 'from-gray-400 to-gray-600',
    type: 'route',
    target: '/settings',
  },
  {
    id: 'livecontainer',
    name: 'LiveContainer',
    icon: '📲',
    iconBg: 'from-blue-500 to-cyan-600',
    type: 'scheme',
    target: 'livecontainer://',
  },
  {
    id: 'springra1n-web',
    name: 'Web',
    icon: '🌐',
    iconBg: 'from-indigo-500 to-purple-600',
    type: 'url',
    target: 'https://springra1n.app',
  },
]

function getCurrentTime() {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes} ${ampm}`
}

function getCurrentDate() {
  const now = new Date()
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`
}

function AppIcon({ 
  icon, 
  iconBg, 
  label, 
  onClick 
}: { 
  icon: string
  iconBg: string
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1 group"
    >
      <div className={`w-[64px] h-[64px] rounded-[18px] bg-gradient-to-br ${iconBg} shadow-lg flex items-center justify-center text-2xl relative overflow-hidden group-active:scale-95 transition-transform`}>
        <div className="absolute inset-0 bg-white/20" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 25%, 0 50%)' }} />
      </div>
      <span className="text-[12px] text-white font-medium text-shadow-sm max-w-[70px] truncate px-1">
        {label}
      </span>
    </button>
  )
}

export default function Springboard({ userId }: SpringboardProps) {
  const [apps, setApps] = useState<any[]>([])
  const [wallpaperStyle, setWallpaperStyle] = useState<React.CSSProperties>({
    backgroundColor: 'black',
  })
  const [currentTime, setCurrentTime] = useState(getCurrentTime())
  const [currentDate, setCurrentDate] = useState(getCurrentDate())
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTime())
      setCurrentDate(getCurrentDate())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

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

  const coreAppIcons = coreApps.map(app => app.icon)
  const hasMatchingUserApps = apps.length > 3

  return (
    <div className="min-h-screen text-white" style={wallpaperStyle}>
      <div className="pt-12 pb-24 px-6 max-w-md mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="text-4xl font-light tracking-wide">{currentTime}</div>
            <div className="text-sm font-medium opacity-80 mt-1">{currentDate}</div>
          </div>
          <div className="flex gap-1.5">
            <div className="w-6 h-3 border border-white/60 rounded-sm" />
            <div className="w-6 h-3 border border-white/60 rounded-sm" />
            <div className="w-6 h-3 border border-white/60 rounded-sm" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-x-4 gap-y-6">
          {combinedApps.slice(0, hasMatchingUserApps ? 16 : 20).map((item, index) => {
            if (item.kind === 'core') {
              const app = item.data
              return (
                <AppIcon
                  key={`core-${app.id}`}
                  icon={app.icon}
                  iconBg={app.iconBg}
                  label={app.name}
                  onClick={() => handleCoreAppOpen(app)}
                />
              )
            }

            const app: any = item.data
            const appName = app.name || app.app_name || 'App'
            const url = app.url || app.app_url || ''
            const bgColors = [
              'from-pink-500 to-rose-600',
              'from-violet-500 to-purple-600',
              'from-emerald-500 to-green-600',
              'from-amber-500 to-yellow-600',
              'from-cyan-500 to-teal-600',
              'from-fuchsia-500 to-pink-600',
              'from-orange-500 to-red-600',
              'from-lime-500 to-emerald-600',
            ]
            const colorIndex = index % bgColors.length

            return (
              <AppIcon
                key={`user-${app.id}`}
                icon="📱"
                iconBg={bgColors[colorIndex]}
                label={appName}
                onClick={() => {
                  if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
                    router.push(`/app/${app.id}`)
                  } else if (typeof url === 'string' && url.includes('://')) {
                    window.location.href = url
                  } else {
                    console.warn('[springra1n/springboard] app has no openable url', app)
                  }
                }}
              />
            )
          })}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 pb-6 pt-4">
        <div className="max-w-md mx-auto">
          <div className="bg-gray-900/70 backdrop-blur-xl rounded-[2rem] py-3 px-2">
            <div className="flex justify-center gap-6">
              <button 
                type="button"
                className="flex flex-col items-center gap-1 group"
                onClick={() => router.push('/springloader')}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-600/60 to-gray-700/60 backdrop-blur shadow-lg flex items-center justify-center text-xl group-active:scale-95 transition-transform">
                  📦
                </div>
                <span className="text-[10px] text-white/80">Apps</span>
              </button>
              <button 
                type="button"
                className="flex flex-col items-center gap-1 group"
                onClick={() => router.push('/settings')}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-600/60 to-gray-700/60 backdrop-blur shadow-lg flex items-center justify-center text-xl group-active:scale-95 transition-transform">
                  ⚙️
                </div>
                <span className="text-[10px] text-white/80">Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-8 flex justify-center items-end pb-2 z-50">
        <div className="w-32 h-1.5 bg-white/80 rounded-full" />
      </div>
    </div>
  )
}
