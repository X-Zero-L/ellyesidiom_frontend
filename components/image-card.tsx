"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Download,
  ClipboardCopy,
  Heart,
  MessageCircle,
  Tag,
  ThumbsDown,
  Share,
  Share2,
} from "lucide-react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import { useToast } from "@/hooks/use-toast";
import "react-photo-view/dist/react-photo-view.css";
import { ImageDetailsModal } from "./image-detail-modal";
import { QQAvatarList } from "./like-avatars";
import { cn } from "@/lib/utils";
import  { ImageDetails }  from "@/app/types/image";

interface ImageCardProps {
  image: ImageDetails;
  user: UserModel;
  onHeightChange: (height: number) => void;
}

interface UserModel {
  user_id: string;
  nickname: string;
  api_key: string | null;
}

export default function ImageCard({
  image,
  user,
  onHeightChange,
}: ImageCardProps) {
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [isHated, setIsHated] = useState(false);
  const [likes, setLikes] = useState(image.likes.length);
  const [hates, setHates] = useState(image.hates.length);
  const [showDetails, setShowDetails] = useState(false);
  const imageUrl = image.image_url;
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      onHeightChange(cardRef.current.offsetHeight);
    }
  }, [onHeightChange]);
  useEffect(() => {
    setIsLiked(image.likes.includes(user.user_id));
    setIsHated(image.hates.includes(user.user_id));
  }, [image.likes, user.user_id]);

  const handleDownload = async () => {
    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: imageUrl }),
      });
      const data = await response.json();
      const blob = new Blob([Buffer.from(data.base64, "base64")], {
        type: "image/png",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "image.png";
      link.click();
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        title: "下载失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const handleShareImage = async () => {
    // 构建分享文本
    const shareText = `来自 EP 的怡言
${image.tags.length > 0 ? '标签: ' + image.tags.join(', ') : ''}
${image.comment.length > 0 ? `评论数: ${image.comment.length}` : ''}
点赞数: ${likes}`;

    if (navigator.share) {
      try {
        const response = await fetch("/api/download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: imageUrl }),
        });
        const data = await response.json();
        const blob = new Blob([Buffer.from(data.base64, "base64")], {
          type: "image/png",
        });
        const file = new File([blob], "ellye_say.png", { type: "image/png" });
        await navigator.share({
          files: [file],
          title: "EP 怡言分享",
          text: shareText,
        });
      } catch (error) {
        console.error("Share failed:", error);
      }
    } else {
      // 如果不支持原生分享，则复制分享文本到剪贴板
      try {
        await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
        toast({
          title: "链接已复制",
          description: "分享链接已复制到剪贴板",
        });
      } catch (error) {
        alert(`${shareText}\n分享链接: ${window.location.href}`);
      }
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: imageUrl }),
      });
      const data = await response.json();
      const blob = await (
        await fetch(`data:image/png;base64,${data.base64}`)
      ).blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      toast({
        title: "图片已复制到剪贴板",
        description: "快粘贴到EP群里分享给大家吧！",
      });
    } catch (error) {
      console.error("Copy to clipboard failed:", error);
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
          description: isLiked
            ? "您已取消对该怡言的点赞"
            : "您已成功点赞该怡言",
        });
        image.likes = isLiked
          ? image.likes.filter((id) => id !== user.user_id)
          : [...image.likes, user.user_id];
      } else {
        throw new Error("Failed to update like status");
      }
    } catch (error: any) {
      console.error("Like/Unlike failed:", error);
      toast({
        title: "操作失败",
        description: `${error.message}`,
        variant: "destructive",
      });
    }
  };
  const buttonVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.1 },
    tap: { scale: 0.95 },
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };
  const handleHate = async () => {
    try {
      if (isLiked && !isHated) {
        throw new Error("你不能同时赞同和踩一个怡言");
      }
      const endpoint = isHated ? "/api/unhate" : "/api/hate";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_hash: image.image_hash }),
      });

      if (response.ok) {
        setIsHated(!isHated);
        setHates(isHated ? hates - 1 : hates + 1);
        toast({
          title: isHated ? "取消踩成功" : "踩成功",
          description: isHated ? "您已取消对该怡言的踩" : "您已成功踩该怡言",
        });
        image.hates = isHated
          ? image.hates.filter((id) => id !== user.user_id)
          : [...image.hates, user.user_id];
      } else {
        throw new Error("Failed to update hate status");
      }
    } catch (error: any) {
      console.error("Hate/Unhate failed:", error);
      toast({
        title: "操作失败",
        description: `${error.message}`,
        variant: "destructive",
      });
    }
  };
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300 }}
      ref={cardRef}
    >
      <Card className="overflow-hidden group relative">
        <CardContent className="p-0">
          <PhotoProvider>
            <PhotoView src={image.image_url}>
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Image
                  src={image.image_url}
                  alt="怡言图片"
                  width={500}
                  height={300}
                  className="w-full h-auto object-cover transition-opacity duration-300 group-hover:opacity-90"
                  onLoad={({ target }) => {
                    const img = target as HTMLImageElement;
                    if (cardRef.current) {
                      onHeightChange(cardRef.current.offsetHeight);
                    }
                  }}
                />
              </motion.div>
            </PhotoView>
          </PhotoProvider>
          <motion.div
            className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <div className="flex justify-between items-center">
              <motion.div className="flex space-x-2" variants={itemVariants}>
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
                            "relative p-2 rounded-full transition-all duration-300 overflow-hidden",
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
                            exit={{ opacity: 0, y: 10 }}
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
                              ? "bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500"
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
                            exit={{ opacity: 0, y: 10 }}
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
                          className="text-white hover:bg-white/20"
                          onClick={() => setShowDetails(true)}
                        >
                          <MessageCircle className="h-5 w-5" />
                          <span className="ml-1">{image.comment.length}</span>
                        </Button>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>显示详情</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </motion.div>
              <motion.div className="flex space-x-2" variants={itemVariants}>
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
                          className="text-white hover:bg-white/20"
                          onClick={handleCopyToClipboard}
                        >
                          <ClipboardCopy className="h-5 w-5" />
                        </Button>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>复制到剪贴板</p>
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
                          className="text-white hover:bg-white/20"
                          onClick={handleShareImage}
                        >
                          <Share2 className="h-5 w-5" />
                        </Button>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>分享图片</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </motion.div>
            </div>
          </motion.div>
          <AnimatePresence>
            {image.under_review && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded"
              >
                未审查
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
        <ImageDetailsModal
          image={image}
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
        />
      </Card>
    </motion.div>
  );
}
