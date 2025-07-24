"use client"

import { QueryClient } from '@tanstack/react-query'

// 创建一个函数来生成新的 QueryClient 实例
export const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
})

// 导出一个实例供客户端使用
export const queryClient = createQueryClient() 