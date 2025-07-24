// API 客户端助手函数
import { supabase } from './supabase'

// 获取认证token的辅助函数
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  }
}

// 认证相关API
export const authAPI = {
  // 登录
  login: async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    return response.json()
  },

  // 注册
  register: async (email: string, password: string, username?: string, displayName?: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username, displayName }),
    })
    return response.json()
  },

  // 登出
  logout: async () => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: await getAuthHeaders(),
    })
    return response.json()
  },

  // 获取会话
  getSession: async () => {
    const response = await fetch('/api/auth/session')
    return response.json()
  },
}

// 案例相关API
export const casesAPI = {
  // 获取案例列表
  getCases: async (params?: {
    page?: number
    limit?: number
    category?: string
    search?: string
    authorId?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.category) searchParams.append('category', params.category)
    if (params?.search) searchParams.append('search', params.search)
    if (params?.authorId) searchParams.append('authorId', params.authorId)

    const response = await fetch(`/api/cases?${searchParams}`)
    return response.json()
  },

  // 获取案例详情
  getCaseById: async (id: string) => {
    const response = await fetch(`/api/cases/${id}`)
    return response.json()
  },

  // 创建案例
  createCase: async (caseData: any) => {
    const response = await fetch('/api/cases', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(caseData),
    })
    return response.json()
  },

  // 更新案例
  updateCase: async (id: string, updateData: any) => {
    const response = await fetch(`/api/cases/${id}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(updateData),
    })
    return response.json()
  },

  // 删除案例
  deleteCase: async (id: string) => {
    const response = await fetch(`/api/cases/${id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    })
    return response.json()
  },
}

// 用户相关API
export const usersAPI = {
  // 获取用户资料
  getProfile: async (userId: string) => {
    const response = await fetch(`/api/users/profile?userId=${userId}`, {
      headers: await getAuthHeaders(),
    })
    return response.json()
  },

  // 更新用户资料
  updateProfile: async (userId: string, updateData: any) => {
    const response = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ userId, ...updateData }),
    })
    return response.json()
  },

  // 获取用户统计
  getStats: async (userId: string) => {
    const response = await fetch(`/api/users/stats?userId=${userId}`, {
      headers: await getAuthHeaders(),
    })
    return response.json()
  },
}

// 收藏相关API
export const favoritesAPI = {
  // 获取收藏列表
  getFavorites: async (userId: string, withDetails = false) => {
    const response = await fetch(`/api/favorites?userId=${userId}&withDetails=${withDetails}`, {
      headers: await getAuthHeaders(),
    })
    return response.json()
  },

  // 切换收藏状态
  toggleFavorite: async (caseId: string) => {
    const response = await fetch('/api/favorites', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ caseId }),
    })
    return response.json()
  },
}

// 评论相关API
export const commentsAPI = {
  // 获取评论列表
  getComments: async (caseId: string) => {
    const response = await fetch(`/api/comments?caseId=${caseId}`)
    return response.json()
  },

  // 创建评论
  createComment: async (commentData: any) => {
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(commentData),
    })
    return response.json()
  },
}

// 文件上传API
export const uploadAPI = {
  // 上传文件
  uploadFile: async (file: File, bucket = 'images', folder = 'public') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', bucket)
    formData.append('folder', folder)

    const { data: { session } } = await supabase.auth.getSession()
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: formData,
    })
    return response.json()
  },
} 