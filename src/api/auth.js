import apiClient from './axios'


// 用户注册
export const login = (data) =>
  apiClient.post('/auth/login', data)

export const register = (data) =>
  apiClient.post('/auth/register', data)


export const getCurrentUser = () => {
  return apiClient.get('/auth/me')
}
