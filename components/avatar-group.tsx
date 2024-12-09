import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AvatarGroupProps {
  icon: React.ElementType;
  title: string;
  items: string[];
  maxDisplay?: number;
}

export function AvatarGroup({
  icon: Icon,
  title,
  items,
  maxDisplay = 5,
}: AvatarGroupProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold flex items-center space-x-2">
        <Icon className="h-5 w-5" />
        <span>{title}</span>
        <span className="text-muted-foreground">({items.length})</span>
      </h2>
      <div className="flex items-center">
        <div className="flex -space-x-2">
          {items.slice(0, maxDisplay).map((item, index) => (
            <Avatar key={index} className="border-2 border-background">
              <AvatarImage
                src={`https://q1.qlogo.cn/g?b=qq&nk=${item}&s=100`}
                alt={item}
              />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          ))}
          {items.length > maxDisplay && (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground text-sm font-medium border-2 border-background">
              +{items.length - maxDisplay}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 