"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ClipboardCopy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";

type ImageModalProps = {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function ImageModal({
  imageUrl,
  isOpen,
  onClose,
}: ImageModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

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
        title: "Image copied to clipboard",
        description:
          "You can now paste the image directly into QQ or other applications.",
      });
    } catch (error) {
      console.error("Copy to clipboard failed:", error);
      toast({
        title: "Copy to clipboard failed",
        description: "An error occurred while copying the image to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg overflow-hidden shadow-xl max-w-4xl w-full mx-auto"
          >
            <div className="relative max-h-[80vh] flex items-center justify-center">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              )}
              <PhotoProvider>
                <PhotoView src={imageUrl}>
                  <Image
                    src={imageUrl}
                    alt="Full size image"
                    width={1200}
                    height={800}
                    className="object-contain max-w-full max-h-[80vh] w-auto h-auto"
                    onLoadingComplete={() => setIsLoading(false)}
                  />
                </PhotoView>
              </PhotoProvider>

              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-white bg-black bg-opacity-50 hover:bg-opacity-75"
                onClick={onClose}
              >
                <X className="h-6 w-6" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <div className="p-4 bg-gray-100 flex gap-2">
              <Button onClick={handleDownload} className="flex-1">
                <Download className="mr-2 h-4 w-4" /> Download Image
              </Button>
              <Button onClick={handleCopyToClipboard} className="flex-1">
                <ClipboardCopy className="mr-2 h-4 w-4" /> Copy to Clipboard
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
