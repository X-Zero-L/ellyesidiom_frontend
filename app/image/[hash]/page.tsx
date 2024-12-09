'use client';

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  Calendar,
  Hash,
  Heart,
  MessageCircle,
  User,
  ThumbsDown,
  Share2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, isToday, isYesterday } from "date-fns";
import { zhCN } from "date-fns/locale";
import { AvatarGroup } from "@/components/avatar-group";
import { ImageDetails } from "@/app/types/image";
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PhotoProvider, PhotoView } from "react-photo-view";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function ImagePage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const imageDataStr = searchParams.get('data');
  const [isLiked, setIsLiked] = useState(false);
  const [isHated, setIsHated] = useState(false);
  const [likes, setLikes] = useState(0);
  const [hates, setHates] = useState(0);
  
  if (!imageDataStr) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">无效的图片详情</h1>
          <p className="text-muted-foreground">无法加载图片详情。请从主页访问。</p>
        </div>
      </div>
    );
  }

  const image: ImageDetails = JSON.parse(decodeURIComponent(imageDataStr));

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return `今天 ${format(date, "HH:mm")}`;
    }
    if (isYesterday(date)) {
      return `昨天 ${format(date, "HH:mm")}`;
    }
    return format(date, "yyyy年MM月dd日 HH:mm", { locale: zhCN });
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "链接已复制",
        description: "分享链接已复制到剪贴板",
      });
    } catch (error) {
      toast({
        title: "复制失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const handleLike = async () => {
    try {
      if (isHated && !isLiked) {
        throw new Error("你不能同时赞同和踩一个怡言");
      }
      const endpoint = isLiked ? "/api/unlike" : "/api/like";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_hash: image.image_hash }),
      });

      if (response.ok) {
        setIsLiked(!isLiked);
        setLikes(isLiked ? likes - 1 : likes + 1);
        toast({
          title: isLiked ? "取消点赞成功" : "点赞成功",
          description: isLiked ? "您已取消对该怡言的点赞" : "您已成功点赞该怡言",
        });
      }
    } catch (error: any) {
      toast({
        title: "操作失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleHate = async () => {
    // 与 ImageCard 中相同的 handleHate 逻辑
  };

  const handleShareImage = async () => {
    // 与 ImageCard 中相同的 handleShareImage 逻辑
  };

  const buttonVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.1 },
    tap: { scale: 0.95 },
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <motion.div 
          className="max-w-6xl mx-auto space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* 头部信息 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={`https://q1.qlogo.cn/g?b=qq&nk=${image.uploader.id}&s=100`}
                  alt={image.uploader.nickname}
                />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-medium">{image.uploader.nickname}</h2>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{formatTimestamp(image.timestamp)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "relative p-2 rounded-full transition-all duration-300",
                          isLiked
                            ? "bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500"
                            : "bg-gray-200 dark:bg-gray-700"
                        )}
                        onClick={handleLike}
                      >
                        <Heart
                          className={cn(
                            "h-5 w-5 transition-all duration-300",
                            isLiked
                              ? "text-white fill-white"
                              : "text-gray-600 dark:text-gray-300"
                          )}
                        />
                        <motion.span
                          className="ml-1"
                          key={likes}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          {likes}
                        </motion.span>
                      </Button>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isLiked ? "不再赞同" : "深表赞同"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "p-2 rounded-full transition-all duration-300",
                          isHated
                            ? "bg-gradient-to-r from-red-500 via-yellow-500 to-purple-500"
                            : "bg-gray-200 dark:bg-gray-700"
                        )}
                        onClick={handleHate}
                      >
                        <ThumbsDown
                          className={cn(
                            "h-5 w-5 transition-all duration-300",
                            isHated
                              ? "text-white fill-white"
                              : "text-gray-500"
                          )}
                        />
                        <motion.span
                          className="ml-1"
                          key={hates}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          {hates}
                        </motion.span>
                      </Button>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isHated ? "不够垃圾" : "垃圾怡言"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button variant="outline" size="sm" onClick={handleShareImage}>
                <Share2 className="h-4 w-4 mr-2" />
                分享
              </Button>
            </div>
          </div>

          {/* 主要内容区 */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* 图片区域 */}
            <div className="lg:col-span-3 space-y-6">
              <PhotoProvider>
                <PhotoView src={image.image_url}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="relative aspect-[4/3] rounded-lg overflow-hidden bg-black/5 cursor-zoom-in"
                  >
                    <Image
                      src={image.image_url}
                      alt="怡言图片"
                      layout="fill"
                      objectFit="contain"
                      priority
                      className="transition-transform duration-300"
                    />
                    <AnimatePresence>
                      {image.under_review && (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm"
                        >
                          未审查
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </PhotoView>
              </PhotoProvider>

              {/* 评论区域 */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>评论</span>
                  <span className="text-muted-foreground text-sm">({image.comment.length})</span>
                </h3>
                <div className="space-y-4">
                  {image.comment.map((comment, index) => (
                    <div 
                      key={index} 
                      className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      {comment}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 侧边信息栏 */}
            <div className="lg:col-span-2">
              <div className="sticky top-4 space-y-6">
                {/* 标签 */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <Hash className="h-5 w-5" />
                    <span>标签</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {image.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* 互动信息 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 p-4 rounded-lg bg-muted/30">
                    <AvatarGroup icon={Heart} title="喜欢" items={image.likes} />
                  </div>

                  <div className="space-y-2 p-4 rounded-lg bg-muted/30">
                    <AvatarGroup icon={ThumbsDown} title="讨厌" items={image.hates} />
                  </div>
                </div>

                {/* 所属怡批 */}
                <div className="space-y-3 p-4 rounded-lg bg-muted/30">
                  <AvatarGroup icon={User} title="所属怡批" items={image.catalogue_raw} />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}