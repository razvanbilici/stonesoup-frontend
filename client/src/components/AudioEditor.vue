<template>
  <div class="space-y-4">

    <!-- Saved attachments -->
    <div v-if="modelValue.length" class="space-y-2">
      <h4 class="text-sm font-semibold text-slate-600">Recordings ({{ modelValue.length }})</h4>
      <div v-for="(att, i) in modelValue" :key="i"
        class="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
        <span class="text-2xl">🎵</span>
        <div class="flex-1 min-w-0">
          <p class="text-xs text-slate-500 truncate mb-1">{{ att.originalname }}</p>
          <audio :src="fullUrl(att.url)" controls class="w-full h-8"></audio>
        </div>
        <a :href="fullUrl(att.url)" :download="att.originalname"
          class="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors text-lg" title="Download">⬇</a>
        <button @click="removeAttachment(i)"
          class="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Remove">✕</button>
      </div>
    </div>

    <!-- Add audio -->
    <div class="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-4">
      <p class="text-sm font-semibold text-slate-600">Add Audio</p>

      <!-- Microphone recorder -->
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <button v-if="!isRecording" @click="startRecording" :disabled="!!recordedBlob"
            class="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors">
            🎙 Record
          </button>
          <button v-else @click="stopRecording"
            class="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium animate-pulse">
            ⏹ Stop &middot; {{ formatTime(recordingTime) }}
          </button>
        </div>

        <div v-if="recordedBlob" class="space-y-2">
          <audio :src="recordedUrl" controls class="w-full h-8"></audio>
          <div class="flex gap-2">
            <button @click="addRecorded" :disabled="isUploading"
              class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
              {{ isUploading ? 'Uploading…' : '+ Add' }}
            </button>
            <button @click="discardRecorded"
              class="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm">
              Discard
            </button>
          </div>
        </div>
      </div>

      <!-- File upload -->
      <div class="border-t border-slate-200 pt-3">
        <label class="flex items-center gap-2 cursor-pointer px-4 py-2 bg-white border border-slate-300 hover:border-indigo-400 rounded-lg text-sm text-slate-600 w-fit transition-colors">
          📁 Upload audio file
          <input type="file" accept="audio/*" class="hidden" @change="handleFileUpload" />
        </label>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue';
import { uploadFile, deleteFile } from '../services/api';

const props = defineProps({ modelValue: { type: Array, default: () => [] } });
const emit  = defineEmits(['update:modelValue']);

const BASE_URL = 'http://localhost:3001';
const fullUrl  = (url) => `${BASE_URL}${url}`;

const isRecording  = ref(false);
const recordingTime = ref(0);
const recordedBlob  = ref(null);
const recordedUrl   = ref(null);
const isUploading   = ref(false);

let mediaRecorder = null;
let chunks        = [];
let timerInterval = null;

const formatTime = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      recordedBlob.value = blob;
      recordedUrl.value  = URL.createObjectURL(blob);
      stream.getTracks().forEach(t => t.stop());
    };
    mediaRecorder.start();
    isRecording.value   = true;
    recordingTime.value = 0;
    timerInterval = setInterval(() => recordingTime.value++, 1000);
  } catch (err) {
    alert('Microphone access denied: ' + err.message);
  }
};

const stopRecording = () => {
  mediaRecorder?.stop();
  isRecording.value = false;
  clearInterval(timerInterval);
};

const addRecorded = async () => {
  isUploading.value = true;
  try {
    const result = await uploadFile(recordedBlob.value, `audio-${Date.now()}.webm`);
    emit('update:modelValue', [...props.modelValue, result]);
    discardRecorded();
  } finally {
    isUploading.value = false;
  }
};

const discardRecorded = () => {
  if (recordedUrl.value) URL.revokeObjectURL(recordedUrl.value);
  recordedBlob.value = null;
  recordedUrl.value  = null;
};

const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  isUploading.value = true;
  try {
    const result = await uploadFile(file, file.name);
    emit('update:modelValue', [...props.modelValue, result]);
  } finally {
    isUploading.value = false;
    e.target.value = '';
  }
};

const removeAttachment = async (i) => {
  await deleteFile(props.modelValue[i].filename);
  const updated = [...props.modelValue];
  updated.splice(i, 1);
  emit('update:modelValue', updated);
};
</script>