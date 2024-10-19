import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Plus, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type EditStringListDialogProps = {
  isOpen: boolean
  onClose: () => void
  imageHash: string
  currentStrings: string[]
  setNeedFetchUpdatedImageInfo: (value: boolean) => void
  displayString: string
  onUpdate: (value: string) => void
}

export function EditStringListDialog({
  isOpen,
  onClose,
  imageHash,
  currentStrings,
  setNeedFetchUpdatedImageInfo,
  displayString,
  onUpdate,
}: EditStringListDialogProps) {
  const [strings, setStrings] = useState<string[]>(currentStrings)
  const [newString, setNewString] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleAddString = () => {
    if (newString.trim() !== "" && !strings.includes(newString.trim())) {
      setStrings([...strings, newString.trim()])
      setNewString("")
    }
  }

  const handleDeleteString = (str: string) => {
    setStrings(strings.filter((item) => item !== str))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_hash: imageHash,
          [displayString]: strings,
        }),
      })

      if (response.ok) {
        toast({
          title: "成功",
          description: `已更新${imageHash}的${displayString}列表`,
        })
        onUpdate(imageHash)
        onClose()
      } else {
        throw new Error("Failed to update strings")
      }
    } catch (error) {
      console.error("Error updating strings:", error)
      toast({
        title: "Error",
        description: "Failed to update strings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">编辑{displayString}列表</DialogTitle>
        </DialogHeader>
        <div className="mb-4">
          <Label htmlFor="newString" className="text-sm font-medium text-gray-700">
            添加新{displayString}
          </Label>
          <div className="flex space-x-2 mt-1">
            <Input
              id="newString"
              ref={inputRef}
              value={newString}
              onChange={(e) => setNewString(e.target.value)}
              placeholder={`输入新${displayString}...`}
              onKeyDown={(e) => e.key === "Enter" && handleAddString()}
              className="flex-grow"
            />
            <Button onClick={handleAddString} className="flex-shrink-0">
              <Plus className="w-4 h-4 mr-1" />
              添加
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[300px] rounded-md border p-4">
          <AnimatePresence>
            {strings.map((str, index) => (
              <motion.div
                key={str}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "flex items-center justify-between p-2 rounded-md",
                  index % 2 === 0 ? "bg-gray-50" : "bg-white"
                )}
              >
                <span className="text-sm">{str}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteString(str)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </ScrollArea>
        <DialogFooter className="mt-4">
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