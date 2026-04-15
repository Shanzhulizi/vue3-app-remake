// api/voice.js
import apiClient from './axios'

// 创建声音
export const createVoice = (formData) =>
  apiClient.post("/voice/create", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// 获取所有声音列表
export const getVoices = () => apiClient.get("/voice/voices");


export const tts = (data) =>
  apiClient.post("/voice/tts", data,{
    timeout: 300000,
  })

  


