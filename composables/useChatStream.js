import { useStorage } from "@vueuse/core";

export function useChatStream() {
  const response = useStorage("response", []);
  const router = useRouter();

  const status = ref("idle");
  const error = ref(null);

  const chatId = ref(""); // 輸出ID
  const chatContent = ref(""); // 輸出內容

  async function fetchChat({ input, model, isGeneratingPrompt = false }) {
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
              content: input,
            },
          ],
          model: model,
          stream: true,
          momentx_id: "my_momentx_id",
        },
        responseType: "stream",
      });

      const content = await processStreamResponse(res);

      return {
        id: isGeneratingPrompt
          ? "pdf-" + Math.random().toString(36).substring(2)
          : chatId.value,
        content,
      };
    } catch (err) {
      error.value = err;
      console.error("串流處理錯誤:", err);
    } finally {
      status.value = "idle";
    }
  }

  function saveChat({ historyId, chatHistory, displayInput }) {
    if (chatHistory) {
      response.value = response.value.map((item) => {
        if (item.id === historyId) {
          item.content.push({
            input: displayInput,
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
            input: displayInput,
            output: chatContent.value,
          },
        ],
        question: displayInput,
      });
    }
  }

  async function processStreamResponse(res) {
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
          chatContent.value += content;
          if (!chatId.value && json?.id) chatId.value = json?.id;
        } catch (err) {
          console.error("JSON parse error:", err);
        }
      }
    }

    return chatContent.value;
  }

  return {
    response,
    status,
    error,
    chatId,
    chatContent,
    fetchChat,
    saveChat,
  };
}
