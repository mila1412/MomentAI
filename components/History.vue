<template>
  <div class="history">
    <h2 class="history__heading">Chatbot</h2>
    <div class="history__hint">
      <span v-if="response.length === 0">Let's start chatting!</span>
      <span v-else>Older</span>
    </div>
    <ClientOnly>
      <ul class="history__list">
        <li
          v-for="(chat, index) in response"
          :key="index"
          class="history__item"
        >
          <NuxtLink :to="`/${chat.id}`">
            {{ chat.question }}
          </NuxtLink>
        </li>
      </ul>
    </ClientOnly>
  </div>
</template>

<script setup>
import { useStorage } from "@vueuse/core";

const response = useStorage("response", []);
</script>
