import { defineStore } from "pinia";
export const useHistoryStore = defineStore("history", () => {
  const isOpen = ref(true);

  return { isOpen };
});
