<template>
  <div class="chat-block">
    <div v-if="error">發生錯誤：{{ error.message }}</div>

    <div v-if="status === 'idle'">
      <button @click="chat">開始生成</button>
    </div>

    <div v-else-if="status === 'pending'">正在生成中...</div>

    <div v-else-if="message" v-html="message.replace(/\n/g, '<br>')"></div>
  </div>
</template>

<script setup>
import { useStorage } from "@vueuse/core";
const message = ref("");
const chatHistory = useStorage("message");

const { error, execute, status } = useFetch("/api/chat", {
  method: "POST",
  body: {
    messages: [
      {
        role: "user",
        content: "你是一個好助理",
      },
    ],
    model: "gpt-4o",
    stream: true,
    momentx_id: "my_momentx_id",
  },
  // 必要，
  responseType: "stream",
  immediate: false,
  async onResponse({ response }) {
    // 清空之前的訊息
    message.value = "";
    try {
      // 處理串流數據
      // chunk 資料格式是 Uint8Array
      for await (const chunk of response._data) {
        const lines = new TextDecoder().decode(chunk).split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(line.slice(6));
            const content = json?.choices?.[0]?.delta?.content;

            if (content) {
              message.value += content;
            }
          } catch (err) {
            console.error("JSON parse error:", err);
            continue;
          }
        }
      }

      chatHistory.value = message.value;
    } catch (err) {
      console.error("串流處理錯誤:", err);
      throw err;
    }
  },
});

const chat = () => {
  execute();
};
</script>
