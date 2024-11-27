'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Home, Loader2, LogOut, UserCog } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUser } from '@/app/contexts/UserContext'
import { Header } from './header'
import { DynamicBackground } from './dynamic-background'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, loading, error } = useUser()
  const router = useRouter()
  const pathname = usePathname()

  if (pathname === '/verify') {
    return <>{children}</>
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/user/logout', { method: 'POST' })
      if (response.ok) {
        router.push('/verify')
      } else {
        throw new Error('Logout failed')
      }
    } catch (err) {
      console.error('Error during logout:', err)
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <Loader2 className='w-8 h-8 animate-spin text-primary' />
      </div>
    )
  }

  if (error || !user) {
    router.push('/verify')
    return null
  }

  return (
    <div className='min-h-screen bg-gray-100'>
      <Header />
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {children}
      </main>
    </div>
  )
}

