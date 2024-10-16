import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

type EditStringListDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  imageHash: string;
  currentStrings: string[];
  setNeedFetchUpdatedImageInfo: (value: boolean) => void;
  displayString: string;
  onUpdate: (value: string) => void;
};

export function EditStringListDialog({
  isOpen,
  onClose,
  imageHash,
  currentStrings,
  setNeedFetchUpdatedImageInfo,
  displayString,
  onUpdate,
}: EditStringListDialogProps) {
  const [strings, setStrings] = useState<string[]>(currentStrings);
  const [newString, setNewString] = useState("");
  const { toast } = useToast();

  const handleAddString = () => {
    if (newString.trim() !== "" && !strings.includes(newString.trim())) {
      setStrings([...strings, newString.trim()]);
      setNewString("");
    }
  };

  const handleDeleteString = (str: string) => {
    setStrings(strings.filter((item) => item !== str));
  };

  const handleSave = async () => {
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
      });

      if (response.ok) {
        toast({
          title: "成功",
          description: `已更新${imageHash}的${displayString}列表`,
        });
        onUpdate(imageHash);
        onClose();
      } else {
        throw new Error("Failed to update strings");
      }
    } catch (error) {
      console.error("Error updating strings:", error);
      toast({
        title: "Error",
        description: "Failed to update strings. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>编辑{displayString}列表</DialogTitle>
        </DialogHeader>
        <div className="mb-4">
          <Label htmlFor="newString">添加新{displayString}</Label>
          <div className="flex space-x-2">
            <Input
              id="newString"
              value={newString}
              onChange={(e) => setNewString(e.target.value)}
              placeholder={`输入新${displayString}...`}
            />
            <Button onClick={handleAddString}>添加</Button>
          </div>
        </div>
        <ScrollArea className="h-[400px] rounded-md border p-4">
          <div className="space-y-2">
            {strings.map((str, index) => (
              <div key={index} className="flex items-center justify-between">
                <span>{str}</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteString(str)}
                >
                  删除
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            取消
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
