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

// 生成音频
export const generateAudio = (data) =>
  apiClient.post("/voice/cosyvoice/generate", data, {
    timeout: 300000,
  });

// 生成音频
export const generateAudio2 = (data) =>
  apiClient.post("/voice/cosyvoice2/generate", data, {
    timeout: 300000,
  });




export const tts = (data) =>
  apiClient.post("/voice/tts", data,{
    timeout: 300000,
  })

  

// 获取20个声音
export const getGreatVoices = (params = {}) => {
  return apiClient.get('/voice/voices', {
    params: {
      skip: params.skip || 0,
      limit: params.limit || 20
    }
  })
}



// 获取所有中文声音
export const getChineseVoices = () => {
  return apiClient.get('/voice/chinese')
}

// 获取声音预览
export const previewVoice = (voiceCode) => {
  return apiClient.get(`/voice/preview/${voiceCode}`)
}


