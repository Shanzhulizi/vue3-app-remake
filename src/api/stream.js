import { useUserStore } from "@/stores/user";

export const fetchStream = async (url, data, onMessage) => {
  const store = useUserStore();
  
  try {
    const res = await fetch(`http://localhost:8000/api${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${store.token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      // 处理HTTP错误
      const errorText = await res.text();
      onMessage(`[系统错误: HTTP ${res.status}]`);
      return;
    }

    if (!res.body) {
      onMessage(`[系统错误: 服务器未返回数据]`);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      
      if (chunk.trim()) {
        onMessage(chunk);
      }
    }
  } catch (error) {
    console.error('fetchStream 错误:', error);
    
    // 处理网络错误
    let errorMsg = '[系统错误: 网络连接失败]';
    if (error.message.includes('Failed to fetch')) {
      errorMsg = '[系统错误: 无法连接到服务器]';
    }
    onMessage(errorMsg);
  }
};