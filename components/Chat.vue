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
const store = useHistoryStore();
const { isOpen } = storeToRefs(store);

const modelName = ref("gpt-4o"); // 模型選擇
const inputText = ref(""); //  當前輸入框的值
const chatInputText = ref(""); // 保存輸入框的值

const { loading, pdfError, pdfContent, parsePdf } = usePdfParser();
const { status, error, response, fetchChat, saveChat } = useChatStream();
const { promptList, handleFileUpload } = usePdfPrompt(
  modelName,
  fetchChat,
  pdfContent,
  parsePdf
);

const props = defineProps({
  id: {
    type: String,
  },
});

const chatHistory = computed(() => {
  if (!props.id) return null;
  return response.value?.find((item) => item.id === props.id);
});

async function handleSendMessage(prompt = null) {
  if (!inputText.value) return;
  chatInputText.value = inputText.value;
  inputText.value = "";

  const { error: sendError } = await fetchChat({
    input: chatInputText.value,
    model: modelName.value,
  });

  if (sendError) return;

  saveChat({
    historyId: props.id,
    chatHistory: chatHistory.value,
    displayInput: chatInputText.value,
  });
}

async function askPrompt(prompt) {
  const { error: sendError } = await fetchChat({
    input: `請根據下列文字：${pdfContent.value.text} 回答問題：${prompt}`,
    model: modelName.value,
  });

  if (sendError) return;

  saveChat({
    historyId: props.id,
    chatHistory: chatHistory.value,
    displayInput: `根據 PDF：${prompt}`,
  });

  promptList.value = [];
}
</script>
