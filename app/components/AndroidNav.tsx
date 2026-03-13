'use client'

import { useMemo, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface AndroidNavProps {
  onMenuOpen?: () => void
}

export default function AndroidNav({ onMenuOpen }: AndroidNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const resolvedMenuOpen = menuOpen
  const openMenu = () => {
    onMenuOpen?.()
    setMenuOpen(true)
  }
  const closeMenu = () => setMenuOpen(false)

  const menuItems = useMemo(
    () => [
      { id: 'home', label: 'Home', action: () => router.push('/') },
      { id: 'springloader', label: 'Springloader', action: () => router.push('/springloader') },
      { id: 'settings', label: 'Settings', action: () => router.push('/settings') },
      {
        id: 'signout',
        label: 'Sign out',
        action: async () => {
          await supabase.auth.signOut()
          router.push('/')
        },
      },
    ],
    [router]
  )

  return (
    <>
      {resolvedMenuOpen && (
        <div
          className="fixed inset-0 z-50"
          aria-hidden="true"
          onClick={closeMenu}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="absolute left-0 right-0 bottom-0 bg-gray-950 border-t border-gray-800 rounded-t-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-400 truncate">
                menu · <span className="text-gray-500">{pathname}</span>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-white text-sm"
                onClick={closeMenu}
              >
                close
              </button>
            </div>
            <div className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg px-4 py-3 text-left"
                  onClick={async () => {
                    closeMenu()
                    await item.action()
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around items-center h-16 z-40">
        <button
          type="button"
          className="flex-1 flex items-center justify-center"
          onClick={() => router.back()}
          aria-label="Back"
        >
          ←
        </button>
        <button
          type="button"
          className="flex-1 flex items-center justify-center"
          onClick={() => router.push('/')}
          aria-label="Home"
        >
          ⌂
        </button>
        <button
          type="button"
          className="flex-1 flex items-center justify-center"
          onClick={openMenu}
          aria-label="Menu"
        >
          ≡
        </button>
      </div>
    </>
  )
}

