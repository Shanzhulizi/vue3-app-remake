import apiClient from './axios'



// export const createCharacter = (formData) =>
export const createCharacter = (formData) => {
  return apiClient.post('/characters', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const updateCharacter = (id, formData) => {
  return apiClient.put(`/characters/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const getCharacterDetail = (id) => {
  return apiClient.get(`/characters/${id}`)
}
