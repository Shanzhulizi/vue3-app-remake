// src/api/cosyvoice.js
import apiClient from "./axios";

// 可选：获取单个声音详情
export const getVoiceDetail = (voiceId) =>
  apiClient.get(`/cosyvoice2/voices/${voiceId}`);

// 可选：删除声音
export const deleteVoice = (voiceId) =>
  apiClient.delete(`/cosyvoice2/voices/${voiceId}`);

// 可选：更新声音信息
export const updateVoice = (voiceId, data) =>
  apiClient.put(`/cosyvoice2/voices/${voiceId}`, data);
