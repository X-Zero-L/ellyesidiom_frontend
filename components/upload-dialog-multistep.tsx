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
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
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
  ChevronRight,
  ChevronLeft,
  Check,
  Search,
  Hash,
  MessageSquare,
  Users,
  Sparkles,
  Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";
import confetti from 'canvas-confetti';

interface UploadDialogProps {
  trigger?: React.ReactNode;
  onUploadSuccess?: (data: any) => void;
}

interface FileWithPreview extends File {
  preview?: string;
  id?: string;
}

interface CatalogueOption {
  id: string;
  names: string[];
}

const STEPS = [
  { id: 'upload', title: '上传图片', icon: FileImage },
  { id: 'tags', title: '添加标签', icon: Hash },
  { id: 'catalogues', title: '选择怡批', icon: Users },
  { id: 'comments', title: '添加评论', icon: MessageSquare },
  { id: 'confirm', title: '确认上传', icon: Check }
];

const generateFileId = () => Math.random().toString(36).substr(2, 9);

export function UploadDialogMultiStep({ trigger, onUploadSuccess }: UploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [comments, setComments] = useState<string[]>([]);
  const [currentComment, setCurrentComment] = useState("");
  const [catalogues, setCatalogues] = useState<string[]>([]);
  const [catalogueOptions, setCatalogueOptions] = useState<CatalogueOption[]>([]);
  const [loadingCatalogues, setLoadingCatalogues] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Fetch catalogue options when dialog opens
  useEffect(() => {
    if (open) {
      fetchCatalogues();
      setCurrentStep(0);
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

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return selectedFiles.length > 0;
      case 1: return true; // Tags are optional
      case 2: return true; // Catalogues are optional
      case 3: return true; // Comments are optional
      case 4: return true; // Confirm page
      default: return false;
    }
  };

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
    setLoading(true);
    try {
      const base64Images = await Promise.all(
        selectedFiles.map(async (file) => {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          return base64;
        })
      );

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

      if (response.ok && result.success) {
        triggerConfetti();
        toast.success(result.data.message || "上传成功");
        
        if (result.data.warnings && result.data.warnings.length > 0) {
          result.data.warnings.forEach((warning: string) => {
            toast.warning(warning);
          });
        }

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
          setOpen(false);
          setCurrentStep(0);
        }, 2000);

        if (onUploadSuccess) {
          onUploadSuccess(result.data);
        }
      } else {
        toast.error(result.message || "上传失败");
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

  // Filter catalogues based on search
  const filteredCatalogues = catalogueOptions.filter(
    cat => 
      cat.id.includes(searchTerm) ||
      cat.names.some(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Upload Images
        return (
          <div className="space-y-4">
            <motion.div
              ref={dropZoneRef}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 transition-all",
                dragActive 
                  ? "border-primary bg-primary/5" 
                  : "border-gray-300 hover:border-gray-400",
                selectedFiles.length >= 10 && "opacity-50 cursor-not-allowed"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !loading && selectedFiles.length < 10 && fileInputRef.current?.click()}
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
              
              <div className="text-center space-y-4">
                <FileImage className="w-16 h-16 mx-auto text-gray-400" />
                <p className="text-lg font-medium text-gray-700">
                  {dragActive ? "松开鼠标上传" : "拖拽图片或点击选择"}
                </p>
                <p className="text-sm text-gray-500">
                  支持 JPG、PNG、GIF 等格式 • 最多10张
                </p>
              </div>
            </motion.div>

            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <AnimatePresence>
                  {selectedFiles.map((file, index) => (
                    <motion.div
                      key={file.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative group"
                    >
                      <div className="aspect-square rounded-lg overflow-hidden">
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.id!);
                        }}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <Badge className="absolute top-2 left-2 text-xs">
                        {index + 1}
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        );

      case 1: // Add Tags
        return (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="输入标签后按回车"
                disabled={loading}
              />
              <Button 
                onClick={addTag} 
                size="icon"
                disabled={loading || !currentTag.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge 
                    key={tag}
                    variant="secondary" 
                    className="cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    # {tag} ×
                  </Badge>
                ))}
              </div>
            )}

            <p className="text-sm text-gray-500 mt-4">
              标签可以帮助其他用户更容易找到您的图片
            </p>
          </div>
        );

      case 2: // Select Catalogues
        return (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索怡批名称或QQ号..."
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[400px] rounded-md border p-4">
              {loadingCatalogues ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredCatalogues.map((cat) => (
                    <div
                      key={cat.id}
                      onClick={() => {
                        if (catalogues.includes(cat.id)) {
                          setCatalogues(catalogues.filter(id => id !== cat.id));
                        } else {
                          setCatalogues([...catalogues, cat.id]);
                        }
                      }}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="relative w-10 h-10 flex-shrink-0">
                        <Image
                          src={`https://q1.qlogo.cn/g?b=qq&nk=${cat.id}&s=100`}
                          alt={`QQ Avatar for ${cat.id}`}
                          layout="fill"
                          objectFit="cover"
                          className="rounded-full"
                          onError={(e: any) => {
                            e.target.src = '/placeholder-avatar.png';
                          }}
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <span className="text-sm font-medium block truncate">
                          {cat.names[0]}
                        </span>
                        <p className="text-xs text-gray-500 truncate">{cat.id}</p>
                        {cat.names.length > 1 && (
                          <p className="text-xs text-gray-500 truncate">
                            {cat.names.slice(1).join(", ")}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                            catalogues.includes(cat.id)
                              ? "bg-primary border-primary"
                              : "border-gray-300"
                          )}
                        >
                          {catalogues.includes(cat.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        );

      case 3: // Add Comments
        return (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={currentComment}
                onChange={(e) => setCurrentComment(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addComment())}
                placeholder="添加评论或说明"
                disabled={loading}
              />
              <Button 
                onClick={addComment} 
                size="icon"
                disabled={loading || !currentComment.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {comments.length > 0 && (
              <div className="space-y-2">
                {comments.map((comment, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => removeComment(comment)}
                  >
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    <p className="flex-1 text-sm">{comment}</p>
                    <X className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 4: // Confirm Upload
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">已选择的图片</h3>
                <div className="flex gap-2 flex-wrap">
                  {selectedFiles.map((file, index) => (
                    <div key={file.id} className="relative w-20 h-20">
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-full h-full object-cover rounded"
                      />
                      <Badge className="absolute -top-2 -right-2 text-xs px-1">
                        {index + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {tags.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        # {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {catalogues.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">所属怡批</h3>
                  <div className="flex flex-wrap gap-2">
                    {catalogues.map(id => {
                      const cat = catalogueOptions.find(c => c.id === id);
                      return cat ? (
                        <Badge key={id} variant="outline">
                          {cat.names[0]}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {comments.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">评论</h3>
                  <div className="space-y-1">
                    {comments.map((comment, index) => (
                      <p key={index} className="text-sm text-gray-600">
                        • {comment}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              上传怡言
            </Button>
          )}
        </DialogTrigger>
        
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl">上传怡言</DialogTitle>
            <DialogDescription>
              请按照步骤上传您的图片
            </DialogDescription>
          </DialogHeader>

          {/* Progress Steps */}
          <div className="flex items-center justify-center py-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
                      index === currentStep
                        ? "bg-primary text-white"
                        : index < currentStep
                        ? "bg-primary/20 text-primary"
                        : "bg-gray-100 text-gray-400"
                    )}
                  >
                    {index < currentStep ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "w-12 h-1 mx-2 transition-colors",
                        index < currentStep ? "bg-primary" : "bg-gray-200"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          <div className="min-h-[400px] py-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  disabled={loading}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  上一步
                </Button>
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
              
              {currentStep < STEPS.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed() || loading}
                >
                  下一步
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleUpload}
                  disabled={loading}
                  className="min-w-[120px]"
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
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}