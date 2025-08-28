"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  X, 
  Plus, 
  Image as ImageIcon, 
  Loader2,
  Check,
  AlertCircle,
  FileImage,
  Sparkles,
  ImagePlus,
  FolderOpen,
  Hash,
  MessageSquare,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { EPSelectorGrid } from "./ep-selector-grid";

interface UploadDialogProps {
  trigger?: React.ReactNode;
  onUploadSuccess?: (data: any) => void;
}

interface FileWithPreview extends File {
  preview?: string;
}

interface CatalogueOption {
  id: string;
  names: string[];
}

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const scaleIn = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0, opacity: 0 }
};

const slideInRight = {
  initial: { x: 50, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -50, opacity: 0 }
};

export function UploadDialog({ trigger, onUploadSuccess }: UploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [comments, setComments] = useState<string[]>([]);
  const [currentComment, setCurrentComment] = useState("");
  const [catalogues, setCatalogues] = useState<string[]>([]);
  const [catalogueOptions, setCatalogueOptions] = useState<CatalogueOption[]>([]);
  const [loadingCatalogues, setLoadingCatalogues] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch catalogue options when dialog opens
  useEffect(() => {
    if (open) {
      fetchCatalogues();
    }
  }, [open]);

  const fetchCatalogues = async () => {
    setLoadingCatalogues(true);
    try {
      const response = await fetch("/api/user/cats");
      if (response.ok) {
        const data = await response.json();
        const options = Object.entries(data.data).map(([id, names]) => ({
          id,
          names: names as string[],
        }));
        setCatalogueOptions(options);
      }
    } catch (error) {
      console.error("Failed to fetch catalogues:", error);
      toast.error("获取分类列表失败");
    } finally {
      setLoadingCatalogues(false);
    }
  };

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFiles = useCallback((files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/')).slice(0, 10);
    
    const newFiles = imageFiles.map(file => {
      const fileWithPreview: FileWithPreview = file;
      fileWithPreview.preview = URL.createObjectURL(file);
      return fileWithPreview;
    });
    
    setSelectedFiles(prev => [...prev, ...newFiles].slice(0, 10));
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  }, [handleFiles]);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => {
      const file = prev[index];
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const addTag = useCallback(() => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  }, [currentTag, tags]);

  const removeTag = useCallback((tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  }, [tags]);

  const addComment = useCallback(() => {
    if (currentComment.trim() && !comments.includes(currentComment.trim())) {
      setComments([...comments, currentComment.trim()]);
      setCurrentComment("");
    }
  }, [currentComment, comments]);

  const removeComment = useCallback((comment: string) => {
    setComments(comments.filter((c) => c !== comment));
  }, [comments]);

  const handleCatalogueChange = useCallback((newCatalogues: string[]) => {
    setCatalogues(newCatalogues);
  }, []);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("请选择至少一个图片文件");
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setUploadSuccess(false);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Convert files to base64
      const base64Images = await Promise.all(
        selectedFiles.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            })
        )
      );

      clearInterval(progressInterval);
      setUploadProgress(95);

      // Send upload request
      const response = await fetch("/api/user/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          images: base64Images,
          tags,
          comment: comments,
          catalogue: catalogues,
        }),
      });

      const result = await response.json();
      setUploadProgress(100);

      if (response.ok && result.success) {
        setUploadSuccess(true);
        toast.success(result.data.message || "上传成功");
        
        // Show warnings if any
        if (result.data.warnings && result.data.warnings.length > 0) {
          result.data.warnings.forEach((warning: string) => {
            toast.warning(warning);
          });
        }

        // Clean up previews
        selectedFiles.forEach(file => {
          if (file.preview) {
            URL.revokeObjectURL(file.preview);
          }
        });

        // Reset form after a delay
        setTimeout(() => {
          setSelectedFiles([]);
          setTags([]);
          setComments([]);
          setCatalogues([]);
          setUploadSuccess(false);
          setOpen(false);
          setUploadProgress(0);
        }, 1500);

        // Call success callback
        if (onUploadSuccess) {
          onUploadSuccess(result.data);
        }
      } else {
        toast.error(result.message || "上传失败");
        
        // Show warnings if any
        if (result.data?.warnings) {
          result.data.warnings.forEach((warning: string) => {
            toast.warning(warning);
          });
        }
      }
    } catch (error) {
      toast.error("上传失败：网络错误");
      console.error("Upload error:", error);
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 300);
    }
  };

  // Clean up previews on unmount
  useEffect(() => {
    return () => {
      selectedFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [selectedFiles]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              variant="outline" 
              size="sm"
              className="relative overflow-hidden group hover:border-primary/50 transition-all duration-300"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.5 }}
              />
              <Upload className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
              上传怡言
            </Button>
          </motion.div>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden p-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="p-6"
        >
          <DialogHeader className="relative">
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Sparkles className="w-6 h-6 text-purple-500/50" />
            </motion.div>
            <DialogTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              上传怡言
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              拖拽或选择图片，添加标签、评论和分类，最多支持10张图片
            </DialogDescription>
          </DialogHeader>
        </motion.div>
        
        <ScrollArea className="h-[calc(95vh-220px)] px-6">
          <div className="space-y-8 pb-6">
            {/* File Upload Section with Enhanced Drag & Drop */}
            <motion.div 
              className="space-y-3"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2">
                <ImagePlus className="w-5 h-5 text-purple-600" />
                <Label className="text-base font-semibold">选择图片</Label>
                <Badge variant="secondary" className="ml-auto">
                  {selectedFiles.length}/10
                </Badge>
              </div>
              
              <motion.div
                className={`
                  relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300
                  ${dragActive 
                    ? "border-primary bg-gradient-to-br from-purple-50 to-pink-50 scale-[1.02]" 
                    : "border-gray-300 hover:border-gray-400 bg-gradient-to-br from-gray-50/50 to-gray-100/50"
                  }
                  ${selectedFiles.length >= 10 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !loading && selectedFiles.length < 10 && fileInputRef.current?.click()}
                whileHover={{ scale: selectedFiles.length < 10 ? 1.01 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <input
                  ref={fileInputRef}
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  disabled={loading || selectedFiles.length >= 10}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center text-center">
                  <motion.div
                    animate={dragActive ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-4">
                      <FileImage className="w-10 h-10 text-purple-600" />
                    </div>
                  </motion.div>
                  <p className="text-base font-medium text-gray-700 mb-1">
                    {dragActive ? "松开鼠标上传" : "拖拽图片到此处或点击选择"}
                  </p>
                  <p className="text-sm text-gray-500">
                    支持 JPG、PNG、GIF 等格式，单个文件最大 10MB
                  </p>
                </div>
              </motion.div>
              
              {/* Enhanced Image Previews */}
              <AnimatePresence mode="popLayout">
                {selectedFiles.length > 0 && (
                  <motion.div
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <LayoutGroup>
                      {selectedFiles.map((file, index) => (
                        <motion.div
                          key={`${file.name}-${index}`}
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          whileHover={{ scale: 1.05, zIndex: 10 }}
                          transition={{ duration: 0.2 }}
                          className="relative group rounded-xl overflow-hidden shadow-lg"
                        >
                          <div className="aspect-square relative">
                            <img
                              src={file.preview}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                              initial={{ opacity: 0 }}
                              whileHover={{ opacity: 1 }}
                            />
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(index);
                              }}
                              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 shadow-lg"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <X className="w-4 h-4" />
                            </motion.button>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-3 transform translate-y-full group-hover:translate-y-0 transition-transform">
                              <p className="text-xs font-medium truncate">{file.name}</p>
                              <p className="text-xs opacity-80">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </LayoutGroup>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Enhanced Tags Section */}
            <motion.div 
              className="space-y-3"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-purple-600" />
                <Label className="text-base font-semibold">标签</Label>
              </div>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="输入标签后按回车或点击添加"
                  disabled={loading}
                  className="flex-1 transition-all focus:ring-2 focus:ring-purple-500/20"
                />
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    onClick={addTag} 
                    size="icon" 
                    variant="outline" 
                    disabled={loading || !currentTag.trim()}
                    className="hover:bg-purple-50 hover:border-purple-300"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </motion.div>
              </div>
              <AnimatePresence>
                {tags.length > 0 && (
                  <motion.div 
                    className="flex flex-wrap gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {tags.map((tag, index) => (
                      <motion.div
                        key={tag}
                        layout
                        initial={{ opacity: 0, scale: 0, x: -20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <Badge 
                          variant="secondary" 
                          className="cursor-pointer pl-3 pr-2 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-200"
                          onClick={() => removeTag(tag)}
                        >
                          <span className="mr-1">#</span>
                          {tag}
                          <X className="w-3.5 h-3.5 ml-1.5" />
                        </Badge>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Enhanced Comments Section */}
            <motion.div 
              className="space-y-3"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <Label className="text-base font-semibold">评论</Label>
              </div>
              <div className="flex gap-2">
                <Input
                  id="comments"
                  value={currentComment}
                  onChange={(e) => setCurrentComment(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addComment())}
                  placeholder="输入评论内容"
                  disabled={loading}
                  className="flex-1 transition-all focus:ring-2 focus:ring-purple-500/20"
                />
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    onClick={addComment} 
                    size="icon" 
                    variant="outline" 
                    disabled={loading || !currentComment.trim()}
                    className="hover:bg-purple-50 hover:border-purple-300"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </motion.div>
              </div>
              <AnimatePresence>
                {comments.length > 0 && (
                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {comments.map((comment, index) => (
                      <motion.div
                        key={comment}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        className="group"
                      >
                        <div className="flex items-start gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                             onClick={() => removeComment(comment)}>
                          <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                          <p className="flex-1 text-sm text-gray-700">{comment}</p>
                          <X className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Enhanced Catalogues Section with Grid */}
            <motion.div 
              className="space-y-3"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.4 }}
            >
              <EPSelectorGrid
                catalogues={catalogueOptions}
                selectedIds={catalogues}
                onSelectionChange={handleCatalogueChange}
                loading={loadingCatalogues}
              />
            </motion.div>
          </div>
        </ScrollArea>

        {/* Enhanced Footer with Upload Button and Progress */}
        <div className="border-t bg-gradient-to-t from-gray-50 to-white p-6">
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div 
                className="space-y-3 mb-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">上传进度</span>
                  <motion.span 
                    className={`font-medium ${uploadSuccess ? "text-green-600" : "text-purple-600"}`}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.3 }}
                  >
                    {uploadProgress}%
                  </motion.span>
                </div>
                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className={`absolute inset-y-0 left-0 ${
                      uploadSuccess 
                        ? "bg-gradient-to-r from-green-500 to-emerald-500" 
                        : "bg-gradient-to-r from-purple-500 to-pink-500"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                  <motion.div
                    className="absolute inset-0 bg-white/30"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    style={{ 
                      backgroundImage: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
                      backgroundSize: "200% 100%"
                    }}
                  />
                </div>
                {uploadSuccess && (
                  <motion.div
                    className="flex items-center justify-center gap-2 text-green-600"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-medium">上传成功！</span>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex justify-between items-center">
            <motion.div 
              className="text-sm text-gray-500"
              animate={{ opacity: selectedFiles.length > 0 ? 1 : 0.5 }}
            >
              已选择 <span className="font-medium text-gray-700">{selectedFiles.length}</span> 个文件
            </motion.div>
            <div className="flex gap-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outline" 
                  onClick={() => setOpen(false)} 
                  disabled={loading}
                  className="hover:bg-gray-50"
                >
                  取消
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  onClick={handleUpload} 
                  disabled={loading || selectedFiles.length === 0}
                  className="min-w-[120px] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  {loading ? (
                    <motion.div 
                      className="flex items-center"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      上传中...
                    </motion.div>
                  ) : (
                    <motion.div className="flex items-center">
                      <Upload className="w-4 h-4 mr-2" />
                      上传 
                      {selectedFiles.length > 0 && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="ml-1"
                        >
                          ({selectedFiles.length})
                        </motion.span>
                      )}
                    </motion.div>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}