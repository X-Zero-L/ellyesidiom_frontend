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
      <header className='bg-white shadow'>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">怡闻录</h1>
          </div>
          <div className="w-8">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                  <Avatar>
                    <AvatarImage src={`https://q1.qlogo.cn/g?b=qq&nk=${user.user_id}&s=100`} alt={user.nickname} />
                    <AvatarFallback>{user.nickname[0]}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.nickname}</p>
                    <p className="text-xs leading-none text-muted-foreground">QQ: {user.user_id}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => router.push('/')}>
                    <Home className="mr-2 h-4 w-4" />
                    <span>首页</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => router.push('/admin/review')}>
                  <UserCog className="mr-2 h-4 w-4" />
                  <span>管理员面板</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>登出</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {children}
      </main>
    </div>
  )
}

