import { NextRequest, NextResponse } from 'next/server'
import { supabaseAuth } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const bucketName = formData.get('bucket') as string || 'images'
    const folderPath = formData.get('folder') as string || 'public'

    if (!file) {
      return NextResponse.json(
        { error: '请选择要上传的文件' },
        { status: 400 }
      )
    }

    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '不支持的文件类型，请上传图片文件' },
        { status: 400 }
      )
    }

    // 检查文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '文件大小不能超过5MB' },
        { status: 400 }
      )
    }

    // 生成唯一文件名
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
    const filePath = `${folderPath}/${fileName}`

    // 将File转换为ArrayBuffer然后为Uint8Array
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    // 上传文件到Supabase Storage
    const { data, error } = await supabaseAuth.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('文件上传错误:', error)
      return NextResponse.json(
        { error: `文件上传失败: ${error.message}` },
        { status: 400 }
      )
    }

    // 获取公共访问URL
    const { data: urlData } = supabaseAuth.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    return NextResponse.json({
      message: '文件上传成功',
      path: data.path,
      url: urlData.publicUrl,
    })
  } catch (error) {
    console.error('文件上传处理错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
} 