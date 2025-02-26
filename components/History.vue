<template>
  <Transition name="slide">
    <div v-if="isOpen" class="history">
      <div class="history__header">
        <h2>Chatbot</h2>
        <NuxtLink to="/">
          <img class="icon" src="~/assets/icon/add.svg" />
        </NuxtLink>
      </div>

      <ClientOnly
        ><div class="history__hint">
          <span v-if="response.length === 0">Let's start chatting!</span>
          <span v-else>Older</span>
        </div>
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
  </Transition>
</template>

<script setup>
import { useStorage } from "@vueuse/core";
const store = useHistoryStore();
const { isOpen } = storeToRefs(store);

const response = useStorage("response", []);
</script>
