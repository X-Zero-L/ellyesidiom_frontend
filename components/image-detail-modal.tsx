import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  ThumbsUp,
  MessageSquare,
  Calendar,
  Hash,
  Heart,
  MessageCircle,
  User,
} from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">怡言详情</DialogTitle>
        </DialogHeader>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid md:grid-cols-2 gap-6"
        >
          <div className="relative aspect-square overflow-hidden rounded-lg">
            <Image
              src={image.image_url}
              alt="怡言图片"
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 hover:scale-105"
            />
          </div>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  发布时间
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {new Date(image.timestamp).toLocaleString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <Hash className="mr-2 h-5 w-5" />
                  怡言ID
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {image.image_url.split("/").pop()?.split(".")[0]}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  上传者
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {image.uploader.nickname !== "UNK"
                    ? `${image.uploader.nickname} (${image.uploader.id})`
                    : "管理员导入"}
                </p>
              </div>
              {image.catalogue.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">所属怡批</h3>
                  <div className="flex flex-wrap gap-2">
                    {image.catalogue.map((cat, index) => (
                      <Badge key={index} variant="secondary">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {image.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {image.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <Heart className="mr-2 h-5 w-5" />
                  点赞数
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {image.likes.length}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <ThumbsUp className="mr-2 h-5 w-5" />
                  点踩数
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {image.hates.length}
                </p>
              </div>
              {image.comment.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    评论 ({image.comment.length})
                  </h3>
                  <ul className="space-y-2">
                    {image.comment.map((comment, index) => (
                      <li
                        key={index}
                        className="bg-gray-100 dark:bg-gray-700 p-2 rounded"
                      >
                        {comment}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </ScrollArea>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
