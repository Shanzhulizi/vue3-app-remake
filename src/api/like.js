// api/like.js
import apiClient from './axios'

// 点赞
export const likeCharacter = (characterId) =>
  apiClient.post(`/character-like/${characterId}/like`)

// 取消点赞
export const unlikeCharacter = (characterId) =>
  apiClient.delete(`/character-like/${characterId}/like`)

// 获取点赞状态
export const getLikeStatus = (characterId) =>
  apiClient.get(`/character-like/${characterId}/like/status`)

// 获取点赞数
export const getLikeCount = (characterId) =>
  apiClient.get(`/character-like/${characterId}/likes`)

// 批量获取点赞状态（用于列表页）
export const batchGetLikeStatus = (characterIds) =>
  apiClient.post('/character-like/likes/batch-status', { character_ids: characterIds })