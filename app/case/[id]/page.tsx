'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/stores/useUserStore';
import Header from '@/components/Header';
import LivePreview from '@/components/LivePreview';
import CodeEditor from '@/components/CodeEditor';
import CaseMetadata from '@/components/CaseMetadata';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface CaseData {
  id: string;
  title: string;
  description: string;
  image_url: string;
  author_id: string;
  prompt: string;
  html_content: string;
  css_content: string | null;
  javascript_content: string | null;
  code_content: string | null; // 保持兼容性，旧数据可能还有这个字段
  preview_url: string | null;
  tags: string[];
  view_count: number;
  like_count: number;
  status: string;
  created_at: string;
  updated_at: string;
  // 作者信息
  author?: {
    display_name: string;
    username: string;
    avatar_url: string | null;
  };
}

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, favoriteIds, addToFavorites, removeFromFavorites } = useUserStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);

  const id = params.id as string;

  // 获取案例详情
  const fetchCaseDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // 增加浏览量
      await supabase.rpc('increment_case_view_count', { case_id: id });

      // 获取案例详情和作者信息
      const { data: caseInfo, error } = await supabase
        .from('cases')
        .select(`
          *,
          profiles:author_id (
            display_name,
            username,
            avatar_url
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('获取案例详情失败:', error);
        toast({
          title: '获取失败',
          description: '无法获取案例详情，请稍后再试',
          variant: 'destructive',
        });
        return;
      }

      if (!caseInfo) {
        toast({
          title: '案例不存在',
          description: '该案例可能已被删除或不存在',
          variant: 'destructive',
        });
        router.push('/');
        return;
      }

      // 检查案例状态
      if (caseInfo.status !== 'published' && caseInfo.author_id !== user?.id) {
        toast({
          title: '案例不可访问',
          description: '该案例尚未发布或您没有访问权限',
          variant: 'destructive',
        });
        router.push('/');
        return;
      }

      const transformedData: CaseData = {
        ...caseInfo,
        author: caseInfo.profiles ? {
          display_name: caseInfo.profiles.display_name || '未知用户',
          username: caseInfo.profiles.username || 'unknown',
          avatar_url: caseInfo.profiles.avatar_url
        } : undefined
      };

      setCaseData(transformedData);
      setIsLiked(favoriteIds.includes(id));

    } catch (error) {
      console.error('获取案例详情失败:', error);
      toast({
        title: '获取失败',
        description: '网络错误，请检查网络连接',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetail();
  }, [id]);

  useEffect(() => {
    if (id) {
      setIsLiked(favoriteIds.includes(id));
    }
  }, [favoriteIds, id]);

  // 处理点赞
  const handleToggleLike = async () => {
    if (!user || !id) {
      toast({
        title: '请先登录',
        description: '登录后才能点赞案例',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isLiked) {
        await removeFromFavorites(id);
        toast({
          title: '取消点赞',
          description: '已取消点赞该案例',
        });
      } else {
        await addToFavorites(id);
        toast({
          title: '点赞成功',
          description: '感谢您的支持！',
        });
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
      toast({
        title: '操作失败',
        description: '点赞操作失败，请稍后再试',
        variant: 'destructive',
      });
    }
  };

  // 解析代码内容 - 优先使用新的分离字段
  const parseCodeContent = (caseData: CaseData) => {
    // 优先使用新的分离字段
    if (caseData.html_content) {
      const html = caseData.html_content || '';
      const css = caseData.css_content || '';
      const javascript = caseData.javascript_content || '';
      
      // 检测HTML内容中是否使用了Tailwind类名
      const tailwindClassPattern = /class\s*=\s*["'][^"']*(?:bg-|text-|p-|m-|w-|h-|flex|grid|rounded|shadow|border|hover:|focus:|md:|lg:|xl:)/;
      const usesTailwind = tailwindClassPattern.test(html);
      
      // 检查HTML是否已经包含Tailwind CDN
      const hasTailwindCDN = html.includes('tailwindcss.com') || html.includes('cdn.tailwindcss.com');
      
      // 如果使用了Tailwind类名但没有CDN引用，需要在LivePreview中自动加载
      if (usesTailwind && !hasTailwindCDN) {
        // 通过特殊标记告诉LivePreview需要加载Tailwind
        return {
          html: html + '<!-- NEEDS_TAILWIND -->',
          css,
          javascript
        };
      }
      
      return {
        html,
        css,
        javascript
      };
    }

    // 兼容旧的code_content字段
    if (caseData.code_content) {
      // 尝试解析为JSON格式（旧的混合格式）
      try {
        const parsed = JSON.parse(caseData.code_content);
        if (parsed.html !== undefined) {
          return {
            html: parsed.html || '',
            css: parsed.css || '',
            javascript: parsed.javascript || ''
          };
        }
      } catch {
        // 如果不是JSON，说明是旧格式的HTML片段
      }

      // 处理简单HTML片段或URL格式（旧格式）
      const isUrl = caseData.code_content.startsWith('http');
      const isSimpleHtml = caseData.code_content.includes('<') && caseData.code_content.includes('>');

      if (isUrl) {
        // 如果是URL，返回一个iframe展示
        return {
          html: `<iframe src="${caseData.code_content}" width="100%" height="400px" frameborder="0"></iframe>`,
          css: `body { margin: 0; padding: 0; }`,
          javascript: ''
        };
      } else if (isSimpleHtml) {
        // 如果是简单HTML片段，包装成完整页面
        return {
          html: caseData.code_content,
          css: `
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 2rem;
              background: #f8f9fa;
            }
            .blog {
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1, h2, h3 {
              color: #2c3e50;
              margin-bottom: 1rem;
            }
            p {
              margin-bottom: 1rem;
              color: #555;
            }
          `,
          javascript: ''
        };
      }
    }

    // 默认处理
    return {
      html: `<div style="padding: 2rem; text-align: center; color: #666;">
              <h3>预览暂不可用</h3>
              <p>该案例的预览内容格式暂不支持。</p>
             </div>`,
      css: '',
      javascript: ''
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">加载案例详情中...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-background">
        <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">案例不存在</h1>
            <p className="text-muted-foreground">该案例可能已被删除或不存在</p>
          </div>
        </div>
      </div>
    );
  }

  const parsedCode = parseCodeContent(caseData);

  return (
    <div className="min-h-screen bg-background">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Content */}
          <div className="lg:col-span-2 space-y-6">
            <LivePreview 
              html={parsedCode.html}
              css={parsedCode.css}
              javascript={parsedCode.javascript}
            />
            
            <CodeEditor 
              html={parsedCode.html}
              css={parsedCode.css}
              javascript={parsedCode.javascript}
            />
          </div>
          
          {/* Right Column - Metadata */}
          <div className="lg:col-span-1">
            <CaseMetadata 
              caseData={caseData} 
              isLiked={isLiked}
              onToggleLike={handleToggleLike}
            />
          </div>
        </div>
      </main>
    </div>
  );
}