// api/voice.js
import apiClient from './axios'

// 获取所有中文声音
export const getChineseVoices = () => {
  return apiClient.get('/voice/chinese')
}

// // 获取所有声音（按语言分组）
// export const getAllVoices = () => {
//   return apiClient.get('/voices/all')
// }

// 获取声音预览
export const previewVoice = (voiceCode) => {
  return apiClient.get(`/voice/preview/${voiceCode}`)
}





// 以下为cosyvoice的相关接口