// api/recommend.js
import apiClient from './axios'

// 获取所有推荐（首页用）
export const getAllRecommends = (params = {}) => {
  return apiClient.get('/recommend/all', { params })
}

// 单独获取综合热门
export const getComprehensiveRecommend = (params = {}) => {
  return apiClient.get('/recommend/comprehensive', { params })
}

// 单独获取近期飙升
export const getTrendingRecommend = (params = {}) => {
  return apiClient.get('/recommend/trending', { params })
}

// 单独获取混合推荐
export const getMixedRecommend = (params = {}) => {
  return apiClient.get('/recommend/mixed', { params })
}