// src/api/cosyvoice.js
import apiClient from "./axios";


// 可选：获取单个声音详情
export const getVoiceDetail = (voiceId) =>
  apiClient.get(`/cosyvoice/voices/${voiceId}`);

// 可选：删除声音
export const deleteVoice = (voiceId) =>
  apiClient.delete(`/cosyvoice/voices/${voiceId}`);

// 可选：更新声音信息
export const updateVoice = (voiceId, data) =>
  apiClient.put(`/cosyvoice/voices/${voiceId}`, data);
