// src/api/cosyvoice.js
import apiClient from "./axios";

// 创建声音
export const createVoice = (formData) =>
  apiClient.post("/cosyvoice2/create", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// 获取所有声音列表
export const getVoices = () => apiClient.get("/cosyvoice2/voices");

// 生成音频
export const generateAudio = (data) =>
  apiClient.post("/cosyvoice2/generate", data, {
    timeout: 300000,
  });

// 可选：获取单个声音详情
export const getVoiceDetail = (voiceId) =>
  apiClient.get(`/cosyvoice2/voices/${voiceId}`);

// 可选：删除声音
export const deleteVoice = (voiceId) =>
  apiClient.delete(`/cosyvoice2/voices/${voiceId}`);

// 可选：更新声音信息
export const updateVoice = (voiceId, data) =>
  apiClient.put(`/cosyvoice2/voices/${voiceId}`, data);
