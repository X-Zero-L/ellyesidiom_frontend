"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Upload, 
  X, 
  Plus, 
  Loader2,
  FileImage,
  Sparkles,
  ImagePlus,
  FolderOpen,
  Hash,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Info,
  Zap,
  Clock,
  TrendingUp,
  Image,
  FileX,
  Copy,
  ChevronRight,
  Wand2,
  Palette,
  Type,
  Grid3x3,
  List,
  FileUp,
  FolderPlus,
  Tags,
  Eye,
  EyeOff,
  RefreshCw,
  Settings
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { EPSelectorGrid } from "./ep-selector-grid-with-avatars";
import confetti from 'canvas-confetti';

interface UploadDialogProps {
  trigger?: React.ReactNode;
  onUploadSuccess?: (data: any) => void;
}

interface FileWithPreview extends File {
  preview?: string;
  id?: string;
  progress?: number;
  error?: string;
}

interface CatalogueOption {
  id: string;
  names: string[];
}

// Animation variants
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

const slideUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

// Quick tag suggestions
const TAG_SUGGESTIONS = [
  { icon: "😂", text: "搞笑" },
  { icon: "😭", text: "悲伤" },
  { icon: "😡", text: "愤怒" },
  { icon: "🥰", text: "可爱" },
  { icon: "🤔", text: "思考" },
  { icon: "😱", text: "震惊" },
  { icon: "🎉", text: "庆祝" },
  { icon: "💀", text: "要死了" },
];

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const generateFileId = () => Math.random().toString(36).substr(2, 9);

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
  const [activeTab, setActiveTab] = useState("all");
  const [pasteMode, setPasteMode] = useState(false);
  const [recentTags, setRecentTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Statistics
  const stats = useMemo(() => {
    const totalSize = selectedFiles.reduce((acc, file) => acc + file.size, 0);
    const averageSize = selectedFiles.length > 0 ? totalSize / selectedFiles.length : 0;
    return { totalSize, averageSize };
  }, [selectedFiles]);

  // Load recent tags from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentTags');
    if (stored) {
      setRecentTags(JSON.parse(stored).slice(0, 8));
    }
  }, []);

  // Save tags to localStorage
  const saveRecentTags = (newTags: string[]) => {
    const updated = Array.from(new Set([...newTags, ...recentTags])).slice(0, 20);
    localStorage.setItem('recentTags', JSON.stringify(updated));
    setRecentTags(updated.slice(0, 8));
  };

  // Fetch catalogue options when dialog opens
  useEffect(() => {
    if (open) {
      fetchCatalogues();
      setActiveTab("all");
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

  // Paste event handler
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!pasteMode || !open) return;
      
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            imageFiles.push(blob);
          }
        }
      }

      if (imageFiles.length > 0) {
        handleFiles(imageFiles);
        toast.success(`从剪贴板粘贴了 ${imageFiles.length} 张图片`);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [pasteMode, open]);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      const rect = dropZoneRef.current?.getBoundingClientRect();
      if (rect && (e.clientX < rect.left || e.clientX > rect.right || 
          e.clientY < rect.top || e.clientY > rect.bottom)) {
        setDragActive(false);
      }
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
      fileWithPreview.id = generateFileId();
      fileWithPreview.progress = 0;
      return fileWithPreview;
    });
    
    setSelectedFiles(prev => [...prev, ...newFiles].slice(0, 10));
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  }, [handleFiles]);

  const removeFile = useCallback((id: string) => {
    setSelectedFiles((prev) => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const removeAllFiles = useCallback(() => {
    selectedFiles.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setSelectedFiles([]);
  }, [selectedFiles]);

  const addTag = useCallback(() => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      const newTag = currentTag.trim();
      setTags([...tags, newTag]);
      setCurrentTag("");
      saveRecentTags([newTag]);
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

  // Auto-generate tags using AI (mock)
  const autoGenerateTags = useCallback(() => {
    const mockTags = ["日常", "表情包", "截图"];
    const newTags = mockTags.filter(tag => !tags.includes(tag));
    setTags([...tags, ...newTags]);
    toast.success("AI 已为您生成标签");
  }, [tags]);

  // Copy hash IDs
  const copyHashIds = useCallback((hashes: string[]) => {
    navigator.clipboard.writeText(hashes.join(" "));
    toast.success("已复制 ID 到剪贴板");
  }, []);

  // Confetti effect
  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("请选择至少一个图片文件");
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setUploadSuccess(false);

    try {
      // Simulate file-by-file progress
      const totalFiles = selectedFiles.length;
      let processedFiles = 0;

      // Convert files to base64 with individual progress
      const base64Images = await Promise.all(
        selectedFiles.map(async (file, index) => {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              // Update individual file progress
              setSelectedFiles(prev => prev.map((f, i) => 
                i === index ? { ...f, progress: 100 } : f
              ));
              resolve(reader.result as string);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          processedFiles++;
          setUploadProgress(Math.round((processedFiles / totalFiles) * 50));
          return base64;
        })
      );

      setUploadProgress(60);

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

      setUploadProgress(90);
      const result = await response.json();
      setUploadProgress(100);

      if (response.ok && result.success) {
        setUploadSuccess(true);
        triggerConfetti();
        
        // Play success sound
        const audio = new Audio('/success.mp3');
        audio.play().catch(() => {});
        
        toast.success(result.data.message || "上传成功");
        
        // Show warnings if any
        if (result.data.warnings && result.data.warnings.length > 0) {
          result.data.warnings.forEach((warning: string) => {
            toast.warning(warning);
          });
        }

        // Show copy button for IDs
        if (result.data.short_hashes && result.data.short_hashes.length > 0) {
          setTimeout(() => {
            toast(
              <div className="flex items-center justify-between gap-2">
                <span>上传成功！ID: {result.data.short_hashes.join(" ")}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyHashIds(result.data.short_hashes)}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  复制
                </Button>
              </div>,
              { duration: 10000 }
            );
          }, 500);
        }

        // Clean up and close
        setTimeout(() => {
          selectedFiles.forEach(file => {
            if (file.preview) {
              URL.revokeObjectURL(file.preview);
            }
          });
          setSelectedFiles([]);
          setTags([]);
          setComments([]);
          setCatalogues([]);
          setUploadSuccess(false);
          setOpen(false);
          setUploadProgress(0);
        }, 2000);

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

  // Progress Modal
  const ProgressModal = () => (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-white/90 backdrop-blur-md z-50 flex items-center justify-center rounded-3xl"
        >
          <div className="w-full max-w-md space-y-6 p-8">
            <motion.div
              className="flex justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                  {uploadSuccess ? (
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                  ) : (
                    <Upload className="w-12 h-12 text-purple-600" />
                  )}
                </div>
                {!uploadSuccess && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </div>
            </motion.div>

            <div className="space-y-4">
              <div className="text-center">
                <h3 className={`text-lg font-semibold ${uploadSuccess ? 'text-green-600' : 'text-gray-900'}`}>
                  {uploadSuccess ? '上传成功！' : '正在上传...'}
                </h3>
                <p className="text-gray-500 mt-1 text-sm">
                  {uploadSuccess 
                    ? `成功上传 ${selectedFiles.length} 张图片`
                    : '请稍候，正在处理您的图片'
                  }
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">整体进度</span>
                  <span className={`font-medium ${uploadSuccess ? 'text-green-600' : 'text-purple-600'}`}>
                    {uploadProgress}%
                  </span>
                </div>
                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className={`absolute inset-y-0 left-0 ${
                      uploadSuccess 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                        : 'bg-gradient-to-r from-purple-500 to-pink-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <TooltipProvider>
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
        
        <DialogContent className="max-w-[95vw] w-[1400px] max-h-[90vh] h-[800px] p-0 bg-gradient-to-b from-white to-gray-50/50 overflow-hidden">
          {/* Progress Overlay */}
          <ProgressModal />

          {/* Header */}
          <div className="px-6 py-4 border-b bg-white relative">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
                  <ImagePlus className="w-5 h-5 text-purple-600" />
                </div>
                上传怡言
                {selectedFiles.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedFiles.length} 张已选择
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                支持批量上传，拖拽或粘贴图片，最多10张
              </DialogDescription>
            </DialogHeader>

            {/* Sparkle Animation */}
            <motion.div
              className="absolute top-4 right-4"
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 0.9, 1]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Sparkles className="w-5 h-5 text-purple-500/30" />
            </motion.div>
          </div>

          {/* Main Content Area - Split Layout */}
          <div className="flex h-[calc(100%-140px)]">
            {/* Left Side - Upload Zone and Image Grid */}
            <div className="flex-1 p-6 border-r overflow-hidden flex flex-col">
              {/* Upload Zone */}
              <motion.div
                ref={dropZoneRef}
                className={`
                  relative border-2 border-dashed rounded-2xl transition-all mb-4
                  ${dragActive 
                    ? "border-primary bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50" 
                    : "border-gray-300 hover:border-gray-400 bg-gradient-to-br from-gray-50/30 to-gray-100/30"
                  }
                  ${selectedFiles.length >= 10 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
                style={{ height: selectedFiles.length > 0 ? '120px' : '200px' }}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !loading && selectedFiles.length < 10 && fileInputRef.current?.click()}
                animate={{ height: selectedFiles.length > 0 ? 120 : 200 }}
                transition={{ duration: 0.3 }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  disabled={loading || selectedFiles.length >= 10}
                  className="hidden"
                />
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <motion.div
                      animate={dragActive ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      <FileImage className="w-10 h-10 mx-auto text-gray-400" />
                    </motion.div>
                    <p className="text-sm font-medium text-gray-700">
                      {dragActive ? "松开鼠标上传" : "拖拽图片或点击选择"}
                    </p>
                    {pasteMode && (
                      <Badge variant="secondary" className="text-xs">
                        <Palette className="w-3 h-3 mr-1" />
                        剪贴板模式已开启
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="absolute bottom-2 right-2 flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPasteMode(!pasteMode);
                        }}
                      >
                        <Palette className={`w-4 h-4 ${pasteMode ? 'text-purple-600' : 'text-gray-400'}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>切换剪贴板模式</TooltipContent>
                  </Tooltip>
                  
                  {selectedFiles.length > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-8 h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeAllFiles();
                          }}
                        >
                          <FileX className="w-4 h-4 text-red-500" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>清空所有</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </motion.div>

              {/* Image Grid */}
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">
                    已选择的图片
                  </h3>
                  {selectedFiles.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-7 h-7"
                            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                          >
                            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3x3 className="w-4 h-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>切换视图</TooltipContent>
                      </Tooltip>
                      <span className="text-xs text-gray-500">
                        {formatFileSize(stats.totalSize)}
                      </span>
                    </div>
                  )}
                </div>

                <ScrollArea className="h-full">
                  <AnimatePresence mode="popLayout">
                    {selectedFiles.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center h-full text-gray-400"
                      >
                        <div className="text-center space-y-2">
                          <ImagePlus className="w-12 h-12 mx-auto" />
                          <p className="text-sm">尚未选择图片</p>
                        </div>
                      </motion.div>
                    ) : viewMode === 'grid' ? (
                      <div className="grid grid-cols-3 gap-3">
                        <LayoutGroup>
                          {selectedFiles.map((file, index) => (
                            <motion.div
                              key={file.id}
                              layout
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              whileHover={{ scale: 1.02 }}
                              className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-md transition-all"
                            >
                              <img
                                src={file.preview}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                              
                              {/* Overlay */}
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
                                initial={{ opacity: 0 }}
                                whileHover={{ opacity: 1 }}
                              >
                                <div className="absolute bottom-2 left-2 right-2">
                                  <p className="text-xs text-white truncate">
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-white/80">
                                    {formatFileSize(file.size)}
                                  </p>
                                </div>
                                
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => removeFile(file.id!)}
                                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg"
                                >
                                  <X className="w-3 h-3" />
                                </motion.button>
                              </motion.div>

                              {/* Order Badge */}
                              <div className="absolute top-2 left-2">
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs px-1.5 py-0.5 bg-white/90 backdrop-blur-sm"
                                >
                                  {index + 1}
                                </Badge>
                              </div>
                            </motion.div>
                          ))}
                        </LayoutGroup>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedFiles.map((file, index) => (
                          <motion.div
                            key={file.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex items-center gap-3 p-2 bg-white rounded-lg border hover:border-purple-200 transition-all"
                          >
                            <div className="w-12 h-12 rounded overflow-hidden shrink-0">
                              <img src={file.preview} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs shrink-0">
                              #{index + 1}
                            </Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-8 h-8 shrink-0"
                              onClick={() => removeFile(file.id!)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </AnimatePresence>
                  <ScrollBar orientation="vertical" />
                </ScrollArea>
              </div>
            </div>

            {/* Right Side - Metadata */}
            <div className="w-[500px] bg-gray-50/50 overflow-hidden flex flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="mx-6 mt-6 grid grid-cols-3">
                  <TabsTrigger value="all" className="text-sm">
                    <Settings className="w-3.5 h-3.5 mr-1.5" />
                    全部信息
                  </TabsTrigger>
                  <TabsTrigger value="tags" className="text-sm">
                    <Tags className="w-3.5 h-3.5 mr-1.5" />
                    标签
                  </TabsTrigger>
                  <TabsTrigger value="catalogue" className="text-sm">
                    <FolderPlus className="w-3.5 h-3.5 mr-1.5" />
                    怡批
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-hidden">
                  {/* All Tab - Compact View */}
                  <TabsContent value="all" className="h-full mt-0">
                    <ScrollArea className="h-full px-6 py-4">
                      <div className="space-y-6">
                        {/* Tags Section */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium flex items-center gap-1.5">
                              <Hash className="w-4 h-4 text-purple-600" />
                              标签
                            </Label>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={autoGenerateTags}
                              className="h-7 text-xs"
                            >
                              <Wand2 className="w-3 h-3 mr-1" />
                              AI 生成
                            </Button>
                          </div>
                          
                          <div className="flex gap-2">
                            <Input
                              value={currentTag}
                              onChange={(e) => setCurrentTag(e.target.value)}
                              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                              placeholder="输入标签"
                              className="h-8 text-sm"
                            />
                            <Button 
                              onClick={addTag} 
                              size="sm"
                              disabled={!currentTag.trim()}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Quick Tags */}
                          <div className="flex flex-wrap gap-1.5">
                            {TAG_SUGGESTIONS.slice(0, 6).map((suggestion) => (
                              <button
                                key={suggestion.text}
                                onClick={() => {
                                  if (!tags.includes(suggestion.text)) {
                                    setTags([...tags, suggestion.text]);
                                    saveRecentTags([suggestion.text]);
                                  }
                                }}
                                disabled={tags.includes(suggestion.text)}
                                className={`
                                  px-2 py-1 rounded-md text-xs transition-all
                                  ${tags.includes(suggestion.text)
                                    ? 'bg-gray-100 text-gray-400'
                                    : 'bg-white border hover:border-purple-300 hover:bg-purple-50'
                                  }
                                `}
                              >
                                {suggestion.icon} {suggestion.text}
                              </button>
                            ))}
                          </div>

                          {/* Selected Tags */}
                          {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {tags.map((tag) => (
                                <Badge 
                                  key={tag}
                                  variant="secondary" 
                                  className="text-xs cursor-pointer"
                                  onClick={() => removeTag(tag)}
                                >
                                  # {tag} ×
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Comments Section */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4 text-purple-600" />
                            评论
                          </Label>
                          
                          <div className="flex gap-2">
                            <Input
                              value={currentComment}
                              onChange={(e) => setCurrentComment(e.target.value)}
                              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addComment())}
                              placeholder="添加评论"
                              className="h-8 text-sm"
                            />
                            <Button 
                              onClick={addComment} 
                              size="sm"
                              disabled={!currentComment.trim()}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>

                          {comments.length > 0 && (
                            <div className="space-y-1.5">
                              {comments.map((comment, index) => (
                                <div 
                                  key={index}
                                  className="flex items-center gap-2 p-2 bg-white rounded-lg text-sm group cursor-pointer hover:bg-gray-50"
                                  onClick={() => removeComment(comment)}
                                >
                                  <MessageSquare className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  <span className="flex-1 truncate">{comment}</span>
                                  <X className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* EP Selection Summary */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium flex items-center gap-1.5">
                            <FolderOpen className="w-4 h-4 text-purple-600" />
                            所属怡批
                            {catalogues.length > 0 && (
                              <Badge variant="secondary" className="text-xs ml-1">
                                {catalogues.length}
                              </Badge>
                            )}
                          </Label>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start h-8"
                            onClick={() => setActiveTab('catalogue')}
                          >
                            <FolderPlus className="w-4 h-4 mr-2" />
                            {catalogues.length > 0 
                              ? `已选择 ${catalogues.length} 个怡批`
                              : '点击选择怡批'
                            }
                          </Button>

                          {catalogues.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {catalogues.slice(0, 5).map(id => {
                                const ep = catalogueOptions.find(c => c.id === id);
                                return ep ? (
                                  <Badge 
                                    key={id}
                                    variant="secondary" 
                                    className="text-xs"
                                  >
                                    {ep.names[0]}
                                  </Badge>
                                ) : null;
                              })}
                              {catalogues.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{catalogues.length - 5}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* Tags Tab - Detailed View */}
                  <TabsContent value="tags" className="h-full mt-0">
                    <ScrollArea className="h-full px-6 py-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">标签管理</h3>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={autoGenerateTags}
                          >
                            <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                            AI 生成标签
                          </Button>
                        </div>

                        <div className="flex gap-2">
                          <Input
                            value={currentTag}
                            onChange={(e) => setCurrentTag(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                            placeholder="输入标签后按回车"
                          />
                          <Button onClick={addTag} disabled={!currentTag.trim()}>
                            添加
                          </Button>
                        </div>

                        {/* All Tag Suggestions */}
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600">快速添加：</p>
                          <div className="flex flex-wrap gap-2">
                            {TAG_SUGGESTIONS.map((suggestion) => (
                              <motion.button
                                key={suggestion.text}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  if (!tags.includes(suggestion.text)) {
                                    setTags([...tags, suggestion.text]);
                                    saveRecentTags([suggestion.text]);
                                  }
                                }}
                                disabled={tags.includes(suggestion.text)}
                                className={`
                                  px-3 py-1.5 rounded-lg text-sm transition-all
                                  ${tags.includes(suggestion.text)
                                    ? 'bg-gray-100 text-gray-400'
                                    : 'bg-white border hover:border-purple-300 hover:bg-purple-50'
                                  }
                                `}
                              >
                                <span className="mr-1">{suggestion.icon}</span>
                                {suggestion.text}
                              </motion.button>
                            ))}
                          </div>
                        </div>

                        {recentTags.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-sm text-gray-600">最近使用：</p>
                            <div className="flex flex-wrap gap-2">
                              {recentTags.map((tag) => (
                                <button
                                  key={tag}
                                  onClick={() => {
                                    if (!tags.includes(tag)) {
                                      setTags([...tags, tag]);
                                    }
                                  }}
                                  disabled={tags.includes(tag)}
                                  className={`
                                    px-3 py-1.5 rounded-lg text-sm transition-all
                                    ${tags.includes(tag)
                                      ? 'bg-gray-100 text-gray-400'
                                      : 'bg-gray-100 hover:bg-gray-200'
                                    }
                                  `}
                                >
                                  {tag}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {tags.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-600">已添加的标签：</p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setTags([])}
                                className="text-xs"
                              >
                                清空所有
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {tags.map((tag, index) => (
                                <motion.div
                                  key={tag}
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: index * 0.05 }}
                                >
                                  <Badge 
                                    variant="secondary" 
                                    className="pl-3 pr-2 py-1.5 cursor-pointer"
                                    onClick={() => removeTag(tag)}
                                  >
                                    <span className="mr-1">#</span>
                                    {tag}
                                    <X className="w-3.5 h-3.5 ml-1.5" />
                                  </Badge>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* Catalogue Tab */}
                  <TabsContent value="catalogue" className="h-full mt-0 p-6">
                    <EPSelectorGrid
                      catalogues={catalogueOptions}
                      selectedIds={catalogues}
                      onSelectionChange={handleCatalogueChange}
                      loading={loadingCatalogues}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t bg-white flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>
                已选择 <span className="font-semibold text-gray-900">{selectedFiles.length}</span> 个文件
              </span>
              {stats.totalSize > 0 && (
                <>
                  <span className="text-gray-400">•</span>
                  <span>{formatFileSize(stats.totalSize)}</span>
                </>
              )}
              {catalogues.length > 0 && (
                <>
                  <span className="text-gray-400">•</span>
                  <span>{catalogues.length} 个怡批</span>
                </>
              )}
              {tags.length > 0 && (
                <>
                  <span className="text-gray-400">•</span>
                  <span>{tags.length} 个标签</span>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setOpen(false)} 
                disabled={loading}
              >
                取消
              </Button>
              
              <Button 
                onClick={handleUpload} 
                disabled={loading || selectedFiles.length === 0}
                className="min-w-[120px] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    上传中...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    开始上传
                    {selectedFiles.length > 0 && ` (${selectedFiles.length})`}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}