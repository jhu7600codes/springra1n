'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AndroidNav from '@/components/AndroidNav'

type WallpaperType = 'image' | 'color' | 'gradient'

const defaultWallpapers = [
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?auto=format&fit=crop&w=1200&q=80',
]

export default function SettingsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deviceName, setDeviceName] = useState('')

  const [wallpaperType, setWallpaperType] = useState<WallpaperType>('image')
  const [wallpaperValue, setWallpaperValue] = useState('')
  const [wallpaperImageUrl, setWallpaperImageUrl] = useState('')

  const [colorHex, setColorHex] = useState('#000000')
  const [gradA, setGradA] = useState('#0f172a')
  const [gradB, setGradB] = useState('#000000')
  const [gradAngle, setGradAngle] = useState(135)

  const computedGradient = useMemo(
    () => `linear-gradient(${gradAngle}deg, ${gradA}, ${gradB})`,
    [gradA, gradAngle, gradB]
  )

  const previewStyle = useMemo(() => {
    if (wallpaperType === 'color') return { backgroundColor: colorHex }
    if (wallpaperType === 'gradient') return { backgroundImage: computedGradient }
    const url = wallpaperImageUrl || wallpaperValue
    return {
      backgroundImage: url ? `url(${url})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundColor: 'black',
    }
  }, [colorHex, computedGradient, wallpaperImageUrl, wallpaperType, wallpaperValue])

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      const uid = data.session?.user?.id || null
      setUserId(uid)
      if (!uid) {
        setLoading(false)
        return
      }

      const { data: device, error } = await supabase
        .from('devices')
        .select('device_name, wallpaper_type, wallpaper_value, wallpaper_image_url')
        .eq('user_id', uid)
        .single()

      if (error) {
        console.error('[springra1n/settings] devices fetch error', error)
      }

      setDeviceName(device?.device_name || '')

      const wt = (device?.wallpaper_type as WallpaperType) || 'image'
      setWallpaperType(wt)
      setWallpaperValue(device?.wallpaper_value || '')
      setWallpaperImageUrl(device?.wallpaper_image_url || '')

      if (wt === 'color' && device?.wallpaper_value) {
        setColorHex(device.wallpaper_value)
      }
      if (wt === 'gradient' && typeof device?.wallpaper_value === 'string') {
        // keep the raw CSS string as the persisted source of truth
        // user edits build a new CSS string; no parsing required.
      }

      setLoading(false)
    }
    init()
  }, [])

  const applyWallpaperLocal = (type: WallpaperType) => {
    if (type === 'color') {
      setWallpaperValue(colorHex)
      setWallpaperImageUrl('')
    } else if (type === 'gradient') {
      setWallpaperValue(computedGradient)
      setWallpaperImageUrl('')
    }
  }

  const save = async () => {
    if (!userId) return
    setSaving(true)
    try {
      let nextValue = wallpaperValue
      let nextImageUrl = wallpaperImageUrl

      if (wallpaperType === 'color') {
        nextValue = colorHex
        nextImageUrl = ''
      } else if (wallpaperType === 'gradient') {
        nextValue = computedGradient
        nextImageUrl = ''
      } else if (wallpaperType === 'image') {
        // prefer wallpaper_image_url when set
        nextImageUrl = wallpaperImageUrl || ''
      }

      const { error } = await supabase
        .from('devices')
        .update({
          device_name: deviceName,
          wallpaper_type: wallpaperType,
          wallpaper_value: nextValue,
          wallpaper_image_url: nextImageUrl,
        })
        .eq('user_id', userId)

      if (error) {
        console.error('[springra1n/settings] save error', error)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>loading…</p>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <p className="text-gray-400">sign in to use settings</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">settings</h1>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded font-semibold"
          >
            {saving ? 'saving…' : 'save'}
          </button>
        </div>

        <div className="space-y-6">
          <section className="bg-gray-950 border border-gray-800 rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-3">device</h2>
            <label className="block text-xs text-gray-400 mb-2">device name</label>
            <input
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white"
              placeholder="my iphone"
            />
          </section>

          <section className="bg-gray-950 border border-gray-800 rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-3">wallpaper</h2>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {(['image', 'color', 'gradient'] as WallpaperType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setWallpaperType(t)
                    applyWallpaperLocal(t)
                  }}
                  className={`border rounded-lg px-3 py-2 text-sm ${
                    wallpaperType === t
                      ? 'bg-blue-600 border-blue-500'
                      : 'bg-gray-900 border-gray-800 hover:bg-gray-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-gray-800 overflow-hidden mb-4">
              <div className="h-40" style={previewStyle} />
            </div>

            {wallpaperType === 'image' && (
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-400 mb-2">default wallpapers</div>
                  <div className="grid grid-cols-2 gap-2">
                    {defaultWallpapers.map((url) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => {
                          setWallpaperImageUrl(url)
                          setWallpaperValue('')
                        }}
                        className="h-20 rounded-lg border border-gray-800 overflow-hidden"
                      >
                        <div className="w-full h-full" style={{
                          backgroundImage: `url(${url})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-2">
                    custom wallpaper url (or upload below)
                  </label>
                  <input
                    value={wallpaperImageUrl}
                    onChange={(e) => setWallpaperImageUrl(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white"
                    placeholder="https://…"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-2">upload image (stores as data url)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      if (file.size > 1_500_000) {
                        alert('image too large (max ~1.5MB)')
                        return
                      }
                      const reader = new FileReader()
                      reader.onload = () => {
                        const result = typeof reader.result === 'string' ? reader.result : ''
                        setWallpaperImageUrl('')
                        setWallpaperValue(result)
                      }
                      reader.readAsDataURL(file)
                    }}
                    className="w-full text-sm text-gray-300"
                  />
                  <div className="text-xs text-gray-600 mt-2">
                    note: uploading stores the image as a data url in `wallpaper_value`. for best results, use a hosted url.
                  </div>
                </div>
              </div>
            )}

            {wallpaperType === 'color' && (
              <div className="space-y-3">
                <label className="block text-xs text-gray-400">hex color</label>
                <input
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  onBlur={() => applyWallpaperLocal('color')}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white"
                  placeholder="#000000"
                />
              </div>
            )}

            {wallpaperType === 'gradient' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">color A</label>
                    <input
                      value={gradA}
                      onChange={(e) => setGradA(e.target.value)}
                      onBlur={() => applyWallpaperLocal('gradient')}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white"
                      placeholder="#0f172a"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">color B</label>
                    <input
                      value={gradB}
                      onChange={(e) => setGradB(e.target.value)}
                      onBlur={() => applyWallpaperLocal('gradient')}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white"
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2">angle</label>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={gradAngle}
                    onChange={(e) => {
                      setGradAngle(Number(e.target.value))
                    }}
                    onMouseUp={() => applyWallpaperLocal('gradient')}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 mt-1">{gradAngle}°</div>
                </div>
              </div>
            )}
          </section>

          <section className="bg-gray-950 border border-gray-800 rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-3">about</h2>
            <div className="text-sm text-gray-400">
              springra1n · web springboard with jailbroken-style customization
            </div>
          </section>

          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.href = '/'
            }}
            className="w-full bg-red-900/50 hover:bg-red-900 border border-red-800 rounded-xl py-3 font-semibold text-red-400 transition-colors"
          >
            sign out
          </button>
        </div>
      </div>

      <AndroidNav />
    </div>
  )
}

