import { useUserStore } from '@/stores/user'

export const fetchStream = async (url, data, onMessage) => {

  const store = useUserStore()

  const res = await fetch(`http://localhost:8000/api${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${store.token}`
    },
    body: JSON.stringify(data)
  })

  const reader = res.body.getReader()
  const decoder = new TextDecoder("utf-8")

  while (true) {

    const { done, value } = await reader.read()

    if (done) break

    const chunk = decoder.decode(value)

    onMessage(chunk)

  }

}