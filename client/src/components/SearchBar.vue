<template>
  <input v-model="query" @input="$emit('search', query)"
    placeholder="Search notes..."
    class="border p-2 w-[50wp] mb-4" />
</template>

<script setup>
import { ref } from 'vue';
const query = ref('');
</script>
