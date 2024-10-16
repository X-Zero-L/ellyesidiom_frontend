"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, MoreHorizontal, Tag, List } from "lucide-react";
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

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch("/api/admin/review");
        if (response.ok) {
          const data = await response.json();
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

    fetchImages();
  }, [router, toast]);

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
    setImages((prevImages) =>
      prevImages.filter((image) => image.image_hash !== imageHash)
    );
  };

  const handleReject = async (imageHash: string) => {
    console.log("Rejecting image:", imageHash);
    toast({
      title: "不准删除！",
      description: `不准删除！`,
    });
  };

  const handleEditCatalogue = (image: ImageData) => {
    setEditingImage(image);
  };

  const handleCloseEditDialog = async () => {
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
        description: "Failed to update image info, because of error: " + error,
        variant: "destructive",
      });
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
        <h1 className="text-2xl font-bold">待审核图片</h1>
        <Button onClick={handleLogout}>登出</Button>
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
                <p className="text-sm text-gray-600">
                  目录: {image.catalogue.join(", ")}
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleApprove(image.image_hash)}
                >
                  <Check className="w-4 h-4 mr-1" /> 通过
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleReject(image.image_hash)}
                >
                  <X className="w-4 h-4 mr-1" /> 拒绝
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
        />
      )}
    </div>
  );
}
