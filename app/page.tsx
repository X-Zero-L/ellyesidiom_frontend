"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Vote, Timer } from "lucide-react";
import ImageGallery from "@/components/image-gallery";
import { useUser } from "@/app/contexts/UserContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function HomePage() {
  const { user, loading, error } = useUser();
  const router = useRouter();
  const [isInitializing, setIsInitializing] = useState(true);
  const [showVoteDialog, setShowVoteDialog] = useState(false);
  const [countdown, setCountdown] = useState("1天 12小时 34分钟 56秒");

  useEffect(() => {
    // 计算活动倒计时
    const endDate = new Date("2024-12-31T23:59:59");
    const timer = setInterval(() => {
      const now = new Date();
      const diff = endDate.getTime() - now.getTime();
      if (diff <= 0) {
        clearInterval(timer);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(
        `${days}天 ${hours}小时 ${minutes}分钟 ${seconds}秒`
      );
        
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!loading) {
      if (error || !user) {
        console.error("not logged in, redirecting to verify page");
      } else {
        setIsInitializing(false);
        setShowVoteDialog(true); // 显示投票对话框
      }
    }
  }, [user, loading, error, router]);

  const handleVoteClick = () => {
    router.push("/vote");
    setShowVoteDialog(false);
  };

  if (loading || isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-500 to-pink-500">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <Loader2 className="w-16 h-16 text-white" />
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Dialog open={showVoteDialog} onOpenChange={setShowVoteDialog}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-purple-500 to-pink-500 text-white border-none">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Vote className="w-6 h-6" />
                年度怡言投票活动开启！
              </DialogTitle>
              <DialogDescription className="text-white/80">
                <div className="space-y-4">
                  <p>欢迎参与年度怡言评选活动，您的每一票都很重要！</p>
                  <div className="flex items-center gap-2 bg-white/10 p-3 rounded-lg">
                    <Timer className="w-5 h-5" />
                    <span>活动倒计时：{countdown}</span>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="secondary"
                  onClick={handleVoteClick}
                  className="w-full bg-white text-purple-500 hover:bg-white/90"
                >
                  立即参与投票
                </Button>
              </motion.div>
              <Button
                variant="ghost"
                onClick={() => setShowVoteDialog(false)}
                className="w-full text-white/70 hover:text-white hover:bg-white/10"
              >
                稍后再说
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>
      <ImageGallery />
    </>
  );
}
