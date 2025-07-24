import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  ensureStorageBucket,
  uploadFile,
} from "@/integrations/supabase/storage";
import { useAuth } from "@/hooks/useAuth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

interface UploadResponse {
  path: string;
  fullPath: string;
}

const Test = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string>("");
  const [bucketReady, setBucketReady] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();

  // 组件加载时确保存储桶存在
  useEffect(() => {
    const checkBucket = async () => {
      try {
        const ready = await ensureStorageBucket("images");
        setBucketReady(ready);
        if (ready) {
          console.log("存储桶已准备就绪");
        } else {
          console.error("存储桶不存在");
          toast({
            title: "存储桶不存在",
            description:
              "请在 Supabase 控制台创建 images 存储桶并配置 RLS 策略",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("检查存储桶时出错:", error);
        setBucketReady(false);
      }
    };

    checkBucket();
  }, [toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "请选择文件",
        description: "请先选择要上传的图片文件",
        variant: "destructive",
      });
      return;
    }

    if (!bucketReady) {
      toast({
        title: "存储未就绪",
        description: "存储系统未准备就绪，请稍后再试",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      // 使用封装的上传函数
      const result = await uploadFile(file, "images", "public");
      setUploadedUrl(result.fullPath);

      toast({
        title: "上传成功",
        description: "文件已成功上传到Supabase存储",
      });
    } catch (error: unknown) {
      console.error("上传错误:", error);
      const errorMessage =
        error instanceof Error ? error.message : "文件上传过程中发生错误";
      toast({
        title: "上传失败",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const uploadWithSessionToken = async () => {
    if (!file) {
      toast({
        title: "请选择文件",
        description: "请先选择要上传的图片文件",
        variant: "destructive",
      });
      return;
    }

    if (!session) {
      toast({
        title: "未登录",
        description: "请先登录以获取上传权限",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      // 生成唯一文件名
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()
        .toString(36)
        .substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      // 根据文档正确配置 S3 Session Token
      const s3 = new S3Client({
        forcePathStyle: true,
        region: import.meta.env.VITE_S3_REGION || "us-east-1",
        endpoint: import.meta.env.VITE_S3_ENDPOINT,
        credentials: {
          // Session Token 方式：accessKeyId = project_ref，secretAccessKey = anon_key
          accessKeyId: import.meta.env.VITE_SUPABASE_URL.split("//")[1].split(
            "."
          )[0], // 提取 project_ref
          secretAccessKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          sessionToken: session.access_token,
        },
      });

      // 上传到 S3
      const putCommand = new PutObjectCommand({
        Bucket: "images",
        Key: filePath,
        Body: file,
        ContentType: file.type,
        CacheControl: "3600",
      });

      await s3.send(putCommand);

      // 获取 public url
      const publicUrl = `${
        import.meta.env.VITE_SUPABASE_URL
      }/storage/v1/object/public/images/${filePath}`;
      setUploadedUrl(publicUrl);

      toast({
        title: "上传成功",
        description: "文件已通过 S3 Session Token 上传到 Supabase",
      });
    } catch (error: unknown) {
      console.error("S3 Session Token 上传错误:", error);
      const errorMessage =
        error instanceof Error ? error.message : "文件上传过程中发生错误";
      toast({
        title: "S3 Session Token 上传失败",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Supabase 存储测试</CardTitle>
          <CardDescription>
            测试 Supabase 存储上传（需要先创建 images 存储桶）
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Input
              id="picture"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>

          {!bucketReady && (
            <div className="p-3 bg-yellow-50 text-yellow-800 rounded-md">
              <p className="text-sm">
                存储桶不存在，请先在 Supabase 控制台创建 images 存储桶
              </p>
            </div>
          )}

          {!session && (
            <div className="p-3 bg-blue-50 text-blue-800 rounded-md">
              <p className="text-sm">Session Token 上传需要登录状态</p>
            </div>
          )}

          {uploadedUrl && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">已上传图片:</p>
              <img
                src={uploadedUrl}
                alt="Uploaded"
                className="w-full h-auto rounded-md border border-gray-200"
              />
              <p className="text-xs text-gray-500 mt-1 break-all">
                {uploadedUrl}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleUpload}
            disabled={!file || uploading || !bucketReady}
          >
            {uploading ? "上传中..." : "使用封装API上传"}
          </Button>
          <Button
            onClick={uploadWithSessionToken}
            disabled={!file || uploading || !session}
          >
            {uploading ? "上传中..." : "S3 Session Token上传"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Test;
