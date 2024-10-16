"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Check,
  X,
  MoreHorizontal,
  Tag,
  List,
  Search,
  Shuffle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import { Toaster } from "@/components/ui/toaster";
import { EditCatalogueDialog } from "@/components/edit-cat-dialog";
import { Input } from "@/components/ui/input";

type ImageData = {
  tags: string[];
  image_hash: string;
  image_ext: string;
  ocr_text: string[];
  ocr_method: string;
  uploader: {
    nickname: string;
    id: string;
    platform: string;
  };
  under_review: boolean;
  comment: string[];
  catalogue: string[];
  timestamp: string;
};

export default function AdminReview() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingImage, setEditingImage] = useState<ImageData | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isUnderReview, setIsUnderReview] = useState(true);
  const [limit, setLimit] = useState("100");
  const [needFetchUpdatedImageInfo, setNeedFetchUpdatedImageInfo] =
    useState(false);
  const [catalogueData, setCatalogueData] = useState<{
    [key: string]: string[];
  }>({});
  const fetchCatalogueData = async () => {
    try {
      const response = await fetch("/api/admin/cats");
      if (response.ok) {
        const data = await response.json();
        setCatalogueData(data.data);
      } else {
        throw new Error("Failed to fetch catalogue data");
      }
    } catch (error) {
      console.error("Error fetching catalogue data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch catalogue data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchImages = async (initialLoad = false) => {
    try {
      const payload: {
        keyword?: string;
        under_review?: boolean;
        limit?: number;
      } = {};
      if (initialLoad) {
        payload.under_review = true;
      } else {
        if (searchKeyword) {
          payload.keyword = searchKeyword;
        }
        if (isUnderReview) {
          payload.under_review = isUnderReview;
        } else {
          payload.under_review = false;
        }
        if (limit) {
          payload.limit = parseInt(limit);
        }
      }
      const response = await fetch("/api/admin/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.data.length === 0 || Object.keys(data.data).length === 0) {
          toast({
            title: "Error",
            description:
              "No result found for the search keyword, please try another one.",
            variant: "destructive",
          });
          return;
        }
        setImages(data.data);
      } else if (response.status === 401) {
        router.push("/admin/login");
      } else {
        throw new Error("Failed to fetch images");
      }
    } catch (error) {
      console.error("Error fetching images:", error);
      toast({
        title: "Error",
        description: "Failed to fetch images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
    fetchCatalogueData();
  }, [router, toast]);

  const handleSearch = () => {
    fetchImages();
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (response.ok) {
        router.push("/admin/login");
      } else {
        throw new Error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleApprove = async (imageHash: string) => {
    // Implement approve logic here
    console.log("Approving image:", imageHash);
    // post to /api/admin/review, image_hash, under_review = false
    const response = await fetch("/api/admin/review", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image_hash: imageHash, under_review: false }),
    });
    if (!response.ok || (await response.json()).message !== "ok") {
      toast({
        title: "Error",
        description: "Failed to approve image. Please try again.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "通过！",
      description: `图片 ${imageHash} 已通过审核！`,
    });
    /*setImages((prevImages) =>
      prevImages.filter((image) => image.image_hash !== imageHash)
    );*/
    // 改为更新对应图片的 under_review 字段
    setImages((prevImages) =>
      prevImages.map((image) =>
        image.image_hash === imageHash
          ? { ...image, under_review: false }
          : image
      )
    );
  };

  const handleReject = async (imageHash: string) => {
    console.log("Rejecting image:", imageHash);
    /*toast({
      title: "不准删除！",
      description: `不准删除！`,
    });*/
    const response = await fetch("/api/admin/review", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image_hash: imageHash, under_review: true }),
    });
    if (!response.ok || (await response.json()).message !== "ok") {
      toast({
        title: "Error",
        description: "Failed to reject image. Please try again.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "打回！",
      description: `图片 ${imageHash} 已打回！`,
    });
    setImages((prevImages) =>
      prevImages.map((image) =>
        image.image_hash === imageHash
          ? { ...image, under_review: true }
          : image
      )
    );
  };

  const handleEditCatalogue = (image: ImageData) => {
    setEditingImage(image);
  };

  const handleCloseEditDialog = async () => {
    if (needFetchUpdatedImageInfo) {
      try {
        if (editingImage) {
          const response = await fetch(
            `/api/admin/image_info?image_hash=${editingImage.image_hash}`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch image info");
          }
          const data = await response.json();
          setImages((prevImages) =>
            prevImages.map((image) =>
              image.image_hash === editingImage.image_hash ? data.data : image
            )
          );
        }
      } catch (error) {
        console.error("Error updating image info:", error);
        toast({
          title: "Error",
          description:
            "Failed to update image info, because of error: " + error,
          variant: "destructive",
        });
      }
      setNeedFetchUpdatedImageInfo(false);
    }
    setEditingImage(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">怡闻录管理</h1>
        <Button onClick={handleLogout}>登出</Button>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
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
          <Button
            onClick={() => setIsUnderReview(!isUnderReview)}
            variant={isUnderReview ? "default" : "outline"}
          >
            <Tag className="mr-2 h-4 w-4" />{" "}
            {isUnderReview ? "未审核" : "已审核"}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image) => (
          <Card key={image.image_hash} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-video">
                <PhotoProvider>
                  <PhotoView
                    src={`https://ei-images.hypermax.app/${image.image_hash}.${image.image_ext}`}
                  >
                    <Image
                      src={`https://ei-images.hypermax.app/${image.image_hash}.${image.image_ext}`}
                      alt="Review image"
                      layout="fill"
                      objectFit="cover"
                      className="bg-black bg-opacity-60 opacity-100 hover:opacity-80 transition-opacity duration-300"
                    />
                  </PhotoView>
                </PhotoProvider>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-500 mb-2">
                  {new Date(image.timestamp).toLocaleString()}
                </p>
                <p className="font-semibold mb-2">
                  {image.ocr_text.join(", ")}
                </p>
                <p className="text-sm text-gray-600">
                  上传者: {image.uploader.nickname} ({image.uploader.platform})
                </p>
                {image.catalogue.length > 0 && (
                  <p className="text-sm text-gray-600">
                    所属ep:{" "}
                    {image.catalogue
                      .map((cat) => {
                        for (const [key, values] of Object.entries(
                          catalogueData
                        )) {
                          if (key === cat) {
                            return values[0];
                          }
                        }
                        return cat;
                      })
                      .join(", ")}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleApprove(image.image_hash)}
                  disabled={!image.under_review}
                >
                  <Check className="w-4 h-4 mr-1" /> 通过
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleReject(image.image_hash)}
                  disabled={image.under_review}
                >
                  <X className="w-4 h-4 mr-1" /> 打回
                </Button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditCatalogue(image)}>
                    <List className="w-4 h-4 mr-2" /> 编辑怡批
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardFooter>
          </Card>
        ))}
      </div>
      <Toaster />
      {editingImage && (
        <EditCatalogueDialog
          isOpen={!!editingImage}
          onClose={handleCloseEditDialog}
          imageHash={editingImage.image_hash}
          currentCatalogue={editingImage.catalogue}
          catalogueData={catalogueData}
          setNeedFetchUpdatedImageInfo={setNeedFetchUpdatedImageInfo}
        />
      )}
    </div>
  );
}
