'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import ImageGallery from '@/components/image-gallery'
import { useUser } from '@/app/contexts/UserContext'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  const { user, loading, error } = useUser()
  const router = useRouter()
  const [isInitializing, setIsInitializing] = useState(true)
  const [showVoteDialog, setShowVoteDialog] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (error || !user) {
        console.error('not logged in, redirecting to verify page')
      } else {
        setIsInitializing(false)
        setShowVoteDialog(true) // 显示投票对话框
      }
    }
  }, [user, loading, error, router])

  const handleVoteClick = () => {
    router.push('/vote')
    setShowVoteDialog(false)
  }

  if (loading || isInitializing) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <Loader2 className='w-8 h-8 animate-spin text-primary' />
      </div>
    )
  }

  return (
    <>
      <Dialog open={showVoteDialog} onOpenChange={setShowVoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>年度怡言投票活动开启！</DialogTitle>
            <DialogDescription>
              欢迎参与年度怡言评选活动，您的每一票都很重要！
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start">
            <Button variant="default" onClick={handleVoteClick}>
              去投票
            </Button>
            <Button variant="outline" onClick={() => setShowVoteDialog(false)}>
              稍后再说
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ImageGallery />
    </>
  )
}