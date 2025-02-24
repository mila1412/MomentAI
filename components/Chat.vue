<template>
  <div class="chat">
    <!-- 模型選擇 -->
    <div class="chat__header">
      <div class="chat__toggle">
        <img class="chat__toggle-icon" src="~/assets/icon/sidebar.svg" />
      </div>
      <select v-model="modelName" class="chat__model">
        <option value="gpt-4o">GPT 4o</option>
        <option value="gpt-4o-mini">GPT 4o mini</option>
      </select>
    </div>

    <!-- 聊天區塊 -->
    <div class="chat__main">
      <ClientOnly>
        <div class="chat__history">
          {{ chatHistory?.content }}
        </div>
      </ClientOnly>

      <div class="chat__output">
        <div v-if="error">發生錯誤：{{ error }}</div>
        <div v-else-if="status === 'pending'">正在生成中...</div>
        <div v-else v-html="chatContent.replace(/\n/g, '<br>')"></div>
      </div>
    </div>

    <!-- 輸入框 -->
    <div class="chat__footer">
      <div class="chat__prompt">
        <div
          v-for="prompt in prompts"
          class="chat__prompt-option"
          @click="askPrompt(prompt)"
        >
          <p>{{ prompt.title }}</p>
          <p>{{ prompt.text }}</p>
        </div>
      </div>
      <div class="chat__input">
        <input
          v-model.trim="inputText"
          type="text"
          class="chat__input-field"
          placeholder="Send a message..."
          @keyup.enter="chat"
        />
        <div class="chat__input-actions">
          <img class="chat__input-icon" src="~/assets/icon/attach.svg" />
          <img
            class="chat__input-icon"
            :class="{ disabled: status === 'pending' }"
            src="~/assets/icon/send.svg"
            @click="chat"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useStorage } from "@vueuse/core";
const response = useStorage("response", []);

const status = ref("idle");
const error = ref(null);

const modelName = ref("gpt-4o"); // 輸入模型
const inputText = ref(""); // 輸入文字
const prompts = ref([
  { title: "問問今天的天氣吧", text: "台北的天氣如何呢？" },
  { title: "來點好吃好玩的吧", text: "萬華景點除了龍山寺？" },
]); // 輸入提示

const chatId = ref(""); // 輸出ID
const chatContent = ref(""); // 輸出內容

const props = defineProps({
  id: {
    type: String,
  },
});

const chatHistory = computed(() => {
  if (!props.id) return null;
  return response.value?.find((item) => item.id === props.id);
});

const processStreamResponse = async (res) => {
  for await (const chunk of res) {
    const lines = new TextDecoder().decode(chunk).split("\n");

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const json = JSON.parse(line.slice(6));
        if (!chatId.value && json?.id) chatId.value = json?.id;
        const content = json?.choices?.[0]?.delta?.content;
        if (content) chatContent.value += content;
      } catch (err) {
        console.error("JSON parse error:", err);
      }
    }
  }
};

const chat = async () => {
  if (!inputText.value) return;
  status.value = "pending";
  error.value = null;
  chatContent.value = "";

  const userInputText = inputText.value;
  inputText.value = "";

  try {
    const res = await $fetch("/api/chat", {
      method: "POST",
      body: {
        messages: [
          {
            role: "user",
            content: userInputText,
          },
        ],
        model: modelName.value,
        stream: true,
        momentx_id: "my_momentx_id",
      },
      responseType: "stream",
    });

    await processStreamResponse(res);
    response.value.push({
      id: chatId.value,
      content: chatContent.value,
      question: userInputText,
    });
  } catch (err) {
    error.value = err;
    console.error("串流處理錯誤:", err);
  } finally {
    status.value = "idle";
  }
};

const askPrompt = (prompt) => {
  inputText.value = prompt.text;
  chat();
};
</script>
