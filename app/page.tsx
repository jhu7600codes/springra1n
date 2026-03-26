'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Auth from '@/components/Auth'
import Springboard from '@/components/Springboard'
import EnvInstall from '@/components/EnvInstall'

export default function Page() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [setupComplete, setSetupComplete] = useState(false)
  const [envInstalling, setEnvInstalling] = useState(false)
  const [envInstalled, setEnvInstalled] = useState(false)
  const [deviceName, setDeviceName] = useState('')
  const [step, setStep] = useState(0)
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    setLoading(true)

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('[springra1n/page] onAuthStateChange fired', {
          hasSession: !!session,
          userId: session?.user?.id,
        })

        const currentUser = session?.user || null
        setUser(currentUser)

        if (!currentUser) {
          setSetupComplete(false)
          setEnvInstalling(false)
          setEnvInstalled(false)
          setLoading(false)
        }
      }
    )

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('guest') === 'true') {
      const guestUser = { id: 'guest', email: 'guest@springra1n.app' }
      setUser(guestUser)
      setIsGuest(true)
      setSetupComplete(true)
      setLoading(false)
    }
  }, [])

  // fetch device / setup state whenever user changes,
  // outside of the auth callback to avoid supabase lock contention
  useEffect(() => {
    if (!user) return

    let cancelled = false

    const fetchDeviceSetup = async () => {
      console.log('[springra1n/page] fetchDeviceSetup for user', {
        userId: user.id,
      })

      try {
        const { data, error } = await supabase
          .from('devices')
          .select('setup_complete')
          .eq('user_id', user.id)
          .single()

        if (error) {
          console.error('[springra1n/page] error fetching devices', error)
        }

        if (cancelled) return

        const complete = !!data?.setup_complete
        console.log('[springra1n/page] setup_complete from DB', {
          setup_complete: data?.setup_complete,
          resolved: complete,
        })
        setSetupComplete(complete)
      } catch (err) {
        if (!cancelled) {
          console.error('[springra1n/page] unexpected devices fetch error', err)
          setSetupComplete(false)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    setLoading(true)
    fetchDeviceSetup()

    return () => {
      cancelled = true
    }
  }, [user])

  // start env install once setup is complete (per-login)
  // only show env install ONCE per user (tracked in localStorage to persist across reloads)
  useEffect(() => {
    if (!user) return
    if (!setupComplete) return

    const key = `springra1n_env_installed_${user.id}`
    
    // check localStorage (persists across page reloads)
    const already = typeof window !== 'undefined' && localStorage.getItem(key) === '1'
    if (already) {
      setEnvInstalled(true)
      setEnvInstalling(false)
      return
    }

    setEnvInstalled(false)
    setEnvInstalling(true)
  }, [setupComplete, user])

  if (loading) {
    console.log('[springra1n/page] rendering: LoadingScreen')
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <div className="text-4xl mb-4">🍎</div>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-gray-500 text-sm mt-4">loading springra1n...</p>
      </div>
    )
  }

  if (!user) {
    console.log('[springra1n/page] rendering: Auth (no user)')
    return <Auth />
  }

  if (!setupComplete) {
    console.log('[springra1n/page] rendering: SetupWizard', {
      userId: user.id,
      setupComplete,
    })
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-6xl mb-6">🍎</div>
          
          {step === 0 && (
            <div className="text-center max-w-xs">
              <h1 className="text-3xl font-semibold mb-4">Welcome to springra1n</h1>
              <p className="text-gray-400 text-lg">
                Your iOS container environment on the web.
              </p>
              <button
                onClick={() => setStep(1)}
                className="mt-8 w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-full py-3 font-semibold text-lg transition-all"
              >
                Get Started
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="text-center max-w-xs w-full">
              <h2 className="text-2xl font-semibold mb-6">Name Your Device</h2>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="My iPhone"
                className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-4 text-lg text-white placeholder-gray-500 text-center focus:outline-none focus:border-blue-500 transition-colors"
                autoFocus
              />
              <p className="text-gray-500 text-sm mt-3">
                This will be displayed on your springboard.
              </p>
              <button
                onClick={async () => {
                  if (deviceName.trim()) {
                    await supabase.from('devices').insert({
                      user_id: user.id,
                      device_name: deviceName.trim(),
                      setup_complete: true,
                    })
                    setSetupComplete(true)
                  }
                }}
                disabled={!deviceName.trim()}
                className="mt-8 w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-full py-3 font-semibold text-lg transition-all"
              >
                Continue
              </button>
            </div>
          )}
        </div>

        <div className="pb-8 flex justify-center">
          <div className="flex gap-2">
            <div className={`w-2 h-2 rounded-full ${step === 0 ? 'bg-blue-500' : 'bg-gray-600'}`} />
            <div className={`w-2 h-2 rounded-full ${step === 1 ? 'bg-blue-500' : 'bg-gray-600'}`} />
          </div>
        </div>
      </div>
    )
  }

  if (envInstalling && !envInstalled) {
    return (
      <EnvInstall
        onDone={() => {
          try {
            localStorage.setItem(`springra1n_env_installed_${user.id}`, '1')
          } catch {}
          setEnvInstalled(true)
          setEnvInstalling(false)
        }}
      />
    )
  }

  console.log('[springra1n/page] rendering: Springboard', {
    userId: user.id,
    setupComplete,
  })
  return <Springboard userId={user.id} isGuest={isGuest} />
}
