'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Error() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">获取图片详情失败</h1>
        <p className="text-muted-foreground">
          抱歉，无法加载图片详情。请稍后再试。
        </p>
        <div className="space-x-4">
          <Button onClick={() => router.back()}>返回上一页</Button>
          <Button variant="outline" onClick={() => router.refresh()}>
            重试
          </Button>
        </div>
      </div>
    </div>
  );
} 