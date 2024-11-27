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
import { MasonryGrid } from './masonry-grid'

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
  image_hash: string;
}

interface UserModel {
  user_id: string
  nickname: string
  api_key: string | null
}

export default function ImageGallery() {
  const [images, setImages] = useState<ImageData[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [randomCount, setRandomCount] = useState('5')
  const [currentPage, setCurrentPage] = useState<'index' | 'search' | 'random'>('index')
  const { user } = useUser()

  const fetchImages = async (
    url: string,
    payload: { keyword: string } | { count: number } | null = null,
    isAdd = false
  ) => {
    setLoading(true)
    setError(null)
    try {
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
      if (data.status === 'no result') {
        setError('No result found for the search keyword, please try another one.')
        return
      }
      if (isAdd) {
        setImages(prevImages => [...prevImages, ...data.data])
      } else {
        setImages(data.data)
      }
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

  const handleLoadMore = async () => {
    setLoadingMore(true)
    try {
      await fetchImages(`/api/random?count=20`, { count: 20 }, true)
    } finally {
      setLoadingMore(false)
    }
  }

  if (!user) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <Loader2 className='w-8 h-8 animate-spin text-primary' />
      </div>
    )
  }
  const imageItems = images.map((image, index) => (
    <ImageCard key={`${image.image_hash}-${index}`} image={image} user={user} />
  ))
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
      {loading && images.length === 0 ? (
        <div className='flex items-center justify-center h-64'>
          <Loader2 className='w-8 h-8 animate-spin text-primary' />
        </div>
      ) : error ? (
        <div className='text-center text-red-500'>{error}</div>
      ) : (
        <>
          <MasonryGrid items={imageItems} columnWidth={300} />
          <div className='mt-8 flex justify-center'>
            <Button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className='px-6 py-2 text-lg'
            >
              {loadingMore ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  加载中...
                </>
              ) : (
                '加载更多'
              )}
            </Button>
          </div>
        </>
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

