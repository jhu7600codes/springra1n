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
  useEffect(() => {
    if (!user) return
    if (!setupComplete) return

    const key = `springra1n_env_installed_${user.id}`
    const already = typeof window !== 'undefined' && sessionStorage.getItem(key) === '1'
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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>loading...</p>
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
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-8 text-center">setup springra1n</h1>

          {step === 0 && (
            <div className="space-y-4">
              <p className="text-gray-400 mb-4">welcome to springra1n</p>
              <button
                onClick={() => setStep(1)}
                className="w-full bg-blue-600 hover:bg-blue-700 rounded py-2 font-semibold"
              >
                next
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <label className="block text-sm text-gray-400">device name</label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="my iphone"
                className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white"
              />
              <button
                onClick={async () => {
                  if (deviceName) {
                    await supabase.from('devices').insert({
                      user_id: user.id,
                      device_name: deviceName,
                      setup_complete: true,
                    })
                    setSetupComplete(true)
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 rounded py-2 font-semibold"
              >
                finish
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (envInstalling && !envInstalled) {
    return (
      <EnvInstall
        onDone={() => {
          try {
            sessionStorage.setItem(`springra1n_env_installed_${user.id}`, '1')
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
  return <Springboard userId={user.id} />
}
