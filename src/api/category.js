
import apiClient from './axios'





export const getCategories = (params) => {
  return apiClient.get('/category', { params })
}
