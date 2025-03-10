import { ref } from "vue";
import * as pdfjs from "pdfjs-dist";
import * as pdfWorker from "pdfjs-dist/build/pdf.worker.mjs";
pdfjs.GlobalWorkerOptions.workerSrc =
  import.meta.url + "pdfjs-dist/build/pdf.worker.mjs";

export function usePdfParser() {
  const loading = ref(false);
  const error = ref(null);
  const pdfContent = ref(null);

  async function parsePdf(file) {
    if (!file || !file.type.includes("pdf")) {
      throw new Error("請上傳 PDF 檔案");
    }

    loading.value = true;
    error.value = null;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({
        data: arrayBuffer,
        cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@latest/cmaps/",
        cMapPacked: true,
      }).promise;

      const metadata = await pdf.getMetadata().catch(() => ({}));

      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(" ");
        fullText += pageText + "\n";
      }

      pdfContent.value = {
        text: fullText,
        info: {
          pages: pdf.numPages,
          author: metadata?.info?.Author || "",
          title: metadata?.info?.Title || "",
        },
      };

      return pdfContent.value;
    } catch (err) {
      console.error("PDF 解析錯誤:", err);
      error.value = err instanceof Error ? err.message : "處理失敗";
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    error,
    pdfContent,
    parsePdf,
  };
}
