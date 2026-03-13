'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AndroidNav from '@/components/AndroidNav'

export default function WebviewAppPage() {
  const params = useParams<{ appId: string }>()
  const router = useRouter()
  const appId = params?.appId

  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('app')
  const [url, setUrl] = useState<string>('')

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      const uid = data.session?.user?.id || null
      setUserId(uid)
      if (!uid || !appId) {
        setLoading(false)
        return
      }

      // Try apps table first (primary), then sideload_apps for legacy installs.
      const appRes = await supabase
        .from('apps')
        .select('*')
        .eq('id', appId)
        .eq('user_id', uid)
        .single()

      if (!appRes.error && appRes.data) {
        setTitle(appRes.data.name || 'app')
        setUrl(appRes.data.url || appRes.data.app_url || '')
        setLoading(false)
        return
      }

      const sideloadRes = await supabase
        .from('sideload_apps')
        .select('*')
        .eq('id', appId)
        .eq('user_id', uid)
        .single()

      if (sideloadRes.error) {
        console.error('[springra1n/webview] app fetch error', {
          appsError: appRes.error,
          sideloadError: sideloadRes.error,
        })
        setLoading(false)
        return
      }

      setTitle(sideloadRes.data.app_name || 'app')
      setUrl(sideloadRes.data.app_url || '')
      setLoading(false)
    }

    init()
  }, [appId])

  const kind = useMemo(() => {
    if (!url) return 'none'
    if (url.startsWith('http://') || url.startsWith('https://')) return 'http'
    if (url.includes('://')) return 'scheme'
    return 'unknown'
  }, [url])

  useEffect(() => {
    if (kind === 'scheme') {
      window.location.href = url
    }
  }, [kind, url])

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
        <p className="text-gray-400">sign in to open apps</p>
      </div>
    )
  }

  if (kind === 'none') {
    return (
      <div className="min-h-screen bg-black text-white p-6 pb-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-xl font-bold mb-2">app not found</div>
          <div className="text-sm text-gray-500 mb-6">
            this app has no url to open.
          </div>
          <button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold"
            onClick={() => router.push('/')}
          >
            go home
          </button>
        </div>
        <AndroidNav />
      </div>
    )
  }

  if (kind === 'scheme') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">opening…</div>
          <div className="text-xs text-gray-500 break-all">{url}</div>
        </div>
      </div>
    )
  }

  // http(s) webview
  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="px-4 pt-4 pb-3 border-b border-gray-800 bg-gray-950">
        <div className="text-sm font-semibold truncate">{title}</div>
        <div className="text-xs text-gray-500 truncate">{url}</div>
      </div>

      <div className="h-[calc(100vh-64px-80px)]">
        <iframe
          src={url}
          className="w-full h-full"
          referrerPolicy="no-referrer"
          sandbox="allow-forms allow-modals allow-popups allow-scripts allow-same-origin allow-downloads"
        />
      </div>

      <AndroidNav />
    </div>
  )
}

