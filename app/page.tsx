'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import ImageGallery from '@/components/image-gallery'
import { useUser } from '@/app/contexts/UserContext'

export default function HomePage() {
  const { user, loading, error } = useUser()
  const router = useRouter()
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    if (!loading) {
      if (error || !user) {
        console.error('not logged in, redirecting to verify page')
      } else {
        setIsInitializing(false)
      }
    }
  }, [user, loading, error, router])

  if (loading || isInitializing) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <Loader2 className='w-8 h-8 animate-spin text-primary' />
      </div>
    )
  }

  return <ImageGallery />
}

