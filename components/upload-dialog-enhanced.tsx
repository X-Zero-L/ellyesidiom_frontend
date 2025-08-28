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
import { ScrollArea } from "@/components/ui/scroll-area";
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
  ArrowUpDown
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
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const slideIn = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
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

// Utility functions
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
  const [activeTab, setActiveTab] = useState("upload");
  const [pasteMode, setPasteMode] = useState(false);
  const [recentTags, setRecentTags] = useState<string[]>([]);
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
      setActiveTab("upload");
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
    setActiveTab("progress");

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
          setActiveTab("upload");
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
        setActiveTab("upload");
      }
    } catch (error) {
      toast.error("上传失败：网络错误");
      console.error("Upload error:", error);
      setActiveTab("upload");
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
        
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0 bg-gradient-to-b from-white to-gray-50/50">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6 border-b bg-white"
          >
            <DialogHeader className="relative">
              <motion.div
                className="absolute -top-2 -right-2"
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 0.9, 1]
                }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              >
                <Sparkles className="w-6 h-6 text-purple-500/50" />
              </motion.div>
              <DialogTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
                <ImagePlus className="w-6 h-6 text-purple-600" />
                上传怡言
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                拖拽或选择图片，支持批量上传，最多10张 • 支持从剪贴板粘贴
              </DialogDescription>
            </DialogHeader>

            {/* Quick Stats */}
            <AnimatePresence>
              {selectedFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 flex items-center gap-4 text-sm"
                >
                  <div className="flex items-center gap-1.5">
                    <Image className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">{selectedFiles.length} 张图片</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">{formatFileSize(stats.totalSize)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">预计 {Math.ceil(selectedFiles.length * 0.5)}s</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <div className="px-6 pt-2">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100/50">
                <TabsTrigger value="upload" className="data-[state=active]:bg-white">
                  <Upload className="w-4 h-4 mr-2" />
                  上传
                </TabsTrigger>
                <TabsTrigger value="metadata" disabled={selectedFiles.length === 0} className="data-[state=active]:bg-white">
                  <Type className="w-4 h-4 mr-2" />
                  信息
                </TabsTrigger>
                <TabsTrigger value="progress" disabled={!loading} className="data-[state=active]:bg-white">
                  <Zap className="w-4 h-4 mr-2" />
                  进度
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Upload Tab */}
            <TabsContent value="upload" className="mt-0">
              <ScrollArea className="h-[calc(95vh-280px)]">
                <div className="p-6 space-y-6">
                  {/* Paste Mode Toggle */}
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Palette className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-purple-900">剪贴板模式</p>
                        <p className="text-xs text-purple-700">开启后可以直接粘贴图片</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPasteMode(!pasteMode)}
                      className={`
                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                        ${pasteMode ? 'bg-purple-600' : 'bg-gray-300'}
                      `}
                    >
                      <span
                        className={`
                          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                          ${pasteMode ? 'translate-x-6' : 'translate-x-1'}
                        `}
                      />
                    </button>
                  </div>

                  {/* Enhanced Drag & Drop Zone */}
                  <motion.div
                    ref={dropZoneRef}
                    className={`
                      relative border-2 border-dashed rounded-3xl p-8 md:p-12 transition-all duration-300
                      ${dragActive 
                        ? "border-primary bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 scale-[1.01]" 
                        : "border-gray-300 hover:border-gray-400 bg-gradient-to-br from-gray-50/30 to-gray-100/30"
                      }
                      ${selectedFiles.length >= 10 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    `}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => !loading && selectedFiles.length < 10 && fileInputRef.current?.click()}
                    whileHover={{ scale: selectedFiles.length < 10 ? 1.005 : 1 }}
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
                    
                    <div className="flex flex-col items-center justify-center text-center space-y-4">
                      <motion.div
                        animate={dragActive ? { 
                          scale: [1, 1.2, 1],
                          rotate: [0, 5, -5, 0]
                        } : {}}
                        transition={{ duration: 0.5 }}
                        className="relative"
                      >
                        <div className="p-6 bg-gradient-to-br from-purple-100 via-pink-100 to-purple-100 rounded-full">
                          <FileImage className="w-16 h-16 text-purple-600" />
                        </div>
                        {pasteMode && (
                          <motion.div
                            className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <Palette className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                      </motion.div>
                      
                      <div>
                        <p className="text-lg font-medium text-gray-700 mb-2">
                          {dragActive ? "松开鼠标上传" : pasteMode ? "拖拽图片或按 Ctrl+V 粘贴" : "拖拽图片到此处或点击选择"}
                        </p>
                        <p className="text-sm text-gray-500">
                          支持 JPG、PNG、GIF 等格式 • 单个文件最大 10MB
                        </p>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-3 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          disabled={loading || selectedFiles.length >= 10}
                        >
                          <FolderOpen className="w-4 h-4 mr-2" />
                          浏览文件
                        </Button>
                        {selectedFiles.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAllFiles();
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <FileX className="w-4 h-4 mr-2" />
                            清空所有
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* Enhanced Image Preview Grid */}
                  <AnimatePresence mode="popLayout">
                    {selectedFiles.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        {/* Grid Controls */}
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-700">
                            已选择的图片
                          </h3>
                          <div className="flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedFiles(prev => [...prev].reverse());
                                  }}
                                >
                                  <ArrowUpDown className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>反转顺序</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>

                        {/* Image Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          <LayoutGroup>
                            {selectedFiles.map((file, index) => (
                              <motion.div
                                key={file.id}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                whileHover={{ scale: 1.05, zIndex: 10 }}
                                transition={{ duration: 0.2 }}
                                className="relative group"
                              >
                                <div className="aspect-square rounded-2xl overflow-hidden shadow-lg bg-gray-100">
                                  <img
                                    src={file.preview}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                  />
                                  
                                  {/* Overlay */}
                                  <motion.div
                                    className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
                                    initial={{ opacity: 0 }}
                                    whileHover={{ opacity: 1 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    {/* File Info */}
                                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                                      <p className="text-xs font-medium truncate mb-1">
                                        {file.name}
                                      </p>
                                      <div className="flex items-center justify-between">
                                        <p className="text-xs opacity-90">
                                          {formatFileSize(file.size)}
                                        </p>
                                        <Badge 
                                          variant="secondary" 
                                          className="text-xs px-1.5 py-0 bg-white/20 text-white border-0"
                                        >
                                          #{index + 1}
                                        </Badge>
                                      </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="absolute top-2 right-2 flex gap-1">
                                      <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => removeFile(file.id!)}
                                        className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg"
                                      >
                                        <X className="w-4 h-4" />
                                      </motion.button>
                                    </div>
                                  </motion.div>

                                  {/* Progress Bar */}
                                  {file.progress !== undefined && file.progress > 0 && file.progress < 100 && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                                      <motion.div
                                        className="h-full bg-green-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${file.progress}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </LayoutGroup>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Metadata Tab */}
            <TabsContent value="metadata" className="mt-0">
              <ScrollArea className="h-[calc(95vh-280px)]">
                <div className="p-6 space-y-8">
                  {/* Tags Section with AI Generation */}
                  <motion.div 
                    className="space-y-4"
                    variants={fadeInUp}
                    initial="initial"
                    animate="animate"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Hash className="w-5 h-5 text-purple-600" />
                        <Label className="text-base font-semibold">标签</Label>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={autoGenerateTags}
                            disabled={loading}
                            className="gap-1.5"
                          >
                            <Wand2 className="w-3.5 h-3.5" />
                            AI 生成
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>基于图片内容智能生成标签</TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Tag Input */}
                    <div className="flex gap-2">
                      <Input
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                        placeholder="输入标签后按回车"
                        disabled={loading}
                        className="flex-1"
                      />
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button 
                          onClick={addTag} 
                          size="icon" 
                          disabled={loading || !currentTag.trim()}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    </div>

                    {/* Quick Tag Suggestions */}
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">快速添加：</p>
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
                              px-3 py-1.5 rounded-full text-sm transition-all
                              ${tags.includes(suggestion.text)
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                              }
                            `}
                          >
                            <span className="mr-1">{suggestion.icon}</span>
                            {suggestion.text}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Recent Tags */}
                    {recentTags.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500">最近使用：</p>
                        <div className="flex flex-wrap gap-2">
                          {recentTags.map((tag) => (
                            <motion.button
                              key={tag}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                if (!tags.includes(tag)) {
                                  setTags([...tags, tag]);
                                }
                              }}
                              disabled={tags.includes(tag)}
                              className={`
                                px-3 py-1 rounded-full text-sm transition-all
                                ${tags.includes(tag)
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }
                              `}
                            >
                              {tag}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Selected Tags */}
                    <AnimatePresence>
                      {tags.length > 0 && (
                        <motion.div 
                          className="flex flex-wrap gap-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          {tags.map((tag, index) => (
                            <motion.div
                              key={tag}
                              layout
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <Badge 
                                variant="secondary" 
                                className="pl-3 pr-2 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 cursor-pointer"
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

                  {/* Comments Section */}
                  <motion.div 
                    className="space-y-4"
                    variants={fadeInUp}
                    initial="initial"
                    animate="animate"
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-purple-600" />
                      <Label className="text-base font-semibold">评论</Label>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={currentComment}
                        onChange={(e) => setCurrentComment(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addComment())}
                        placeholder="添加评论或说明"
                        disabled={loading}
                        className="flex-1"
                      />
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button 
                          onClick={addComment} 
                          size="icon" 
                          disabled={loading || !currentComment.trim()}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
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
                        >
                          {comments.map((comment, index) => (
                            <motion.div
                              key={`${comment}-${index}`}
                              layout
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ delay: index * 0.05 }}
                              className="group"
                            >
                              <div 
                                className="flex items-start gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                                onClick={() => removeComment(comment)}
                              >
                                <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                <p className="flex-1 text-sm text-gray-700">{comment}</p>
                                <X className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* EP Selection Grid */}
                  <motion.div 
                    className="space-y-4"
                    variants={fadeInUp}
                    initial="initial"
                    animate="animate"
                    transition={{ delay: 0.2 }}
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
            </TabsContent>

            {/* Progress Tab */}
            <TabsContent value="progress" className="mt-0">
              <div className="flex items-center justify-center h-[calc(95vh-280px)]">
                <div className="w-full max-w-md space-y-8">
                  {/* Upload Animation */}
                  <motion.div
                    className="flex justify-center"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                        {uploadSuccess ? (
                          <CheckCircle2 className="w-16 h-16 text-green-500" />
                        ) : (
                          <Upload className="w-16 h-16 text-purple-600" />
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

                  {/* Progress Info */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className={`text-xl font-semibold ${uploadSuccess ? 'text-green-600' : 'text-gray-900'}`}>
                        {uploadSuccess ? '上传成功！' : '正在上传...'}
                      </h3>
                      <p className="text-gray-500 mt-1">
                        {uploadSuccess 
                          ? `成功上传 ${selectedFiles.length} 张图片`
                          : '请稍候，正在处理您的图片'
                        }
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">整体进度</span>
                        <span className={`font-medium ${uploadSuccess ? 'text-green-600' : 'text-purple-600'}`}>
                          {uploadProgress}%
                        </span>
                      </div>
                      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
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
                        <motion.div
                          className="absolute inset-0 bg-white/30"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                          style={{ 
                            backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                            backgroundSize: '200% 100%'
                          }}
                        />
                      </div>
                    </div>

                    {/* File Progress */}
                    {!uploadSuccess && (
                      <div className="space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div key={file.id} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded overflow-hidden shrink-0">
                              <img src={file.preview} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-600 truncate max-w-[200px]">{file.name}</span>
                                <span className="text-gray-500">{file.progress || 0}%</span>
                              </div>
                              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-purple-500"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${file.progress || 0}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Enhanced Footer */}
          <div className="border-t bg-gradient-to-t from-gray-100 to-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="text-sm text-gray-500"
                  animate={{ opacity: selectedFiles.length > 0 ? 1 : 0.5 }}
                >
                  已选择 <span className="font-semibold text-gray-700">{selectedFiles.length}</span> 个文件
                </motion.div>
                
                {/* Info Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                      <Info className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-sm">
                      支持批量上传最多10张图片，每张最大10MB。
                      上传后的图片将自动进行OCR识别。
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="flex gap-3">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      if (!loading) {
                        setOpen(false);
                      }
                    }} 
                    disabled={loading}
                  >
                    取消
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    onClick={() => {
                      if (activeTab === "upload" && selectedFiles.length > 0) {
                        setActiveTab("metadata");
                      } else if (activeTab === "metadata") {
                        handleUpload();
                      }
                    }}
                    disabled={loading || selectedFiles.length === 0}
                    className="min-w-[140px] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all group"
                  >
                    {loading ? (
                      <motion.div 
                        className="flex items-center justify-center"
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        上传中...
                      </motion.div>
                    ) : activeTab === "upload" && selectedFiles.length > 0 ? (
                      <motion.div className="flex items-center justify-center">
                        下一步
                        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </motion.div>
                    ) : (
                      <motion.div className="flex items-center justify-center">
                        <Upload className="w-4 h-4 mr-2" />
                        开始上传
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
    </TooltipProvider>
  );
}