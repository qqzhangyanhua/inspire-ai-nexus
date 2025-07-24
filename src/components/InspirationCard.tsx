"use client"

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useUserStore } from "@/stores/useUserStore";
import { useToast } from "@/hooks/use-toast";

interface InspirationCardProps {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  isFavorited: boolean;
}

const InspirationCard = ({ id, title, imageUrl, category, isFavorited }: InspirationCardProps) => {
  const { user, addToFavorites, removeFromFavorites } = useUserStore();
  const { toast } = useToast();

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "请先登录",
        description: "登录后才能收藏案例",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isFavorited) {
        await removeFromFavorites(id);
        toast({
          title: "取消收藏",
          description: "已从收藏夹中移除"
        });
      } else {
        await addToFavorites(id);
        toast({
          title: "收藏成功",
          description: "已添加到收藏夹"
        });
      }
    } catch (error) {
      toast({
        title: "操作失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    }
  };

  return (
    <Link href={`/case/${id}`}>
      <Card className="group overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-border bg-card animate-fade-in">
        {/* Image Container */}
        <div className="relative overflow-hidden">
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        {/* Content */}
        <div className="p-4 bg-card relative">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors duration-200">
              {title}
            </h3>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFavoriteClick}
              className="h-8 w-8 hover:bg-primary/10 transition-all duration-200"
            >
              <Heart 
                className={`w-4 h-4 transition-all duration-200 ${
                  isFavorited 
                    ? "fill-red-500 text-red-500 scale-110" 
                    : "text-muted-foreground hover:text-red-500"
                }`} 
              />
            </Button>
          </div>
          
          <span className="inline-block px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
            {category}
          </span>
        </div>
      </Card>
    </Link>
  );
};

export default InspirationCard;