'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function SpringLoader() {
  const [apps, setApps] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [newAppUrl, setNewAppUrl] = useState('')

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)

      if (session?.user) {
        const { data } = await supabase
          .from('sideload_apps')
          .select('*')
          .eq('user_id', session.user.id)

        setApps(data || [])
      }
    }

    getSession()
  }, [])

  const handleAddApp = async () => {
    if (!newAppUrl || !user) return

    await supabase.from('sideload_apps').insert({
      user_id: user.id,
      app_url: newAppUrl,
      app_name: newAppUrl.split('/').pop(),
    })

    setNewAppUrl('')
    const { data } = await supabase
      .from('sideload_apps')
      .select('*')
      .eq('user_id', user.id)

    setApps(data || [])
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">springloader</h1>

        <div className="mb-8 space-y-3">
          <input
            type="text"
            placeholder="paste app url here"
            value={newAppUrl}
            onChange={(e) => setNewAppUrl(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white"
          />
          <button
            onClick={handleAddApp}
            className="w-full bg-blue-600 hover:bg-blue-700 rounded py-2 font-semibold"
          >
            add app
          </button>
        </div>

        <div className="space-y-2">
          {apps.map((app: any) => (
            <div
              key={app.id}
              className="bg-gray-900 rounded p-4 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{app.app_name}</p>
                <p className="text-xs text-gray-400 truncate">{app.app_url}</p>
              </div>
              <button
                onClick={() => {
                  window.location.href = `livecontainer://app?url=${encodeURIComponent(app.app_url)}`
                }}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
              >
                open
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Android nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around items-center h-16">
        <button className="flex-1 flex items-center justify-center">←</button>
        <button className="flex-1 flex items-center justify-center">⌂</button>
        <button className="flex-1 flex items-center justify-center">≡</button>
      </div>
    </div>
  )
}
