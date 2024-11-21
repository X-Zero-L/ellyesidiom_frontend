'use client'

import React, { createContext, useState, useContext, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface UserModel {
  user_id: string
  nickname: string
  api_key: string | null
}

interface UserContextType {
  user: UserModel | null
  setUser: React.Dispatch<React.SetStateAction<UserModel | null>>
  loading: boolean
  error: string | null
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (pathname === '/verify') {
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/user/get_user_info')
        if (!response.ok) {
          throw new Error('Failed to fetch user info')
        }
        const userData: UserModel = (await response.json()).data
        if(!userData.api_key) {
          throw new Error('User not verified')
        }
        setUser(userData)
      } catch (err) {
        console.error('Error fetching user info:', err)
        setError('Failed to load user information')
        router.push('/verify')
      } finally {
        setLoading(false)
      }
    }

    fetchUserInfo()
  }, [router, pathname])

  return (
    <UserContext.Provider value={{ user, setUser, loading, error }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

