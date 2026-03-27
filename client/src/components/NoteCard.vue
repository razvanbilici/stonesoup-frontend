<template>
  <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">

    <!-- Visual preview -->
    <template v-if="firstAttachment">
      <img v-if="note.type === 'photo'"
        :src="fullUrl(firstAttachment.url)"
        class="w-full h-36 object-cover" />
      <img v-else-if="note.type === 'drawing'"
        :src="fullUrl(firstAttachment.url)"
        class="w-full h-36 object-contain bg-white border-b border-slate-100" />
      <video v-else-if="note.type === 'video'"
        :src="fullUrl(firstAttachment.url)"
        class="w-full h-36 object-cover bg-black" muted />
    </template>
    <div v-else-if="typeIcon"
      class="w-full h-14 flex items-center justify-center text-3xl bg-slate-50 border-b border-slate-100">
      {{ typeIcon }}
    </div>

    <div class="p-4 flex-1 flex flex-col">
      <div class="cursor-pointer flex-1" @click="$emit('open', note.id)">
        <span class="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full" :class="badgeClass">
          {{ note.type }}
        </span>
        <h2 class="font-bold text-slate-800 mt-2 truncate">{{ note.title }}</h2>
        <p v-if="preview" class="text-sm text-slate-500 mt-1 line-clamp-2">{{ preview }}</p>
        <p class="text-xs text-slate-400 mt-2">{{ formatDate(note.updatedAt) }}</p>
      </div>

      <div class="flex gap-2 mt-3">
        <button @click.stop="$emit('open', note.id)"
          class="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-sm font-medium rounded-lg transition-colors">
          Edit
        </button>
        <button @click.stop="$emit('delete', note.id)"
          class="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg transition-colors">
          Delete
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps(['note']);
defineEmits(['open', 'delete']);

const BASE_URL = 'http://localhost:3001';
const fullUrl = (url) => `${BASE_URL}${url}`;

const firstAttachment = computed(() => props.note.attachments?.[0]);

const preview = computed(() => {
  if (props.note.description) return props.note.description;
  if (props.note.type === 'text') return props.note.content;
  return null;
});

const typeIcon = computed(() => ({
  text: null, checklist: null, audio: null, video: null, photo: null, drawing: null,
})[props.note.type]);

const badgeClass = computed(() => ({
  text:      'bg-blue-100 text-blue-700',
  checklist: 'bg-purple-100 text-purple-700',
  audio:     'bg-orange-100 text-orange-700',
  video:     'bg-pink-100 text-pink-700',
  photo:     'bg-green-100 text-green-700',
  drawing:   'bg-yellow-100 text-yellow-700',
})[props.note.type] ?? 'bg-slate-100 text-slate-600');

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
</script>