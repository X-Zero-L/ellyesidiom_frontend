'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { LogOut, User, Key, Mail } from 'lucide-react'

interface UserModel {
  user_id: string
  nickname: string
  api_key: string | null
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserModel | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/user/get_user_info')
        if (!response.ok) {
          throw new Error('Failed to fetch user info')
        }
        const userData: UserModel = (await response.json()).data
        if (!userData.user_id) {
          throw new Error('User ID not found')
        }
        setUser(userData)
      } catch (err) {
        console.error('Error fetching user info:', err)
        setError('Failed to load user information')
        router.push('/verify')
      }
    }

    fetchUserInfo()
  }, [router])

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      if (response.ok) {
        router.push('/verify')
      } else {
        throw new Error('Logout failed')
      }
    } catch (err) {
      console.error('Error during logout:', err)
      setError('Failed to logout. Please try again.')
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500 text-xl font-semibold">{error}</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl"
      >
        <div className="md:flex">
          <div className="md:flex-shrink-0">
            <Image
              className="h-48 w-full object-cover md:w-48"
              src={`https://q1.qlogo.cn/g?b=qq&nk=${user.user_id}&s=640`}
              alt={user.nickname}
              width={192}
              height={192}
            />
          </div>
          <div className="p-8">
            <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">User Dashboard</div>
            <h1 className="block mt-1 text-lg leading-tight font-medium text-black">{user.nickname}</h1>
            <div className="mt-4 space-y-3">
              <InfoItem icon={<User className="text-gray-500" />} label="User ID" value={user.user_id} />
              <InfoItem icon={<Mail className="text-gray-500" />} label="QQ" value={user.user_id} />
              <InfoItem icon={<Key className="text-gray-500" />} label="API Key" value={user.api_key || 'Not available'} />
            </div>
            <div className="mt-6">
              <button
                onClick={handleLogout}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <LogOut className="mr-2" size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

interface InfoItemProps {
  icon: React.ReactNode
  label: string
  value: string
}

function InfoItem({ icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-center">
      {icon}
      <span className="ml-2 text-gray-500">{label}:</span>
      <span className="ml-2 text-gray-900">{value}</span>
    </div>
  )
}

