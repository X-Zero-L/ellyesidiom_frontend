"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { UserVoteModel, UserVoteSubmitModel } from "@/app/types/vote";
import confetti from "canvas-confetti";
import { ChevronLeft, Heart, Maximize2 } from 'lucide-react';
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";

export default function VotePage() {
  const [voteData, setVoteData] = useState<UserVoteModel | null>(null);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { toast } = useToast();
  // 如果已经完成投票，直接显示结果
  const fetchIsFinished = async () => {
    try {
      const response = await fetch("/api/vote/finished");
      if (!response.ok) throw new Error("获取投票状态失败");
      const data = await response.json();
      if (data.status === "success" && data.data.finished) {
        setShowResult(true);
      }
    } catch (error) {
      console.error("获取投票状态时出错:", error);
      toast({
        title: "获取投票状态失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };
  useEffect(() => {
    // fetchIsFinished();
    fetchVoteData();
  }, []);
  const fetchVoteData = async () => {
    try {
      const response = await fetch("/api/vote/group");
      if (!response.ok) throw new Error("获取投票数据失败");
      const data: UserVoteModel = (await response.json()).data;
      data.vote_record = [];
      console.log(localStorage.getItem("voteProgress"));
      setVoteData(data);
      if (localStorage.getItem("voteProgress")) {
        const progress = JSON.parse(localStorage.getItem("voteProgress")!);
        const currentVoteCount = progress.vote_record.length;
        const currentGroupIndex = currentVoteCount;
        setVoteData((prevData) => ({
          ...prevData!,
          vote_record: progress.vote_record,
          vote_count: currentVoteCount,
        }));
        setCurrentGroupIndex(currentGroupIndex);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("获取投票数据时出错:", error);
      toast({
        title: "获取投票数据失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const handleVote = async (selectedImageId: string) => {
    if (!voteData) return;

    const updatedVoteRecord = [...voteData.vote_record, selectedImageId];
    const updatedVoteCount = voteData.vote_count + 1;
    const updatedGroupIndex = currentGroupIndex + 1;

    console.log(`当前已投票次数: ${updatedVoteCount}，当前组数: ${updatedGroupIndex}，总组数: ${voteData.vote_list.length}
        本次投票: ${selectedImageId}
        总投票记录: ${updatedVoteRecord.length}
        `);

    setVoteData((prevData) => ({
      ...prevData!,
      vote_record: updatedVoteRecord,
      vote_count: updatedVoteCount,
    }));

    localStorage.setItem(
      "voteProgress",
      JSON.stringify({
        vote_record: updatedVoteRecord,
      })
    );

    if (updatedGroupIndex === voteData.vote_list.length) {
      await submitVotes(updatedVoteRecord);
      setShowResult(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } else {
      setCurrentGroupIndex(updatedGroupIndex);
    }
  };

  const handleUndo = () => {
    if (!voteData || voteData.vote_record.length === 0) return;

    const updatedVoteRecord = voteData.vote_record.slice(0, -1);
    const updatedVoteCount = voteData.vote_count - 1;

    setVoteData((prevData) => ({
      ...prevData!,
      vote_record: updatedVoteRecord,
      vote_count: updatedVoteCount,
    }));
    localStorage.setItem(
      "voteProgress",
      JSON.stringify({
        vote_record: updatedVoteRecord,
      })
    );
    setCurrentGroupIndex((prev) => prev - 1);
  };

  const submitVotes = async (voteRecord: string[]) => {
    console.log("总共有", voteRecord.length, "张图片被投票");
    console.log("投票记录:", voteRecord);
    try {
      const submitData: UserVoteSubmitModel = { record: voteRecord };
      const response = await fetch("/api/vote/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });
      if (!response.ok) throw new Error("提交投票失败");
      const json_data = await response.json();
      if (json_data.status !== "success") throw new Error(json_data.message);
      toast({
        title: "投票成功",
        description: "感谢您的参与！",
      });
      localStorage.removeItem("voteProgress");
    } catch (error) {
      console.error("提交投票时出错:", error);
      toast({
        title: "投票失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const handleContextMenu = (e: React.MouseEvent, imageUrl: string) => {
    e.preventDefault();
    setPreviewImage(imageUrl);
  };

  // const handleImageLoad = (index: number) => {
  //   setImagesLoaded((prev) => {
  //     const newLoaded = [...prev];
  //     newLoaded[index] = true;
  //     return newLoaded;
  //   });
  // };

  // const allImagesLoaded = () => imagesLoaded.every(Boolean);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-purple-500 to-pink-500">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 text-white py-12 px-4">
        <div className="container mx-auto">
          <h1 className="text-5xl font-bold mb-12 text-center">投票结果</h1>
          <p className="text-2xl text-center mb-8">
            感谢您的参与！您的投票已成功提交。
          </p>
        </div>
      </div>
    );
  }

  if (!voteData) return null;

  const currentGroup = voteData.vote_list[currentGroupIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 text-white py-12 px-4">
      <div className="container mx-auto flex flex-col items-center">
        <h1 className="text-5xl font-bold mb-8 text-center">年度怡言投票</h1>
        <p className="text-2xl mb-8 text-center">
          从以下怡言中选择您最喜欢的一张（右键点击查看大图）
        </p>
        <div className="w-full max-w-3xl mb-8">
          <Progress
            value={(voteData.vote_count / voteData.vote_list.length) * 100}
            className="h-3 bg-white bg-opacity-30"
            style={{ "--progress-color": "#ec4899" } as React.CSSProperties}
          />
        </div>
        <p className="text-xl mb-12">
          已完成 {voteData.vote_count} / {voteData.vote_list.length} 次投票
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full max-w-5xl mb-8">
          {currentGroup.map((imageId, index) => (
            <motion.div
              key={imageId}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="relative cursor-pointer group"
              onContextMenu={(e) =>
                handleContextMenu(
                  e,
                  `https://ei-images.hypermax.app/${imageId}.${voteData.ext_info[imageId]}`
                )
              }
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={imageId}
                  className="overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 group-hover:shadow-3xl group-hover:scale-105"
                  onClick={() => handleVote(imageId)}
                  style={{
                    width: "100%",
                    paddingBottom: "100%",
                    position: "relative",
                  }}
                >
                  <Image
                    src={`https://ei-images.hypermax.app/${imageId}.${voteData.ext_info[imageId]}`}
                    alt="怡言图片"
                    layout="fill"
                    objectFit="cover"
                    className="transition-transform duration-300 group-hover:scale-110"
                    // onLoad={() => handleImageLoad(index)}
                  />
                </motion.div>
              </AnimatePresence>
              <PhotoProvider>
                <PhotoView src={`https://ei-images.hypermax.app/${imageId}.${voteData.ext_info[imageId]}`}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="absolute top-2 right-2 w-6 h-6 text-white bg-black bg-opacity-50 rounded-full p-1 transition-opacity opacity-0 group-hover:opacity-100"
                  >
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                  </svg>
                </PhotoView>
              </PhotoProvider>
            </motion.div>
          ))}
        </div>
        <Button
          onClick={handleUndo}
          disabled={voteData.vote_record.length === 0}
          className="mt-4 bg-transparent border border-white text-white hover:bg-white hover:text-purple-600 transition-colors duration-300"
        >
          <ChevronLeft className="mr-2" /> 撤销上一票
        </Button>
      </div>
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-4xl">
            <Image
              src={previewImage}
              alt="预览图片"
              width={1000}
              height={1000}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

