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
  Info,
  Copy,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
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
import { EditStringListDialog } from "@/components/edit-strings-dialog";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

type DuplicateImage = {
  duplicate_idiom_hash: string;
  duplicate_idiom_ext: string;
  score: number;
  score_threshold: number;
};

export default function AdminReview() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingImage, setEditingImage] = useState<ImageData | null>(null);
  const [editingImageTags, setEditingImageTags] = useState<ImageData | null>(
    null
  );
  const [editingImageComment, setEditingImageComment] =
    useState<ImageData | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isUnderReview, setIsUnderReview] = useState(true);
  const [limit, setLimit] = useState("100");
  const [duplicates, setDuplicates] = useState<DuplicateImage[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [needFetchUpdatedImageInfo, setNeedFetchUpdatedImageInfo] =
    useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const duplicatesPerPage = 9;
  const [catalogueData, setCatalogueData] = useState<{
    [key: string]: string[];
  }>({});
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [needUpdatedDuplicates, setNeedUpdatedDuplicates] = useState(false);

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
  const indexOfLastDuplicate = currentPage * duplicatesPerPage;
  const indexOfFirstDuplicate = indexOfLastDuplicate - duplicatesPerPage;
  const currentDuplicates = duplicates.slice(
    indexOfFirstDuplicate,
    indexOfLastDuplicate
  );
  const totalPages = Math.ceil(duplicates.length / duplicatesPerPage);

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
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

  const handleDelete = async (imageHash: string) => {
    console.log("Deleting image:", imageHash);
    const response = await fetch(`/api/admin/delete?image_hash=${imageHash}`);
    if (!response.ok || (await response.json()).message !== "ok") {
      toast({
        title: "错误",
        description: "删除失败，请重试。（应该没用）",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "删除成功",
      description: `图片 ${imageHash} 的记录已被删除！`,
    });
    setImages((prevImages) =>
      prevImages.filter((image) => image.image_hash !== imageHash)
    );
  };

  const handleEditCatalogue = (image: ImageData) => {
    setEditingImage(image);
  };

  const fetchImageInfo = async (imageHash: string) => {
    try {
      const response = await fetch(
        `/api/admin/image_info?image_hash=${imageHash}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch image info");
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Error fetching image info:", error);
      toast({
        title: "Error",
        description: "Failed to fetch image info. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchAndSetImageInfo = async (imageHash: string) => {
    const updatedImageInfo = await fetchImageInfo(imageHash);
    if (updatedImageInfo) {
      setImages((prevImages) =>
        prevImages.map((image) =>
          image.image_hash === imageHash
            ? { ...image, ...updatedImageInfo }
            : image
        )
      );
    }
  };

  const handleCloseEditDialog = async () => {
    setEditingImage(null);
  };

  const handleCloseTagDialog = async () => {
    setEditingImageTags(null);
  };

  const handleCloseCommentDialog = async () => {
    setEditingImageComment(null);
  };

  const handleCheckDuplicates = async (imageHash: string) => {
    setCheckingDuplicates(true);
    try {
      const response = await fetch(
        `/api/admin/dedup/check?image_hash=${imageHash}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.data.dedup_list.length === 0) {
          toast({
            title: "无重复",
            description: "没有发现重复图片。",
          });
        }
        setDuplicates(data.data.dedup_list || []);
      } else {
        throw new Error("Failed to check duplicates");
      }
    } catch (error) {
      console.error("Error checking duplicates:", error);
      toast({
        title: "Error",
        description: "Failed to check duplicates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCheckingDuplicates(false);
    }
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
          <Card
            key={image.image_hash}
            className="overflow-hidden flex flex-col h-full"
          >
            <CardContent className="p-0 flex-grow">
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
                <p className="text-sm text-gray-600">
                  图片ID: {image.image_hash}
                </p>
                <p className="text-sm text-gray-600">
                  {image.uploader.nickname !== "UNK"
                    ? `上传怡批: ${image.uploader.nickname} (${image.uploader.id})`
                    : "管理员导入"}
                </p>
                {image.catalogue.length > 0 && (
                  <p className="text-sm text-gray-600 mt-auto">
                    所属怡批:{" "}
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
                  <Copy className="w-4 h-4 mr-1" /> 打回
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setImageToDelete(image.image_hash)}
                >
                  <X className="w-4 h-4 mr-1" /> 删除
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCheckDuplicates(image.image_hash)}
                >
                  <Shuffle className="w-4 h-4 mr-1" /> 查重
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
                  <DropdownMenuItem onClick={() => setEditingImageTags(image)}>
                    <Tag className="w-4 h-4 mr-2" /> 编辑标签
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setEditingImageComment(image)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" /> 编辑评论
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedImage(image)}>
                    <Info className="w-4 h-4 mr-2" /> 详情
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
          onUpdate={fetchAndSetImageInfo}
        />
      )}
      {editingImageTags && (
        <EditStringListDialog
          isOpen={!!editingImageTags}
          onClose={handleCloseTagDialog}
          imageHash={editingImageTags.image_hash}
          displayString="tags"
          currentStrings={editingImageTags.tags}
          setNeedFetchUpdatedImageInfo={setNeedFetchUpdatedImageInfo}
          onUpdate={fetchAndSetImageInfo}
        />
      )}
      {editingImageComment && (
        <EditStringListDialog
          isOpen={!!editingImageComment}
          onClose={handleCloseCommentDialog}
          imageHash={editingImageComment.image_hash}
          displayString="comment"
          currentStrings={editingImageComment.comment}
          setNeedFetchUpdatedImageInfo={setNeedFetchUpdatedImageInfo}
          onUpdate={fetchAndSetImageInfo}
        />
      )}
      {selectedImage && (
        <Dialog
          open={!!selectedImage}
          onOpenChange={() => setSelectedImage(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>图片详情</DialogTitle>
            </DialogHeader>
            <div className="mt-2">
              <h3 className="font-semibold">OCR 结果:</h3>
              <p>{selectedImage?.ocr_text.join(", ")}</p>
            </div>
            <div className="mt-2">
              <h3 className="font-semibold">标签:</h3>
              <p>{selectedImage?.tags.join(", ") || "无标签"}</p>
            </div>
            <div className="mt-2">
              <h3 className="font-semibold">评论:</h3>
              <p>{selectedImage?.comment.join(", ") || "无评论"}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {checkingDuplicates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}
      {duplicates.length > 0 && (
        <Dialog
          open={duplicates.length > 0}
          onOpenChange={() => setDuplicates([])}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>重复图片检查结果</DialogTitle>
            </DialogHeader>
            {checkingDuplicates ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : duplicates.length === 0 ? (
              <p>没有发现重复图片。</p>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {currentDuplicates.map((duplicate) => (
                    <div
                      key={duplicate.duplicate_idiom_hash}
                      className="border rounded p-2"
                    >
                      <Card className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="relative aspect-video">
                            <PhotoProvider>
                              <PhotoView
                                src={`https://ei-images.hypermax.app/${duplicate.duplicate_idiom_hash}.${duplicate.duplicate_idiom_ext}`}
                              >
                                <Image
                                  src={`https://ei-images.hypermax.app/${duplicate.duplicate_idiom_hash}.${duplicate.duplicate_idiom_ext}`}
                                  alt="Duplicate image"
                                  layout="fill"
                                  objectFit="cover"
                                  className="bg-black bg-opacity-60 opacity-100 hover:opacity-80 transition-opacity duration-300"
                                />
                              </PhotoView>
                            </PhotoProvider>
                          </div>
                        </CardContent>
                      </Card>
                      <p className="text-sm mt-2">
                        图片ID: {duplicate.duplicate_idiom_hash}
                      </p>
                      <p className="text-sm mt-2">
                        重复度: {duplicate.score}/{duplicate.score_threshold}
                      </p>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={() => {
                          /*handleDelete(duplicate.duplicate_idiom_hash);
                          setDuplicates((prevDuplicates) =>
                            prevDuplicates.filter(
                              (dup) =>
                                dup.duplicate_idiom_hash !==
                                duplicate.duplicate_idiom_hash
                            )
                          );
                          */
                          setImageToDelete(duplicate.duplicate_idiom_hash);
                          setNeedUpdatedDuplicates(true);
                        }}
                      >
                        删除重复
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4">
                  <Button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" /> 上一页
                  </Button>
                  <span>
                    第 {currentPage} 页，共 {totalPages} 页
                  </span>
                  <Button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    下一页 <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
      {imageToDelete && (
        <Dialog
          open={!!imageToDelete}
          onOpenChange={() => setImageToDelete(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>你确定吗</DialogTitle>
            </DialogHeader>
            <p>确定删除图片 {imageToDelete} 吗？</p>
            <DialogFooter>
              <Button onClick={() => setImageToDelete(null)} variant="outline">
                再想想
              </Button>
              <Button
                onClick={() => {
                  handleDelete(imageToDelete);
                  setImageToDelete(null);
                  if (needUpdatedDuplicates) {
                    setNeedUpdatedDuplicates(false);
                    setDuplicates((prevDuplicates) =>
                      prevDuplicates.filter(
                        (dup) => dup.duplicate_idiom_hash !== imageToDelete
                      )
                    );
                  }
                }}
                variant="destructive"
              >
                我确定
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
