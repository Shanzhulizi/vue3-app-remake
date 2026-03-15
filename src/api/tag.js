
import apiClient from './axios'




export const getTags = (params) => {
  return apiClient.get('/tag', { params })
}