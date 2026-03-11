import axios from 'axios'
import { useUserStore } from '@/stores/user'

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器：自动带 token
apiClient.interceptors.request.use((config) => {
  const store = useUserStore()
  if (store.token) {
    config.headers.Authorization = `Bearer ${store.token}`
  }
  return config
})

// 响应拦截器：统一返回 data
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error.response?.data || error)
  }
)

export default apiClient
