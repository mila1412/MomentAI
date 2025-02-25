// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  runtimeConfig: {
    apiKey: "",
    public: {
      apiBase: "",
    },
  },
  css: ["normalize.css", "~/assets/scss/main.scss"],
  build: {
    transpile: ["pdfjs-dist"],
  },
  modules: ["@pinia/nuxt"],
});
