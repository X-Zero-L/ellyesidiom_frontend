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
  ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

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

// EP Card Component
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
  
  // Generate consistent color based on EP ID
  const colors = [
    'from-purple-500/20 to-pink-500/20 border-purple-300',
    'from-blue-500/20 to-cyan-500/20 border-blue-300',
    'from-green-500/20 to-emerald-500/20 border-green-300',
    'from-orange-500/20 to-red-500/20 border-orange-300',
    'from-indigo-500/20 to-purple-500/20 border-indigo-300',
    'from-teal-500/20 to-green-500/20 border-teal-300',
  ];
  
  const colorIndex = parseInt(ep.id) % colors.length;
  const colorClass = colors[colorIndex];
  
  // Icons based on name patterns
  const getIcon = () => {
    const lowerName = mainName.toLowerCase();
    if (lowerName.includes('主群') || lowerName.includes('ellye')) return <Star className="w-5 h-5" />;
    if (lowerName.includes('群')) return <Users className="w-5 h-5" />;
    return <Hash className="w-5 h-5" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.02 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        onClick={onToggle}
        className={`
          relative cursor-pointer rounded-2xl p-4 transition-all duration-200
          ${isSelected 
            ? `bg-gradient-to-br ${colorClass} border-2 shadow-lg` 
            : 'bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 shadow-sm'
          }
        `}
      >
        {/* Selected Indicator */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-2 -right-2 bg-purple-600 rounded-full p-1 shadow-md"
            >
              <Check className="w-4 h-4 text-white" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Icon */}
        <div className={`
          flex items-center justify-center w-12 h-12 rounded-xl mb-3
          ${isSelected ? 'bg-white/80' : 'bg-gray-100'}
        `}>
          {getIcon()}
        </div>

        {/* Main Name */}
        <h3 className="font-semibold text-gray-900 mb-1 truncate">
          {mainName}
        </h3>

        {/* Aliases */}
        {aliases.length > 0 && (
          <div className="space-y-1">
            {aliases.slice(0, 2).map((alias, i) => (
              <p key={i} className="text-xs text-gray-500 truncate">
                {alias}
              </p>
            ))}
            {aliases.length > 2 && (
              <p className="text-xs text-gray-400">
                +{aliases.length - 2} 更多
              </p>
            )}
          </div>
        )}

        {/* Sparkle Effect on Selected */}
        {isSelected && (
          <motion.div
            className="absolute top-2 right-2"
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            <Sparkles className="w-4 h-4 text-purple-600/60" />
          </motion.div>
        )}
      </div>
    </motion.div>
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
  const itemsPerPage = 12;

  // Filter catalogues based on search
  const filteredCatalogues = useMemo(() => {
    if (!searchQuery.trim()) return catalogues;
    
    const query = searchQuery.toLowerCase();
    return catalogues.filter(cat => 
      cat.names.some(name => name.toLowerCase().includes(query))
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
          </h3>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
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

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="搜索怡批名称或别名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Results Count */}
        {searchQuery && (
          <p className="text-sm text-gray-500">
            找到 {filteredCatalogues.length} 个结果
          </p>
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
                >
                  <Users className="w-12 h-12 text-purple-600" />
                </motion.div>
                <p className="text-gray-500">加载中...</p>
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
                <Users className="w-12 h-12 text-gray-300" />
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
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
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
        <div className="flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`
                  w-8 h-8 rounded-lg text-sm font-medium transition-all
                  ${currentPage === i 
                    ? 'bg-purple-600 text-white' 
                    : 'hover:bg-gray-100 text-gray-600'
                  }
                `}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Selected Summary */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t pt-3"
          >
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>已选择:</span>
              <div className="flex flex-wrap gap-2">
                {selectedIds.slice(0, 3).map(id => {
                  const ep = catalogues.find(c => c.id === id);
                  return ep ? (
                    <Badge key={id} variant="secondary">
                      {ep.names[0]}
                    </Badge>
                  ) : null;
                })}
                {selectedIds.length > 3 && (
                  <Badge variant="outline">
                    +{selectedIds.length - 3} 更多
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