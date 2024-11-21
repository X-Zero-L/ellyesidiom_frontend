'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Key, Loader2, LogOut, Search, Shuffle, User, UserCog } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import ImageCard from './image-card'
import ImageModal from './image-modal'
import { Toaster } from './ui/toaster'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from './ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { useUser } from '@/app/contexts/UserContext'

type ImageData = {
  tags: string[]
  image_url: string
  comment: string[]
  catalogue: string[]
  under_review: boolean
  timestamp: string
  uploader: {
    nickname: string
    id: string
    platform: string
  }
  likes: string[];
  hates: string[];
  image_hash: string; // Added image_hash field
}

interface UserModel {
  user_id: string
  nickname: string
  api_key: string | null
}

export default function ImageGallery () {
  const [images, setImages] = useState<ImageData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [randomCount, setRandomCount] = useState('5')
  const [currentPage, setCurrentPage] = useState<'index' | 'search' | 'random'>(
    'index'
  )
  const { user } = useUser()
  const router = useRouter()

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
      setError('Failed to logout. Please try again.')
    }
  }

  const fetchImages = async (
    url: string,
    payload: { keyword: string } | { count: number } | null = null
  ) => {
    setLoading(true)
    setError(null)
    try {
      //const response = await fetch(url)
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      if (!response.ok) {
        throw new Error('Failed to fetch images')
      }
      const data = await response.json()
      // {"status":"no result"}
      if (data.status === 'no result') {
        setError(
          'No result found for the search keyword, please try another one.'
        )
        return
      }
      setImages(data.data)
    } catch (err) {
      setError('An error occurred while fetching images. Please try again.')
      console.error('Failed to fetch images:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchImages('/api/index')
  }, [])

  const handleSearch = () => {
    if (searchKeyword.trim()) {
      setCurrentPage('search')
      fetchImages(`/api/search`, { keyword: searchKeyword })
    }
  }

  const handleRandom = () => {
    setCurrentPage('random')
    fetchImages(`/api/random?count=${randomCount}`, {
      count: parseInt(randomCount)
    })
  }

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl)
  }

  const handleCloseModal = () => {
    setSelectedImage(null)
  }

  if (!user) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <Loader2 className='w-8 h-8 animate-spin text-primary' />
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-100'>
        <div className='flex flex-col sm:flex-row gap-4 mb-8'>
          <div className='flex-1 flex gap-2'>
            <Input
              type='text'
              placeholder='搜索关键词...'
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch}>
              <Search className='mr-2 h-4 w-4' /> 搜索
            </Button>
          </div>
          <div className='flex gap-2'>
            <Select value={randomCount} onValueChange={setRandomCount}>
              <SelectTrigger className='w-[100px]'>
                <SelectValue placeholder='数量' />
              </SelectTrigger>
              <SelectContent>
                {[1, 5, 10, 15, 20, 25].map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleRandom}>
              <Shuffle className='mr-2 h-4 w-4' /> 随机
            </Button>
          </div>
        </div>
        {loading ? (
          <div className='flex items-center justify-center h-64'>
            <Loader2 className='w-8 h-8 animate-spin text-primary' />
          </div>
        ) : error ? (
          <div className='text-center text-red-500'>{error}</div>
        ) : (
          <motion.div
            className='columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {images.map((image, index) => (
              <motion.div
                key={image.image_url}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className='mb-4 break-inside-avoid'
              >
              {user  && <ImageCard image={image} user={user!}/>}
              </motion.div>
            ))}
          </motion.div>
        )}
        <ImageModal
          imageUrl={selectedImage || ''}
          isOpen={!!selectedImage}
          onClose={handleCloseModal}
        />
        <Toaster />
    </div>
  )
}
