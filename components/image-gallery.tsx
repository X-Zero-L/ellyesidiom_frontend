'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Search, Shuffle } from 'lucide-react'
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
  likes: string[]
  hates: string[]
  image_hash: string
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
  const observerTarget = useRef(null)

  const fetchImages = useCallback(async (
    url: string,
    payload: { keyword: string } | { count: number } | null = null,
    isAdd = false
  ) => {
    if (isAdd) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
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
        throw new Error('获取图片失败')
      }
      const data = await response.json()
      if (data.status === 'no result') {
        setError('没有找到匹配的结果，请尝试其他关键词。')
        return
      }
      if (isAdd) {
        setImages(prevImages => [...prevImages, ...data.data])
      } else {
        setImages(data.data)
      }
    } catch (err) {
      setError('获取图片时发生错误。请稍后再试。')
      console.error('获取图片失败:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    fetchImages('/api/index')
  }, [fetchImages])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loadingMore && !loading) {
          handleLoadMore()
        }
      },
      { threshold: 1.0 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current)
      }
    }
  }, [loadingMore, loading])

  const handleSearch = useCallback(() => {
    if (searchKeyword.trim()) {
      setCurrentPage('search')
      fetchImages(`/api/search`, { keyword: searchKeyword })
    }
  }, [searchKeyword, fetchImages])

  const handleRandom = useCallback(() => {
    setCurrentPage('random')
    fetchImages(`/api/random?count=${randomCount}`, {
      count: parseInt(randomCount)
    })
  }, [randomCount, fetchImages])

  const handleImageClick = useCallback((imageUrl: string) => {
    setSelectedImage(imageUrl)
  }, [])

  const handleCloseModal = useCallback(() => {
    setSelectedImage(null)
  }, [])

  const handleLoadMore = useCallback(async () => {
    await fetchImages(`/api/random?count=6`, { count: 6 }, true)
  }, [fetchImages])

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
      {loading && images.length === 0 ? (
        <div className='flex items-center justify-center h-64'>
          <Loader2 className='w-8 h-8 animate-spin text-primary' />
        </div>
      ) : error ? (
        <div className='text-center text-red-500'>{error}</div>
      ) : (
        <>
          <MasonryGrid
            items={images}
            columnWidth={300}
            renderItem={(image, index, onHeightChange) => (
              <ImageCard
                key={`${image.image_hash}-${index}`}
                image={image}
                user={user}
                onHeightChange={onHeightChange}
              />
            )}
          />
          <div ref={observerTarget} className='h-10 mt-8 flex justify-center items-center'>
            {loadingMore && <Loader2 className='w-8 h-8 animate-spin text-primary' />}
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

