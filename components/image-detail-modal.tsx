import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

type ImageData = {
  tags: string[];
  image_url: string;
  comment: string[];
  catalogue: string[];
  under_review: boolean;
  timestamp: string;
  uploader: {
    nickname: string;
    id: string;
    platform: string;
  };
  likes: string[];
};

type ImageDetailsModalProps = {
  image: ImageData
  isOpen: boolean
  onClose: () => void
}

export function ImageDetailsModal({ image, isOpen, onClose }: ImageDetailsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>怡言详情</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm">{new Date(image.timestamp).toLocaleString()}</p>
          <p className="text-sm">怡言ID: {image.image_url.split("/").pop()?.split(".")[0]}</p>
          {image.uploader.nickname !== "UNK" ? (
            <p className="text-sm">上传怡批: {image.uploader.nickname} ({image.uploader.id})</p>
          ) : (
            <p className="text-sm">管理员导入</p>
          )}
          {image.catalogue.length > 0 && (
            <p className="text-sm">所属怡批: {image.catalogue.join(", ")}</p>
          )}
          {image.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-1">Tags:</h3>
              <div className="flex flex-wrap gap-1">
                {image.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {image.comment.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-1">评论：</h3>
              <ul className="list-disc list-inside">
                {image.comment.map((comment, index) => (
                  <li key={index} className="text-sm">{comment}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

