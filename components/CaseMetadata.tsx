
import { Copy, ChevronDown, ChevronUp, Heart, Eye, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { copyToClipboard } from "@/lib/utils";

interface CaseMetadataProps {
  caseData: {
    id: string;
    title: string;
    description: string;
    tags: string[];
    prompt: string;
    view_count: number;
    like_count: number;
    created_at: string;
    author?: {
      display_name: string;
      username: string;
      avatar_url: string | null;
    };
  };
  isLiked?: boolean;
  onToggleLike?: () => void;
}

const CaseMetadata = ({ caseData, isLiked = false, onToggleLike }: CaseMetadataProps) => {
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);

  const copyPrompt = async () => {
    const success = await copyToClipboard(caseData.prompt);
    
    if (success) {
      toast({
        title: "提示词已复制！",
        description: "AI提示词已复制到剪贴板",
      });
    } else {
      toast({
        title: "复制失败",
        description: "请手动选择并复制提示词",
        variant: "destructive",
      });
    }
  };

  // 从prompt生成结构化分解（如果没有的话）
  const generateStructuredBreakdown = () => {
    const prompt = caseData.prompt.toLowerCase();
    const breakdown = [];

    // 基于关键词分析生成结构化信息
    if (prompt.includes('毛玻璃') || prompt.includes('透明') || prompt.includes('磨砂')) {
      breakdown.push({ emoji: "🎨", title: "风格", value: "毛玻璃风格，透明效果" });
    } else if (prompt.includes('极简') || prompt.includes('简洁')) {
      breakdown.push({ emoji: "🎨", title: "风格", value: "极简主义设计" });
    } else if (prompt.includes('新拟物') || prompt.includes('阴影')) {
      breakdown.push({ emoji: "🎨", title: "风格", value: "新拟物主义风格" });
    } else {
      breakdown.push({ emoji: "🎨", title: "风格", value: "现代设计风格" });
    }

    if (prompt.includes('仪表板') || prompt.includes('dashboard')) {
      breakdown.push({ emoji: "📊", title: "类型", value: "数据分析仪表板" });
    } else if (prompt.includes('登录') || prompt.includes('表单')) {
      breakdown.push({ emoji: "🔐", title: "类型", value: "登录表单界面" });
    } else if (prompt.includes('博客') || prompt.includes('文章')) {
      breakdown.push({ emoji: "📝", title: "类型", value: "博客内容展示" });
    } else if (prompt.includes('计算器')) {
      breakdown.push({ emoji: "🧮", title: "类型", value: "交互式计算器" });
    } else {
      breakdown.push({ emoji: "📱", title: "类型", value: "用户界面组件" });
    }

    // 颜色分析
    if (prompt.includes('蓝色') || prompt.includes('blue')) {
      breakdown.push({ emoji: "🎨", title: "颜色", value: "蓝色主题" });
    } else if (prompt.includes('紫色') || prompt.includes('purple')) {
      breakdown.push({ emoji: "🎨", title: "颜色", value: "紫色主题" });
    } else if (prompt.includes('渐变')) {
      breakdown.push({ emoji: "🌈", title: "颜色", value: "渐变色彩" });
    } else {
      breakdown.push({ emoji: "🎨", title: "颜色", value: "现代配色方案" });
    }

    // 效果分析
    if (prompt.includes('动画') || prompt.includes('交互')) {
      breakdown.push({ emoji: "✨", title: "效果", value: "交互动画效果" });
    } else if (prompt.includes('阴影') || prompt.includes('shadow')) {
      breakdown.push({ emoji: "✨", title: "效果", value: "阴影与深度" });
    } else {
      breakdown.push({ emoji: "✨", title: "效果", value: "微妙视觉效果" });
    }

    return breakdown;
  };

  const structuredBreakdown = generateStructuredBreakdown();

  return (
    <div className="space-y-6">
      {/* Title and Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{caseData.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {caseData.description && (
            <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
              {caseData.description}
            </p>
          )}
          
          {/* Tags */}
          {caseData.tags && caseData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {caseData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Statistics */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{caseData.view_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-red-500' : ''}`} />
              <span>{caseData.like_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(caseData.created_at).toLocaleDateString('zh-CN')}</span>
            </div>
          </div>

          {/* Like Button */}
          {onToggleLike && (
            <Button 
              onClick={onToggleLike}
              variant={isLiked ? "default" : "outline"}
              className="w-full mb-4"
            >
              <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
              {isLiked ? '已点赞' : '点赞'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Author Info */}
      {caseData.author && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">创建者</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={caseData.author.avatar_url || undefined} />
                <AvatarFallback>
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{caseData.author.display_name}</p>
                <p className="text-sm text-muted-foreground">@{caseData.author.username}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prompt Box */}
      {caseData.prompt && (
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">AI 提示词</CardTitle>
              <Button onClick={copyPrompt} variant="outline" size="sm">
                <Copy className="w-4 h-4 mr-2" />
                复制
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {caseData.prompt}
              </p>
            </div>

            {/* Structured Breakdown */}
            <Collapsible open={isBreakdownOpen} onOpenChange={setIsBreakdownOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <span className="text-sm font-medium">结构化分析</span>
                  {isBreakdownOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-4">
                <div className="space-y-3">
                  {structuredBreakdown.map((item, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
                      <span className="text-lg" role="img" aria-label={item.title}>
                        {item.emoji}
                      </span>
                      <div className="flex-1">
                        <dt className="font-medium text-sm">
                          {item.title}
                        </dt>
                        <dd className="text-muted-foreground text-sm mt-1">
                          {item.value}
                        </dd>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CaseMetadata;
