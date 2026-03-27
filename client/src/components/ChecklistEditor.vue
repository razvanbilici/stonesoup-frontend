<template>
  <div class="space-y-3 p-1">
    <div 
      v-for="(item, i) in items" 
      :key="i" 
      class="group flex items-center gap-3 bg-white p-2 rounded-lg border border-transparent hover:border-slate-200 hover:shadow-sm transition-all"
    >
      <div class="relative flex items-center justify-center">
        <input 
          type="checkbox" 
          v-model="item.checked" 
          class="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-slate-300 bg-white checked:bg-indigo-600 checked:border-indigo-600 transition-all"
        />
        <svg 
          class="absolute w-3 h-3 text-white hidden peer-checked:block pointer-events-none" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>

      <input 
        v-model="item.text" 
        placeholder="List item..."
        class="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 placeholder:text-slate-300 transition-all"
        :class="{ 'line-through text-slate-400': item.checked }"
      />

      <button 
        @click="removeItem(i)" 
        class="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-opacity"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <button 
      @click="addItem" 
      class="flex items-center gap-2 mt-4 px-3 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
    >
      <span class="text-lg leading-none">+</span>
      Add Item
    </button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);

// Initialize with a default empty item if modelValue is empty
const items = ref(props.modelValue && props.modelValue.length ? props.modelValue : [{ text: '', checked: false }]);

watch(items, () => emit('update:modelValue', [...items.value]), { deep: true });

const addItem = () => items.value.push({ text: '', checked: false });
const removeItem = (index) => items.value.splice(index, 1);
</script>