import { supabase } from "./client";

/**
 * 检查存储桶是否存在
 * 注意：普通用户无法创建存储桶，需要在Supabase控制台手动创建
 */
export const ensureStorageBucket = async (
  bucketName: string = "images"
): Promise<boolean> => {
  try {
    // 检查存储桶是否存在
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();
    
    console.log("存储桶列表查询结果:", { buckets, error: listError });
    
    if (listError) {
      console.error("获取存储桶列表失败:", listError);
      
      // 如果是权限问题，尝试直接检查存储桶
      if (listError.message?.includes('permission') || listError.message?.includes('policy')) {
        console.log("检测到RLS权限问题，尝试直接检查存储桶是否可用...");
        return await checkBucketDirectly(bucketName);
      }
      
      return false;
    }

    // 检查指定的存储桶是否存在
    const bucketExists = buckets?.some((bucket) => bucket.name === bucketName);

    if (!bucketExists) {
      console.error(
        `存储桶 ${bucketName} 不存在，请在 Supabase 控制台手动创建并设置适当的 RLS 策略！`
      );
      console.log("当前存储桶列表:", buckets?.map(b => b.name));
      return false;
    }

    console.log(`存储桶 ${bucketName} 已存在并可用`);
    return true;
  } catch (error) {
    console.error("检查存储桶时发生错误:", error);
    console.log("尝试直接检查存储桶是否可用...");
    return await checkBucketDirectly(bucketName);
  }
};

/**
 * 直接尝试访问存储桶来检查是否存在（当 listBuckets 因 RLS 失败时的备选方案）
 */
const checkBucketDirectly = async (bucketName: string): Promise<boolean> => {
  try {
    console.log(`直接检查存储桶 ${bucketName} 是否可用...`);
    
    // 尝试列出存储桶中的文件，如果能访问说明存储桶存在且有权限
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 1 });
    
    if (error) {
      console.error(`直接检查存储桶失败:`, error);
      // 404 错误表示存储桶不存在
      if (error.message?.includes('The resource was not found') || error.message?.includes('404')) {
        console.error(`存储桶 ${bucketName} 不存在，请在 Supabase 控制台创建`);
        return false;
      }
      // 403 错误可能表示存储桶存在但没有权限
      if (error.message?.includes('permission') || error.message?.includes('403')) {
        console.warn(`存储桶 ${bucketName} 可能存在但缺少 RLS 策略权限`);
        return false;
      }
      return false;
    }
    
    console.log(`存储桶 ${bucketName} 可直接访问，权限正常`);
    return true;
  } catch (error) {
    console.error("直接检查存储桶时发生错误:", error);
    return false;
  }
};

/**
 * 上传文件到存储桶
 */
export const uploadFile = async (
  file: File,
  bucketName: string = "images",
  folderPath: string = "public"
): Promise<{ path: string; fullPath: string }> => {
  try {
    // 检查存储桶是否存在
    const bucketReady = await ensureStorageBucket(bucketName);
    if (!bucketReady) {
      throw new Error(
        `存储桶 ${bucketName} 不可用，请先在 Supabase 控制台创建并配置 RLS 策略`
      );
    }

    // 生成唯一文件名
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()
      .toString(36)
      .substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${folderPath}/${fileName}`;

    console.log(`开始上传文件到 ${bucketName}/${filePath}`);

    // 上传文件
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("上传文件时出错:", error);
      throw error;
    }

    console.log("文件上传成功:", data);

    // 获取公共访问URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return {
      path: data.path,
      fullPath: urlData.publicUrl,
    };
  } catch (error) {
    console.error("上传文件失败:", error);
    throw error;
  }
};

/**
 * 删除文件
 */
export const deleteFile = async (
  filePath: string,
  bucketName: string = "images"
): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("删除文件失败:", error);
    throw error;
  }
};
