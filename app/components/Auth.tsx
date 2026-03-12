'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        await supabase.auth.signUp({ email, password })
      } else {
        await supabase.auth.signInWithPassword({ email, password })
      }
    } catch (err: any) {
      console.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">springid</h1>

        <form onSubmit={handleAuth} className="space-y-4">
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white"
            disabled={loading}
          />

          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white"
            disabled={loading}
          />

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 rounded py-2 font-semibold disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'loading...' : isSignUp ? 'sign up' : 'sign in'}
          </button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full mt-4 text-gray-400 hover:text-white text-sm"
        >
          {isSignUp ? 'already have account?' : 'no account?'}
        </button>
      </div>
    </div>
  )
}
