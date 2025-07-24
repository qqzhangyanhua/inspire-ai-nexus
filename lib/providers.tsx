"use client"

import React from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from "@/components/ui/tooltip"
import { createQueryClient } from './queryClient'

// 创建 QueryClient 实例
const queryClient = createQueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </QueryClientProvider>
  )
} 