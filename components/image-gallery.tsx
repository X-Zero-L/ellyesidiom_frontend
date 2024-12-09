"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Search, Shuffle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ImageCard from "./image-card";
import ImageModal from "./image-modal";
import { Toaster } from "./ui/toaster";
import { useUser } from "@/app/contexts/UserContext";
import { MasonryGrid } from "./masonry-grid";
import { DynamicBackground } from "./dynamic-background";
import { ScrollToTop } from "./scroll-to-top";
import { ToolBar } from "./tool-bar";
import { ImageDetails } from "@/app/types/image";
export default function ImageGallery() {
  const [images, setImages] = useState<ImageDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [randomCount, setRandomCount] = useState("5");
  const [currentPage, setCurrentPage] = useState<"index" | "search" | "random">(
    "index"
  );
  const { user } = useUser();
  const observerTarget = useRef(null);

  const fetchImages = useCallback(
    async (
      url: string,
      payload: { keyword: string } | { count: number } | null = null,
      isAdd = false
    ) => {
      if (isAdd) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error("获取图片失败");
        }
        const data = await response.json();
        if (data.status === "no result") {
          setError("没有找到匹配的结果，请尝试其他关键词。");
          return;
        }
        if (isAdd) {
          setImages((prevImages) => [...prevImages, ...data.data]);
        } else {
          setImages(data.data);
        }
      } catch (err) {
        setError("获取图片时发生错误。请稍后再试。");
        console.error("获取图片失败:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchImages("/api/index");
  }, [fetchImages]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && !loading) {
          handleLoadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [loadingMore, loading]);

  const handleSearch = useCallback(() => {
    if (searchKeyword.trim()) {
      setCurrentPage("search");
      fetchImages(`/api/search`, { keyword: searchKeyword });
    }
  }, [searchKeyword, fetchImages]);

  const handleRandom = useCallback(() => {
    setCurrentPage("random");
    fetchImages(`/api/random?count=${randomCount}`, {
      count: parseInt(randomCount),
    });
  }, [randomCount, fetchImages]);

  const handleImageClick = useCallback((imageUrl: string) => {
    setSelectedImage(imageUrl);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedImage(null);
  }, []);

  const handleLoadMore = useCallback(async () => {
    await fetchImages(`/api/random?count=6`, { count: 6 }, true);
  }, [fetchImages]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <div className="flex-1 flex gap-2">
            <Input
              type="text"
              placeholder="搜索关键词..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" /> 搜索
            </Button>
          </div>
          <div className="flex gap-2">
            <Select value={randomCount} onValueChange={setRandomCount}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="数量" />
              </SelectTrigger>
              <SelectContent>
                {[1, 5, 10, 15, 20, 25].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleRandom}>
              <Shuffle className="mr-2 h-4 w-4" /> 随机
            </Button>
          </div>
        </motion.div>
        <AnimatePresence>
          {loading && images.length === 0 ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-64"
            >
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center text-red-500 p-4 bg-red-100 rounded-md"
            >
              {error}
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <MasonryGrid
                items={images}
                columnWidth={300}
                renderItem={(image, index, onHeightChange) => (
                  <motion.div
                    key={`${image.image_hash}-${index}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ImageCard
                      image={image}
                      user={user}
                      onHeightChange={onHeightChange}
                    />
                  </motion.div>
                )}
              />
              <motion.div
                ref={observerTarget}
                className="h-20 mt-8 flex justify-center items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: loadingMore ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {loadingMore && (
                  <motion.div
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                  >
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <ImageModal
          imageUrl={selectedImage || ""}
          isOpen={!!selectedImage}
          onClose={handleCloseModal}
        />
        <Toaster />
        <ToolBar />
      </div>
    </>
  );
}
