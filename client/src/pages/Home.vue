<template>
  <div class="min-h-screen bg-slate-50 p-6 md:p-10 text-slate-800">
    <div class="max-w-6xl mx-auto">

      <header class="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight text-slate-900">
            Stone Soup <span class="text-indigo-600">Notes</span>
          </h1>
          <p class="text-slate-500 text-sm">Really hope this works.</p>
        </div>
        <div class="w-full md:w-72">
          <SearchBar @search="handleSearch" />
        </div>
      </header>

      <div class="flex flex-wrap items-center gap-3 mb-10">
        <button @click="newNote('text')"
          class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95">
          <span class="text-lg">+</span> Text
        </button>
        <button @click="newNote('checklist')"
          class="flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 font-medium px-5 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95">
          <span class="text-indigo-500">✓</span> Checklist
        </button>
        <button @click="newNote('audio')"
          class="flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 font-medium px-5 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95">
           Audio
        </button>
        <button @click="newNote('video')"
          class="flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 font-medium px-5 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95">
           Video
        </button>
        <button @click="newNote('photo')"
          class="flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 font-medium px-5 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95">
           Photo
        </button>
        <button @click="newNote('drawing')"
          class="flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 font-medium px-5 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95">
           Drawing
        </button>
      </div>

      <section>
        <div class="flex items-center gap-2 mb-6">
          <h2 class="text-lg font-semibold text-slate-700">Recent Notes</h2>
          <div class="h-px flex-1 bg-slate-200"></div>
        </div>

        <div v-if="filteredNotes.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <NoteCard
            v-for="n in filteredNotes"
            :key="n.id"
            :note="n"
            @open="openNote"
            @delete="handleDelete"
            class="transform transition-transform hover:-translate-y-1"
          />
        </div>

        <div v-else class="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
          <p class="text-slate-400">No notes found. Start by creating a new one!</p>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getNotes, deleteNote } from '../services/api';
import NoteCard from '../components/NoteCard.vue';
import SearchBar from '../components/SearchBar.vue';

const notes = ref([]);
const filteredNotes = ref([]);
const router = useRouter();

onMounted(async () => {
  notes.value = await getNotes();
  filteredNotes.value = notes.value;
});

const handleSearch = (q) => {
  filteredNotes.value = notes.value.filter(n =>
    n.title.toLowerCase().includes(q.toLowerCase())
  );
};

const handleDelete = async (id) => {
  await deleteNote(id);
  notes.value = await getNotes();
  filteredNotes.value = notes.value;
};

const openNote = (id) => router.push(`/note/${id}`);
const newNote = (type) => router.push(`/note?type=${type}`);
</script>