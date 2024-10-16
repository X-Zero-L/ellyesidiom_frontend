import { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";

type CatalogueData = {
  [key: string]: string[];
};

type EditCatalogueDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  imageHash: string;
  currentCatalogue: string[];
  catalogueData: CatalogueData;
  setNeedFetchUpdatedImageInfo: (value: boolean) => void;
};

export function EditCatalogueDialog({
  isOpen,
  onClose,
  imageHash,
  currentCatalogue,
  catalogueData,
  setNeedFetchUpdatedImageInfo,
}: EditCatalogueDialogProps) {
  const [selectedCatalogue, setSelectedCatalogue] =
    useState<string[]>(currentCatalogue);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const handleSave = async () => {
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
      });

      if (response.ok) {
        toast({
          title: "成功",
          description: `已更新${imageHash}所属的怡批`,
        });
        setNeedFetchUpdatedImageInfo(true);
        onClose();
      } else {
        throw new Error("Failed to update catalogue");
      }
    } catch (error) {
      console.error("Error updating catalogue:", error);
      toast({
        title: "Error",
        description: "Failed to update catalogue. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredCatalogueData = Object.entries(catalogueData).filter(
    ([key, values]) =>
      key.includes(searchTerm) ||
      values.some((value) =>
        value.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>编辑怡批</DialogTitle>
        </DialogHeader>
        <div className="mb-4">
          <Label htmlFor="search">搜索怡批</Label>
          <Input
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="输入关键词搜索..."
          />
        </div>
        <ScrollArea className="h-[400px] rounded-md border p-4">
          <div className="grid grid-cols-2 gap-4">
            {filteredCatalogueData.map(([key, values]) => (
              <div key={key} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={key}
                  checked={selectedCatalogue.includes(key)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCatalogue([...selectedCatalogue, key]);
                    } else {
                      setSelectedCatalogue(
                        selectedCatalogue.filter((item) => item !== key)
                      );
                    }
                  }}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor={key}>
                  {key} ({values.join(", ")})
                </Label>
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
