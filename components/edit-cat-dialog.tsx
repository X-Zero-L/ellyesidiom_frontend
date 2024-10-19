import { useState, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Search, Check } from "lucide-react"
import { cn } from "@/lib/utils"

type CatalogueData = {
  [key: string]: string[];
}

type EditCatalogueDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  imageHash: string;
  currentCatalogue: string[];
  catalogueData: CatalogueData;
  setNeedFetchUpdatedImageInfo: (value: boolean) => void;
  onUpdate: (value: string) => void;
}

export function EditCatalogueDialog({
  isOpen,
  onClose,
  imageHash,
  currentCatalogue,
  catalogueData,
  setNeedFetchUpdatedImageInfo,
  onUpdate,
}: EditCatalogueDialogProps) {
  const [selectedCatalogue, setSelectedCatalogue] = useState<string[]>(currentCatalogue)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/edit_catalogue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_hash: imageHash,
          catalogue: selectedCatalogue,
        }),
      })

      if (response.ok) {
        toast({
          title: "成功",
          description: `已更新${imageHash}所属的怡批`,
        })
        onUpdate(imageHash)
        onClose()
      } else {
        throw new Error("Failed to update catalogue")
      }
    } catch (error) {
      console.error("Error updating catalogue:", error)
      toast({
        title: "Error",
        description: "Failed to update catalogue. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCatalogueData = Object.entries(catalogueData).filter(
    ([key, values]) =>
      key.includes(searchTerm) ||
      values.some((value) =>
        value.toLowerCase().includes(searchTerm.toLowerCase())
      )
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">编辑怡批</DialogTitle>
        </DialogHeader>
        <div className="mb-4 relative">
          <Label htmlFor="search" className="sr-only">搜索怡批</Label>
          <Input
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="输入关键词搜索..."
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        </div>
        <ScrollArea className="h-[400px] rounded-md border p-4">
          <AnimatePresence>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredCatalogueData.map(([key, values]) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Label
                    htmlFor={key}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer w-full"
                  >
                    <div className="relative w-10 h-10 flex-shrink-0">
                      <Image
                        src={`https://q1.qlogo.cn/g?b=qq&nk=${key}&s=100`}
                        alt={`QQ Avatar for ${key}`}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-full"
                      />
                    </div>
                    <div className="flex-grow min-w-0">
                      <span className="text-sm font-medium block truncate">{values[0]}</span>
                      <p className="text-xs text-gray-500 truncate">{key}</p>
                      <p className="text-xs text-gray-500 truncate">{values.slice(1).join(", ")}</p>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      <input
                        type="checkbox"
                        id={key}
                        checked={selectedCatalogue.includes(key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCatalogue([...selectedCatalogue, key])
                          } else {
                            setSelectedCatalogue(
                              selectedCatalogue.filter((item) => item !== key)
                            )
                          }
                        }}
                        className="sr-only"
                      />
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-200",
                          selectedCatalogue.includes(key)
                            ? "bg-primary border-primary"
                            : "border-gray-300"
                        )}
                      >
                        {selectedCatalogue.includes(key) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>
                  </Label>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            取消
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              "保存"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}