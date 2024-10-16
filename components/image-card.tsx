"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tag,
  MessageCircle,
  Layers,
  Download,
  ClipboardCopy,
  MoreVertical,
} from "lucide-react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import { useToast } from "@/hooks/use-toast";
import "react-photo-view/dist/react-photo-view.css";
import { useState } from "react";
import { Button } from "./ui/button";
import { text } from "stream/consumers";

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
};

type ImageCardProps = {
  image: ImageData;
};

export default function ImageCard({ image }: ImageCardProps) {
  const { toast } = useToast();
  const [showTools, setShowTools] = useState(false);
  const imageUrl = image.image_url;
  const handleDownload = async () => {
    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: imageUrl }),
      });
      const data = await response.json();
      const base64 = data.base64;
      const blob = new Blob([Buffer.from(base64, "base64")], {
        type: "image/png",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "image.png";
      link.click();
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: imageUrl }),
      });
      const data = await response.json();
      const base64 = data.base64;
      const blob = await (
        await fetch(`data:image/png;base64,${base64}`)
      ).blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      toast({
        title: "图片已复制到剪贴板",
        description: "快粘贴到EP群里分享给大家吧！",
      });
    } catch (error) {
      console.error("Copy to clipboard failed:", error);
      toast({
        title: "图片复制失败",
        description: "请重试",
        variant: "destructive",
      });
    }
  };
  return (
    <div>
      <Card
        className="overflow-hidden"
        // onClick={() => onImageClick(image.image_url)}
      >
        <CardContent className="p-0">
          <PhotoProvider>
            <PhotoView src={image.image_url}>
              <img
                src={image.image_url}
                alt="Gallery Image"
                width={500}
                height={300}
                className="object-cover bg-black bg-opacity-60 opacity-100 hover:opacity-80 transition-opacity duration-300"
              />
            </PhotoView>
          </PhotoProvider>
          <div className="p-4">
            <p className="text-sm text-gray-500 mb-2">
              {new Date(image.timestamp).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">
              图片ID: {image.image_url.split("/").pop()?.split(".")[0]}
            </p>
            {image.uploader.nickname !== "UNK" ? (
              <p className="text-sm text-gray-600">
                上传怡批: {image.uploader.nickname} ({image.uploader.id})
              </p>
            ) : (
              <p className="text-sm text-gray-600">管理员导入</p>
            )}
            {image.catalogue.length > 0 && (
              <p className="text-sm text-gray-600 mt-auto">
                所属怡批:
                {image.catalogue.join(", ")}
              </p>
            )}
            <div className="absolute top-2 right-2 flex gap-2">
              <Button
                className="text-white bg-black bg-opacity-50 hover:bg-opacity-75 p-2 rounded-full"
                onClick={handleDownload}
              >
                <Download className="h-6 w-6" />
              </Button>
              <Button
                className="text-white bg-black bg-opacity-50 hover:bg-opacity-75 p-2 rounded-full"
                onClick={handleCopyToClipboard}
              >
                <ClipboardCopy className="h-6 w-6" />
              </Button>
              {image.tags.length > 0 && (
                <div className="mb-2">
                  <h3 className="text-sm font-semibold mb-1">Tags:</h3>
                  <div className="flex flex-wrap gap-1">
                    {image.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-white/20"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {image.comment.length > 0 && (
                <div className="mb-2">
                  <h3 className="text-sm font-semibold mb-1">评论：</h3>
                  <ul className="list-disc list-inside">
                    {image.comment.map((comment, index) => (
                      <li key={index} className="text-sm">
                        {comment}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {image.under_review && (
              <div className="absolute bottom-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                未审查
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
