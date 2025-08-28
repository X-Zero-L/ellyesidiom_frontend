"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, 
  Search, 
  Users, 
  Star, 
  Hash,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  Crown,
  Heart,
  Zap,
  UserCircle2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";

interface CatalogueOption {
  id: string;
  names: string[];
}

interface EPSelectorGridProps {
  catalogues: CatalogueOption[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  loading?: boolean;
  className?: string;
}

// Special EP IDs that should have special treatment
const SPECIAL_EPS: Record<string, { icon: any; color: string; label: string }> = {
  "981082801": { icon: Crown, color: "from-amber-500/20 to-yellow-500/20 border-amber-400", label: "主群" },
  "269077688": { icon: Star, color: "from-purple-500/20 to-pink-500/20 border-purple-400", label: "管理员" },
  "1025799490": { icon: Zap, color: "from-blue-500/20 to-cyan-500/20 border-blue-400", label: "管理员" },
  "1763471048": { icon: Heart, color: "from-red-500/20 to-pink-500/20 border-red-400", label: "管理员" },
};

// EP Card Component with QQ Avatar
const EPCard = ({ 
  ep, 
  isSelected, 
  onToggle,
  index 
}: { 
  ep: CatalogueOption; 
  isSelected: boolean; 
  onToggle: () => void;
  index: number;
}) => {
  const mainName = ep.names[0];
  const aliases = ep.names.slice(1);
  const [imageError, setImageError] = useState(false);
  
  // Check if this is a special EP
  const specialEP = SPECIAL_EPS[ep.id];
  const SpecialIcon = specialEP?.icon;
  
  // Generate QQ avatar URL
  const qqAvatarUrl = `https://q1.qlogo.cn/g?b=qq&nk=${ep.id}&s=100`;
  
  // Generate fallback color based on EP ID
  const colors = [
    'from-purple-500/20 to-pink-500/20 border-purple-300',
    'from-blue-500/20 to-cyan-500/20 border-blue-300',
    'from-green-500/20 to-emerald-500/20 border-green-300',
    'from-orange-500/20 to-red-500/20 border-orange-300',
    'from-indigo-500/20 to-purple-500/20 border-indigo-300',
    'from-teal-500/20 to-green-500/20 border-teal-300',
  ];
  
  const colorIndex = parseInt(ep.id) % colors.length;
  const colorClass = specialEP?.color || colors[colorIndex];

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ 
          delay: index * 0.03,
          type: "spring",
          stiffness: 300,
          damping: 24
        }}
        whileHover={{ scale: 1.03, y: -5 }}
        whileTap={{ scale: 0.97 }}
      >
        <div
          onClick={onToggle}
          className={`
            relative cursor-pointer rounded-2xl p-5 transition-all duration-300 h-full
            flex flex-col
            ${isSelected 
              ? `bg-gradient-to-br ${colorClass} border-2 shadow-xl` 
              : 'bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-lg'
            }
          `}
        >
          {/* Selected Indicator - Fixed Position */}
          <AnimatePresence>
            {isSelected && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                className="absolute -top-2 -right-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full p-1.5 shadow-lg z-10"
              >
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Special Badge - Fixed Height Container */}
          <div className="h-6 mb-2">
            {specialEP && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="secondary" 
                    className="px-1.5 py-0.5 text-xs bg-white/90 backdrop-blur-sm shadow-sm"
                  >
                    {specialEP.label}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>特殊身份</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* QQ Avatar - Fixed Size Container */}
          <div className="flex justify-center mb-3">
            <div className={`
              relative rounded-full overflow-hidden ring-4 transition-all
              ${isSelected ? 'ring-white shadow-lg' : 'ring-gray-100'}
            `}>
              <Avatar className="w-20 h-20">
                <AvatarImage 
                  src={qqAvatarUrl} 
                  alt={mainName}
                  onError={() => setImageError(true)}
                />
                <AvatarFallback className="bg-gradient-to-br from-purple-100 to-pink-100">
                  {imageError ? (
                    <UserCircle2 className="w-10 h-10 text-gray-400" />
                  ) : (
                    <div className="text-lg font-bold text-purple-600">
                      {mainName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </AvatarFallback>
              </Avatar>
              
              {/* Special Icon Overlay */}
              {SpecialIcon && (
                <motion.div 
                  className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <SpecialIcon className="w-4 h-4 text-amber-500" />
                </motion.div>
              )}
            </div>
          </div>

          {/* QQ ID - Fixed Height */}
          <div className="h-4 mb-1">
            <p className="text-xs text-gray-500 font-mono text-center">{ep.id}</p>
          </div>

          {/* Main Name - Fixed Height */}
          <div className="h-6 mb-2">
            <h3 className="font-semibold text-gray-900 text-center truncate px-2">
              {mainName}
            </h3>
          </div>

          {/* Aliases Container - Fixed Height */}
          <div className="h-12 flex flex-col justify-start">
            {aliases.length > 0 ? (
              <>
                {aliases.slice(0, 2).map((alias, i) => (
                  <p key={i} className="text-xs text-gray-500 text-center truncate px-2 leading-4">
                    {alias}
                  </p>
                ))}
                {aliases.length > 2 && (
                  <p className="text-xs text-gray-400 text-center leading-4">
                    +{aliases.length - 2} 更多
                  </p>
                )}
              </>
            ) : (
              <div className="text-xs text-gray-300 text-center">
                暂无别名
              </div>
            )}
          </div>

          {/* Hover Effect Overlay */}
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            animate={isSelected ? {
              boxShadow: [
                "0 0 0 0 rgba(147, 51, 234, 0)",
                "0 0 0 8px rgba(147, 51, 234, 0.1)",
                "0 0 0 0 rgba(147, 51, 234, 0)"
              ]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Sparkle Effect on Selected */}
          {isSelected && (
            <>
              <motion.div
                className="absolute top-3 right-3"
                animate={{ 
                  rotate: [0, 15, -15, 0],
                  scale: [1, 1.2, 0.8, 1]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
              >
                <Sparkles className="w-4 h-4 text-purple-600/40" />
              </motion.div>
              <motion.div
                className="absolute bottom-3 left-3"
                animate={{ 
                  rotate: [0, -15, 15, 0],
                  scale: [1, 0.8, 1.2, 1]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
              >
                <Sparkles className="w-3 h-3 text-pink-600/30" />
              </motion.div>
            </>
          )}
        </div>
      </motion.div>
    </TooltipProvider>
  );
};

export function EPSelectorGrid({
  catalogues,
  selectedIds,
  onSelectionChange,
  loading = false,
  className = ""
}: EPSelectorGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const itemsPerPage = 12;

  // Filter catalogues based on search
  const filteredCatalogues = useMemo(() => {
    if (!searchQuery.trim()) return catalogues;
    
    const query = searchQuery.toLowerCase();
    return catalogues.filter(cat => 
      cat.names.some(name => name.toLowerCase().includes(query)) ||
      cat.id.includes(query)
    );
  }, [catalogues, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredCatalogues.length / itemsPerPage);
  const paginatedCatalogues = filteredCatalogues.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery]);

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(sid => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    const allIds = filteredCatalogues.map(c => c.id);
    onSelectionChange(allIds);
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            选择所属怡批
            <Badge variant="outline" className="ml-2">
              {catalogues.length} 个
            </Badge>
          </h3>
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-2"
              >
                <Button
                  size="sm"
                  variant="outline"
                  onClick={selectAll}
                  className="text-purple-600 hover:text-purple-700"
                >
                  全选 ({filteredCatalogues.length})
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearSelection}
                  className="text-gray-500 hover:text-gray-700"
                >
                  清除选择 ({selectedIds.length})
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="搜索怡批名称、别名或QQ号..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results Count */}
        {searchQuery && (
          <motion.p 
            className="text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            找到 <span className="font-semibold text-purple-600">{filteredCatalogues.length}</span> 个结果
          </motion.p>
        )}
      </div>

      {/* Grid */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-[400px]"
            >
              <div className="text-center space-y-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="relative"
                >
                  <Users className="w-16 h-16 text-purple-600" />
                  <motion.div
                    className="absolute inset-0"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Users className="w-16 h-16 text-purple-600" />
                  </motion.div>
                </motion.div>
                <p className="text-gray-500">正在加载怡批列表...</p>
              </div>
            </motion.div>
          ) : filteredCatalogues.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-[400px]"
            >
              <div className="text-center space-y-3">
                <div className="relative">
                  <Users className="w-16 h-16 text-gray-300" />
                  <X className="w-8 h-8 text-gray-400 absolute bottom-0 right-0" />
                </div>
                <p className="text-gray-500">
                  {searchQuery ? "没有找到匹配的怡批" : "暂无怡批数据"}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`page-${currentPage}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {paginatedCatalogues.map((cat, index) => (
                <EPCard
                  key={cat.id}
                  ep={cat}
                  isSelected={selectedIds.includes(cat.id)}
                  onToggle={() => toggleSelection(cat.id)}
                  index={index}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div 
          className="flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            上一页
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => {
              // Show first, last, current and adjacent pages
              if (i === 0 || i === totalPages - 1 || 
                  (i >= currentPage - 1 && i <= currentPage + 1)) {
                return (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(i)}
                    className={`
                      w-8 h-8 rounded-lg text-sm font-medium transition-all
                      ${currentPage === i 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' 
                        : 'hover:bg-gray-100 text-gray-600'
                      }
                    `}
                  >
                    {i + 1}
                  </motion.button>
                );
              } else if (i === currentPage - 2 || i === currentPage + 2) {
                return <span key={i} className="text-gray-400">...</span>;
              }
              return null;
            })}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
            className="gap-1"
          >
            下一页
            <ChevronRight className="w-4 h-4" />
          </Button>
        </motion.div>
      )}

      {/* Selected Summary */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t pt-4"
          >
            <div className="flex items-start gap-3">
              <span className="text-sm text-gray-600 shrink-0">已选择:</span>
              <div className="flex flex-wrap gap-2">
                {selectedIds.slice(0, 5).map(id => {
                  const ep = catalogues.find(c => c.id === id);
                  return ep ? (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Badge 
                        variant="secondary" 
                        className="gap-1.5 pr-2 pl-1 py-1 bg-purple-100 hover:bg-purple-200 cursor-pointer"
                        onClick={() => toggleSelection(id)}
                      >
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={`https://q1.qlogo.cn/g?b=qq&nk=${id}&s=40`} />
                          <AvatarFallback className="text-[8px]">
                            {ep.names[0].slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        {ep.names[0]}
                        <X className="w-3 h-3 ml-1" />
                      </Badge>
                    </motion.div>
                  ) : null;
                })}
                {selectedIds.length > 5 && (
                  <Badge variant="outline">
                    +{selectedIds.length - 5} 更多
                  </Badge>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}