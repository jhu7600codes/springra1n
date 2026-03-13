'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AndroidNav from '@/components/AndroidNav'
import { catalogApps, type CatalogApp } from './catalog'

export default function SpringLoader() {
  const [installed, setInstalled] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [tab, setTab] = useState<'browse' | 'installed'>('browse')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<CatalogApp | null>(null)
  const [addingUrl, setAddingUrl] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)

      if (session?.user) {
        const { data } = await supabase
          .from('sideload_apps')
          .select('*')
          .eq('user_id', session.user.id)

        setInstalled(data || [])
      }
    }

    getSession()
  }, [])

  const refreshInstalled = async () => {
    if (!user) return
    const { data } = await supabase
      .from('sideload_apps')
      .select('*')
      .eq('user_id', user.id)
    setInstalled(data || [])
  }

  const installFromCatalog = async (app: CatalogApp) => {
    if (!user) return
    setBusy(true)
    try {
      const { error } = await supabase.from('sideload_apps').insert({
        user_id: user.id,
        app_url: app.url,
        app_name: app.name,
      })
      if (error) console.error('[springra1n/springloader] install error', error)
      await refreshInstalled()
      setTab('installed')
    } finally {
      setBusy(false)
    }
  }

  const uninstall = async (id: string) => {
    if (!user) return
    setBusy(true)
    try {
      const { error } = await supabase
        .from('sideload_apps')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      if (error) console.error('[springra1n/springloader] uninstall error', error)
      await refreshInstalled()
    } finally {
      setBusy(false)
    }
  }

  const addCustomUrl = async () => {
    if (!addingUrl || !user) return
    setBusy(true)
    try {
      const nameGuess =
        addingUrl.startsWith('http://') || addingUrl.startsWith('https://')
          ? new URL(addingUrl).hostname
          : addingUrl.split('://')[0]

      const { error } = await supabase.from('sideload_apps').insert({
        user_id: user.id,
        app_url: addingUrl,
        app_name: nameGuess || addingUrl,
      })
      if (error) console.error('[springra1n/springloader] add url error', error)
      setAddingUrl('')
      await refreshInstalled()
      setTab('installed')
    } catch (e) {
      console.error('[springra1n/springloader] add url parse error', e)
    } finally {
      setBusy(false)
    }
  }

  const filteredCatalog = catalogApps.filter((a) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      a.name.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q)
    )
  })

  const isInstalled = (app: CatalogApp) =>
    installed.some((i: any) => (i.app_url || '').toLowerCase() === app.url.toLowerCase())

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">springloader</h1>
            <div className="text-xs text-gray-500 mt-1">packages · repos · sideload</div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab('browse')}
              className={`px-3 py-2 rounded text-sm border ${
                tab === 'browse'
                  ? 'bg-blue-600 border-blue-500'
                  : 'bg-gray-900 border-gray-800 hover:bg-gray-800'
              }`}
            >
              browse
            </button>
            <button
              type="button"
              onClick={() => setTab('installed')}
              className={`px-3 py-2 rounded text-sm border ${
                tab === 'installed'
                  ? 'bg-blue-600 border-blue-500'
                  : 'bg-gray-900 border-gray-800 hover:bg-gray-800'
              }`}
            >
              installed
            </button>
          </div>
        </div>

        <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 mb-4">
          <div className="text-xs text-gray-400 mb-2">search</div>
          <input
            type="text"
            placeholder="search packages, categories…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white"
          />
        </div>

        {tab === 'browse' && (
          <>
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 mb-4">
              <div className="text-xs text-gray-400 mb-2">quick add</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://example.com or myapp://"
                  value={addingUrl}
                  onChange={(e) => setAddingUrl(e.target.value)}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={addCustomUrl}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded font-semibold"
                >
                  add
                </button>
              </div>
              <div className="text-xs text-gray-600 mt-2">
                http(s) opens in springra1n webview. schemes hand off to iOS.
              </div>
            </div>

            <div className="space-y-2">
              {filteredCatalog.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => setSelected(app)}
                  className="w-full bg-gray-950 border border-gray-800 hover:bg-gray-900 rounded-xl p-4 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{app.icon}</div>
                    <div>
                      <div className="font-semibold">{app.name}</div>
                      <div className="text-xs text-gray-500">
                        {app.category} · v{app.version}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {isInstalled(app) ? 'installed' : 'tap'}
                  </div>
                </button>
              ))}
            </div>

            {selected && (
              <div className="fixed inset-0 z-50" onClick={() => setSelected(null)}>
                <div className="absolute inset-0 bg-black/70" />
                <div
                  className="absolute left-0 right-0 bottom-0 bg-gray-950 border-t border-gray-800 rounded-t-2xl p-5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{selected.icon}</div>
                      <div>
                        <div className="text-xl font-bold">{selected.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {selected.category} · v{selected.version}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-white text-sm"
                      onClick={() => setSelected(null)}
                    >
                      close
                    </button>
                  </div>
                  <div className="text-sm text-gray-400 mt-4">{selected.description}</div>
                  <div className="text-xs text-gray-600 mt-2 break-all">{selected.url}</div>

                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      disabled={busy || isInstalled(selected)}
                      onClick={() => installFromCatalog(selected)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-3 rounded-xl font-semibold"
                    >
                      {isInstalled(selected) ? 'installed' : busy ? 'installing…' : 'install'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab('installed')}
                      className="bg-gray-900 hover:bg-gray-800 border border-gray-800 px-4 py-3 rounded-xl"
                    >
                      view installed
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'installed' && (
          <div className="space-y-2">
            {installed.length === 0 && (
              <div className="text-center text-gray-500 py-10">
                <div className="text-sm">no packages installed</div>
                <div className="text-xs text-gray-600 mt-1">
                  browse packages or add a url to get started.
                </div>
              </div>
            )}

            {installed.map((app: any) => (
              <div
                key={app.id}
                className="bg-gray-950 border border-gray-800 rounded-xl p-4 flex justify-between items-center gap-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold truncate">{app.app_name}</p>
                  <p className="text-xs text-gray-500 truncate">{app.app_url}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const url: string = app.app_url || ''
                      if (url.startsWith('http://') || url.startsWith('https://')) {
                        // open inside springra1n webview
                        window.location.href = `/app/${app.id}`
                      } else if (url.includes('://')) {
                        window.location.href = url
                      } else {
                        window.location.href = `livecontainer://app?url=${encodeURIComponent(url)}`
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
                  >
                    open
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => uninstall(app.id)}
                    className="bg-gray-900 hover:bg-gray-800 border border-gray-800 px-3 py-2 rounded text-sm disabled:opacity-50"
                  >
                    uninstall
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AndroidNav />
    </div>
  )
}
