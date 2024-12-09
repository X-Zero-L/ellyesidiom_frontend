'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUp, Moon, Sun, Share2 } from 'lucide-react'


export function ToolBar() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)

    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const shareContent = () => {
    if (navigator.share) {
      navigator.share({
        title: '怡闻录',
        url: window.location.href
      }).catch(console.error)
    } else {
      alert('分享链接 ' + window.location.href)
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-8 right-8 z-50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex flex-col space-y-4">
            <ToolButton onClick={scrollToTop} aria-label="Scroll to top">
              <ChevronUp className="h-6 w-6" />
            </ToolButton>
            <ToolButton onClick={shareContent} aria-label="Share">
              <Share2 className="h-6 w-6" />
            </ToolButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ToolButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="group flex items-center justify-center w-12 h-12 bg-white dark:bg-gray-800 bg-opacity-80 dark:bg-opacity-80 hover:bg-opacity-100 dark:hover:bg-opacity-100 text-gray-700 dark:text-gray-300 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl"
      {...props}
    >
      <span className="transform group-hover:scale-110 transition-transform duration-300">
        {children}
      </span>
    </button>
  )
}
