import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  ThumbsUp,
  ThumbsDown,
  Calendar,
  Hash,
  Heart,
  MessageCircle,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, isToday, isYesterday } from "date-fns";
import { zhCN } from "date-fns/locale";
import { PhotoView, PhotoProvider } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
type ImageData = {
  tags: string[];
  image_url: string;
  comment: string[];
  catalogue: string[];
  under_review: boolean;
  timestamp: string;
  uploader: {
    nickname: string;
    id: string;
    platform: string;
  };
  likes: string[];
  hates: string[];
};

type ImageDetailsModalProps = {
  image: ImageData;
  isOpen: boolean;
  onClose: () => void;
};

export function ImageDetailsModal({
  image,
  isOpen,
  onClose,
}: ImageDetailsModalProps) {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-full md:max-w-5xl p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-0">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl font-bold">
                  怡言详情
                </DialogTitle>
              </div>
            </DialogHeader>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col md:grid md:grid-cols-2 gap-6 p-6"
            >
              <div className="relative w-full h-64 md:h-auto overflow-hidden rounded-lg shadow-lg">
                <PhotoProvider>
                  <PhotoView src={image.image_url}>
                    <Image
                      src={image.image_url}
                      alt="怡言图片"
                      layout="fill"
                      objectFit="cover"
                      className="transition-transform duration-300 hover:scale-105"
                    />
                  </PhotoView>
                </PhotoProvider>
              </div>
              <ScrollArea className="h-64 md:h-[80vh] pr-4">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">{image.comment}</h2>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-2">
                        <Avatar>
                          <AvatarImage
                            src={`https://q1.qlogo.cn/g?b=qq&nk=${image.uploader.id}&s=100`}
                            alt={image.uploader.nickname}
                          />
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <span>{image.uploader.nickname}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatTimestamp(image.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold flex items-center space-x-2">
                      <Hash className="h-5 w-5" />
                      <span>标签</span>
                    </h3>
                    <div className="flex flex-wrap space-x-2">
                      {image.tags.map((tag, index) => (
                        <Badge key={index}>{tag}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold flex items-center space-x-2">
                      <Heart className="h-5 w-5" />
                      <span>喜欢</span>
                      <span>{image.likes.length}</span>
                    </h3>
                    <div className="flex items-center">
                      <div className="flex -space-x-2">
                        {image.likes.slice(0, 5).map((like, index) => (
                          <Avatar
                            key={index}
                            className="border-2 border-background"
                          >
                            <AvatarImage
                              src={`https://q1.qlogo.cn/g?b=qq&nk=${like}&s=100`}
                              alt={like}
                            />
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                        ))}
                        {image.likes.length > 5 && (
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground text-sm font-medium border-2 border-background">
                            +{image.likes.length - 5}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold flex items-center space-x-2">
                      <ThumbsDown className="h-5 w-5" />
                      <span>讨厌</span>
                      <span>{image.hates.length}</span>
                    </h3>
                    <div className="flex items-center">
                      <div className="flex -space-x-2">
                        {image.hates.slice(0, 5).map((hate, index) => (
                          <Avatar
                            key={index}
                            className="border-2 border-background"
                          >
                            <AvatarImage
                              src={`https://q1.qlogo.cn/g?b=qq&nk=${hate}&s=100`}
                              alt={hate}
                            />
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                        ))}
                        {image.hates.length > 5 && (
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground text-sm font-medium border-2 border-background">
                            +{image.hates.length - 5}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold flex items-center space-x-2">
                      <MessageCircle className="h-5 w-5" />
                      <span>评论</span>
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span>{image.comment.length}</span>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}

function InfoSection({
  icon: Icon,
  title,
  children,
}: {
  icon?: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold flex items-center space-x-2">
        {Icon && <Icon className="h-5 w-5" />}
        <span>{title}</span>
      </h3>
      <div className="text-gray-600 dark:text-gray-300">{children}</div>
    </div>
  );
}
