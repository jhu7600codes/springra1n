'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Auth from '@/components/Auth'
import Springboard from '@/components/Springboard'

export default function Page() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [setupComplete, setSetupComplete] = useState(false)
  const [deviceName, setDeviceName] = useState('')
  const [step, setStep] = useState(0)

  useEffect(() => {
    const handleSession = async (session: any) => {
      const currentUser = session?.user || null
      setUser(currentUser)

      if (currentUser) {
        const { data } = await supabase
          .from('devices')
          .select('setup_complete')
          .eq('user_id', currentUser.id)
          .single()

        setSetupComplete(data?.setup_complete || false)
      } else {
        setSetupComplete(false)
      }

      setLoading(false)
    }

    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      await handleSession(session)
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        handleSession(session)
      }
    )

    getInitialSession()

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>loading...</p>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  if (!setupComplete) {
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

  return <Springboard userId={user.id} />
}
