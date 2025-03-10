<template>
  <div class="chat">
    <!-- 模型選擇 -->
    <div class="chat__header">
      <div class="chat__toggle">
        <img
          class="icon"
          src="~/assets/icon/toggle.svg"
          @click="isOpen = !isOpen"
        />
      </div>
      <select v-model="modelName" class="chat__model">
        <option value="gpt-4o">GPT 4o</option>
        <option value="gpt-4o-mini">GPT 4o mini</option>
      </select>
    </div>

    <!-- 聊天區塊 -->
    <div class="chat__main">
      <ClientOnly>
        <div
          v-for="(history, id) in chatHistory?.content"
          :key="id"
          class="chat__history"
        >
          <div class="chat__history-input">{{ history.input }}</div>
          <div v-html="history.output.replace(/\n/g, '<br>')"></div>
        </div>
      </ClientOnly>

      <div class="chat__pending">
        <div v-if="error">發生錯誤：{{ error }}</div>
        <div v-else-if="status === 'pending'">正在生成中...</div>
      </div>
    </div>

    <!-- 輸入框 -->
    <div class="chat__footer">
      <div v-if="promptList.length" class="chat__prompt">
        <div
          v-for="(prompt, index) in promptList"
          :key="index"
          class="chat__prompt-option"
          @click="askPrompt(prompt)"
        >
          <p>根據您提供的PDF：</p>
          <p>{{ prompt }}</p>
        </div>
      </div>
      <div class="chat__input">
        <input
          v-model.trim="inputText"
          type="text"
          class="chat__input-field"
          placeholder="Send a message..."
          @keyup.enter="handleSendMessage()"
        />
        <div class="chat__input-actions">
          <div class="chat__upload">
            <ClientOnly>
              <input type="file" accept=".pdf" @change="handleFileUpload" />
              <img class="icon" src="~/assets/icon/attach.svg" />
            </ClientOnly>
          </div>

          <img
            class="icon"
            :class="{ disabled: status === 'pending' }"
            src="~/assets/icon/send.svg"
            @click="handleSendMessage()"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useStorage } from "@vueuse/core";

const router = useRouter();
const store = useHistoryStore();
const { isOpen } = storeToRefs(store);
const response = useStorage("response", []);

const { loading, pdfError, pdfContent, parsePdf } = usePdfParser();
const status = ref("idle");
const error = ref(null);

const modelName = ref("gpt-4o"); // 模型選擇
const inputText = ref(""); //  當前輸入框的值
const chatInputText = ref(""); // 保存輸入框的值
const promptContent = ref(""); // 原始提示詞
const promptList = ref([]); // 處理後的提示詞陣列

const chatId = ref(""); // 輸出ID
const chatContent = ref(""); // 輸出內容

const chatHistory = computed(() => {
  if (!props.id) return null;
  return response.value?.find((item) => item.id === props.id);
});

const props = defineProps({
  id: {
    type: String,
  },
});

async function processStreamResponse(res, isGeneratingPrompt) {
  chatId.value = "";

  for await (const chunk of res) {
    const lines = new TextDecoder().decode(chunk).split("\n");

    for (const line of lines) {
      if (!line?.startsWith("data: ")) continue;

      const jsonString = line?.slice(6).trim();
      if (!jsonString) continue; // 跳過空字串

      try {
        const json = JSON.parse(jsonString);
        const content = json?.choices?.[0]?.delta?.content;

        // 生成 PDF 關鍵字時只顯示提示框
        if (isGeneratingPrompt) {
          promptContent.value += content;
          if (!chatId.value && json?.id)
            chatId.value = "pdf-" + Math.random().toString(36).substring(2);
        } else {
          // 其餘顯示完整對話
          chatContent.value += content;
          if (!chatId.value && json?.id) chatId.value = json?.id;
        }
      } catch (err) {
        console.error("JSON parse error:", err);
      }
    }
  }
}

async function handleSendMessage(isGeneratingPrompt = false, prompt = null) {
  if (!inputText.value) return;
  chatInputText.value = inputText.value;
  inputText.value = "";

  status.value = "pending";
  error.value = null;
  chatContent.value = "";

  try {
    const res = await $fetch("/api/chat", {
      method: "POST",
      body: {
        messages: [
          {
            role: "user",
            content: chatInputText.value,
          },
        ],
        model: modelName.value,
        stream: true,
        momentx_id: "my_momentx_id",
      },
      responseType: "stream",
    });

    await processStreamResponse(res, isGeneratingPrompt);

    if (isGeneratingPrompt) return;

    if (chatHistory.value) {
      response.value = response.value.map((item) => {
        if (item.id === props.id) {
          item.content.push({
            input: showCustomInput.value ? prompt : chatInputText.value,
            output: chatContent.value,
          });
        }
        return item;
      });
    } else {
      router.push(`/${chatId.value}`);
      response.value.push({
        id: chatId.value,
        content: [
          {
            input: showCustomInput.value ? prompt : chatInputText.value,
            output: chatContent.value,
          },
        ],
        question: showCustomInput.value ? prompt : chatInputText.value,
      });
    }
  } catch (err) {
    error.value = err;
    console.error("串流處理錯誤:", err);
  } finally {
    status.value = "idle";
  }
}

// 處理 PDF 檔案上傳
async function handleFileUpload(event) {
  promptContent.value = "";
  promptList.value = [];
  const target = event.target;
  const file = target.files?.[0];
  if (!file) return;

  try {
    await parsePdf(file);
    await generatePrompt();
  } catch (err) {
    console.error(err);
  }
}

// 生成 PDF 提示詞
async function generatePrompt() {
  inputText.value = `請根據下列文字生成兩個問題並回傳純文字(三十個字以內、不要斷行或空格)：${pdfContent.value.text}`;
  await handleSendMessage(true);
  promptList.value = promptContent.value
    .split("\n")
    .map((item) => item.trim().replace(/^\d+\.\s*/, ""));
}

// 提問 PDF 提示詞
const showCustomInput = ref(false);
async function askPrompt(prompt) {
  showCustomInput.value = true;
  inputText.value = `請根據下列文字：${pdfContent.value.text} 回答問題：${prompt}`;
  await handleSendMessage(false, `根據 PDF：${prompt}`);
  showCustomInput.value = false;
  promptList.value = [];
}
</script>
