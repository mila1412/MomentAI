<template>
  <Chat :history="history" />
</template>

<script setup>
import { useStorage } from "@vueuse/core";
const route = useRoute();
const answer = useStorage("answer", []);
console.log(answer);
const history = answer.filter((item) => item.id === route.params.id);
</script>
