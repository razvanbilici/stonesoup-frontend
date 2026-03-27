<template>
  <div class="min-h-screen bg-slate-50 p-6 md:p-10">
    <div class="max-w-2xl mx-auto">

      <div class="flex items-center gap-4 mb-8">
        <button @click="router.push('/')"
          class="p-2 rounded-lg hover:bg-slate-200 transition-colors text-slate-500 font-medium">
          ← Back
        </button>
        <h1 class="text-xl font-bold text-slate-800">
          {{ note.id ? 'Edit' : 'New' }} {{ typeLabel }}
        </h1>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">

        <!-- Title -->
        <div>
          <input
            v-model.trim="note.title"
            placeholder="Title"
            class="w-full text-xl font-semibold border-0 border-b-2 pb-2 focus:outline-none focus:border-indigo-500 transition-colors"
            :class="errors.title ? 'border-red-400' : 'border-slate-200'"
          />
          <p v-if="errors.title" class="text-red-500 text-xs mt-1">Title is required.</p>
        </div>

        <!-- Description (required for media types, shown for all) -->
        <div>
          <textarea
            v-model.trim="note.description"
            :placeholder="isMediaType ? 'Description (required)...' : 'Description (optional)...'"
            rows="3"
            class="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none transition"
            :class="errors.description ? 'border-red-400' : 'border-slate-200'"
          />
          <p v-if="errors.description" class="text-red-500 text-xs mt-1">Description is required.</p>
        </div>

        <!-- Type-specific content -->
        <div>
          <textarea
            v-if="note.type === 'text'"
            v-model.trim="note.content"
            placeholder="Write something..."
            rows="6"
            class="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none transition"
            :class="errors.content ? 'border-red-400' : 'border-slate-200'"
          />
          <p v-if="note.type === 'text' && errors.content" class="text-red-500 text-xs mt-1">Content is required.</p>

          <ChecklistEditor v-else-if="note.type === 'checklist'" v-model="note.content" />
          <p v-if="note.type === 'checklist' && errors.content" class="text-red-500 text-xs mt-1">Add at least one item.</p>

          <AudioEditor   v-else-if="note.type === 'audio'"   v-model="note.attachments" />
          <VideoEditor   v-else-if="note.type === 'video'"   v-model="note.attachments" />
          <PhotoEditor   v-else-if="note.type === 'photo'"   v-model="note.attachments" />
          <DrawingEditor v-else-if="note.type === 'drawing'" v-model="note.attachments" />
        </div>

        <!-- Save / Delete -->
        <div class="flex gap-3 pt-2">
          <button
            @click="save"
            :disabled="isProcessing"
            class="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl transition-colors"
          >
            {{ isProcessing ? 'Saving...' : 'Save Note' }}
          </button>
          <button
            v-if="note.id"
            @click="remove"
            class="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition-colors"
          >
            Delete
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getNotes, createNote, updateNote, deleteNote } from '../services/api';
import ChecklistEditor from '../components/ChecklistEditor.vue';
import AudioEditor     from '../components/AudioEditor.vue';
import VideoEditor     from '../components/VideoEditor.vue';
import PhotoEditor     from '../components/PhotoEditor.vue';
import DrawingEditor   from '../components/DrawingEditor.vue';

const route  = useRoute();
const router = useRouter();

const MEDIA_TYPES = ['audio', 'video', 'photo', 'drawing'];

const note = ref({
  title: '',
  description: '',
  content: route.query.type === 'checklist' ? [] : '',
  type: route.query.type || 'text',
  attachments: [],
});

const errors = ref({ title: false, description: false, content: false });
const isProcessing = ref(false);

const isMediaType = computed(() => MEDIA_TYPES.includes(note.value.type));

const typeLabel = computed(() => ({
  text: 'Text Note', checklist: 'Checklist', audio: 'Audio Note',
  video: 'Video Note', photo: 'Photo Note', drawing: 'Drawing',
})[note.value.type] ?? note.value.type);

onMounted(async () => {
  if (route.params.id) {
    const notes = await getNotes();
    const found  = notes.find(n => n.id === route.params.id);
    if (found) {
      note.value = {
        ...found,
        attachments: found.attachments ?? [],
        description: found.description ?? '',
      };
    }
  }
});

const validate = () => {
  errors.value.title       = !note.value.title.trim();
  errors.value.description = isMediaType.value ? !note.value.description?.trim() : false;

  if (note.value.type === 'text') {
    errors.value.content = !note.value.content?.trim();
  } else if (note.value.type === 'checklist') {
    const items = Array.isArray(note.value.content) ? note.value.content : [];
    errors.value.content = !items.some(i => i.text?.trim());
  } else {
    errors.value.content = false;
  }

  return !errors.value.title && !errors.value.description && !errors.value.content;
};

const save = async () => {
  if (!validate()) return;
  isProcessing.value = true;
  try {
    if (note.value.id) {
      await updateNote(note.value.id, { ...note.value });
    } else {
      await createNote({ ...note.value });
    }
    router.push('/');
  } catch (err) {
    console.error('Failed to save:', err);
  } finally {
    isProcessing.value = false;
  }
};

const remove = async () => {
  if (confirm('Are you sure you want to delete this note?')) {
    await deleteNote(note.value.id);
    router.push('/');
  }
};
</script>