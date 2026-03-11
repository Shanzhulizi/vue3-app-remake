import apiClient from './axios'



// export const createCharacter = (formData) =>
//   apiClient.post('/characters/create', formData)

export const createCharacter = (formData) => {
  // 将 FormData 转回普通对象（如果有文件则不行）
  // 或者保持 FormData 但确保后端能处理
  return apiClient.post('/characters/create', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}


export const getCharacters = () =>
  apiClient.get('/characters/list')

export const getCharacterDetail = (character_id) =>
  apiClient.get(`/characters/${character_id}`)