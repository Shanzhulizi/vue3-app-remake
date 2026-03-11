// api/voice.js
import apiClient from './axios'

// 创建声音模型
export const createVoiceModel = (formData) => {
  return apiClient.post('/xtts/models/create', formData, {
    
    timeout: 300000,  // 增加到 300 秒（5分钟）
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 获取我的声音模型列表
export const getMyVoiceModels = () => {
  return apiClient.get('/xtts/models/list')
}

// 获取声音模型详情
export const getVoiceModelDetail = (modelCode) => {
  return apiClient.get(`/xtts/models/${modelCode}`)
}

// 删除声音模型
export const deleteVoiceModel = (modelCode) => {
  return apiClient.delete(`/xtts/models/${modelCode}`)
}

// 预览声音模型（可选）
export const previewVoiceModel = (modelCode) => {
  return apiClient.get(`/xtts/models/${modelCode}/preview`)
}