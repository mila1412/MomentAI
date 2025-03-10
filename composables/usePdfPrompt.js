export function usePdfPrompt(modelName, fetchChat, pdfContent, parsePdf) {
  const promptList = ref([]); // 處理後的提示詞陣列

  async function handleFileUpload(event) {
    promptList.value = [];

    const file = event.target?.files?.[0];
    if (!file) return;

    try {
      await parsePdf(file);
      const prompts = await generatePrompt();
      if (prompts) {
        promptList.value = prompts;
      }
    } catch (err) {
      console.error("PDF 處理錯誤:", err);
    }
  }

  // 生成 PDF 提示詞
  async function generatePrompt() {
    const { content, error: sendError } = await fetchChat({
      input: `請根據下列文字生成兩個問題並回傳純文字(三十個字以內、不要斷行或空格)：${pdfContent.value.text}`,
      model: modelName.value,
      isGeneratingPrompt: true,
    });

    if (sendError) return;

    console.log(content);

    // return content
    //   .split("\n")
    //   .map((item) => item.trim().replace(/^\d+\.\s*/, ""));

    let singleRow = content.replace(/\n/g, " ");
    return singleRow
      .split(/\d+\.\s*/) // 按數字和點分割
      .filter((item) => item.trim()) // 移除空項
      .map((item) => item.trim()); // 清理每個項目
  }

  return {
    promptList,
    handleFileUpload,
  };
}
