import Image from "next/image";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface QQAvatarListProps {
  likes: string[];
  maxDisplay?: number;
}

export function QQAvatarList({ likes, maxDisplay = 3 }: QQAvatarListProps) {
  const displayedLikes = likes.slice(0, maxDisplay);
  const remainingLikes = likes.length - maxDisplay;

  return (
    <div className="flex -space-x-2 overflow-hidden">
      {displayedLikes.map((qq) => (
        <TooltipProvider key={qq}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-block h-6 w-6 rounded-full overflow-hidden">
                <Image
                  src={`https://q1.qlogo.cn/g?b=qq&nk=${qq}&s=100`}
                  alt={`QQ: ${qq}`}
                  width={24}
                  height={24}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>QQ: {qq}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      {remainingLikes > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                +{remainingLikes}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>还有 {remainingLikes} 人赞同</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}