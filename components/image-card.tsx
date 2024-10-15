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
};

type ImageCardProps = {
  image: ImageData;
  onImageClick: (imageUrl: string) => void;
};

export default function ImageCard({ image, onImageClick }: ImageCardProps) {
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
    <Card
      className="overflow-hidden group cursor-pointer relative"
      // onClick={() => onImageClick(image.image_url)}
    >
      <CardContent className="p-0 relative">
        <PhotoProvider>
          <PhotoView src={image.image_url}>
            <div>
              <img
                src={image.image_url}
                alt="Gallery Image"
                width={500}
                height={300}
                className="object-cover"
              />
              <motion.div
                className="absolute inset-0 bg-black bg-opacity-60 flex flex-col justify-end p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
              >
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
                    <h3 className="text-sm font-semibold mb-1">Comments:</h3>
                    <ul className="list-disc list-inside">
                      {image.comment.map((comment, index) => (
                        <li key={index} className="text-sm">
                          {comment}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {image.catalogue.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Catalogue:</h3>
                    <ul className="list-disc list-inside">
                      {image.catalogue.map((item, index) => (
                        <li key={index} className="text-sm">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-300">
                  上传时间: {new Date(image.timestamp).toLocaleString()}
                </div>
              </motion.div>
            </div>
          </PhotoView>
        </PhotoProvider>
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
        </div>
        {image.under_review && (
          <div className="absolute bottom-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
            未审查
          </div>
        )}
      </CardContent>
    </Card>
  );
}
