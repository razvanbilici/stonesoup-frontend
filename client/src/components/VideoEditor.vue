<template>
  <div class="space-y-4">

    <!-- Saved videos -->
    <div v-if="modelValue.length" class="space-y-3">
      <h4 class="text-sm font-semibold text-slate-600">Videos ({{ modelValue.length }})</h4>
      <div v-for="(att, i) in modelValue" :key="i"
        class="p-3 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2">
        <video :src="fullUrl(att.url)" controls class="w-full max-h-48 rounded-lg bg-black"></video>
        <div class="flex items-center justify-between">
          <p class="text-xs text-slate-500 truncate">{{ att.originalname }}</p>
          <div class="flex gap-3 shrink-0">
            <a :href="fullUrl(att.url)" :download="att.originalname"
              class="text-sm text-indigo-500 hover:underline">⬇ Download</a>
            <button @click="removeAttachment(i)"
              class="text-sm text-red-500 hover:underline">✕ Remove</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add video -->
    <div class="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-4">
      <p class="text-sm font-semibold text-slate-600">Add Video</p>

      <!-- Live / recorded preview -->
      <video v-if="isRecording || recordedBlob"
        ref="videoEl"
        :src="recordedUrl || undefined"
        :controls="!!recordedBlob"
        :muted="isRecording"
        autoplay playsinline
        class="w-full max-h-48 rounded-lg bg-black">
      </video>

      <div class="flex items-center gap-3 flex-wrap">
        <button v-if="!isRecording && !recordedBlob" @click="startRecording"
          class="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium">
          🎥 Record
        </button>
        <button v-if="isRecording" @click="stopRecording"
          class="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium animate-pulse">
          ⏹ Stop &middot; {{ formatTime(recordingTime) }}
        </button>
        <template v-if="recordedBlob && !isRecording">
          <button @click="addRecorded" :disabled="isUploading"
            class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
            {{ isUploading ? 'Uploading…' : '+ Add' }}
          </button>
          <button @click="discardRecorded"
            class="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm">
            Discard
          </button>
        </template>
      </div>

      <div class="border-t border-slate-200 pt-3">
        <label class="flex items-center gap-2 cursor-pointer px-4 py-2 bg-white border border-slate-300 hover:border-indigo-400 rounded-lg text-sm text-slate-600 w-fit transition-colors">
          📁 Upload video file
          <input type="file" accept="video/*" class="hidden" @change="handleFileUpload" />
        </label>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { uploadFile, deleteFile } from '../services/api';

const props = defineProps({ modelValue: { type: Array, default: () => [] } });
const emit  = defineEmits(['update:modelValue']);

const BASE_URL = 'http://localhost:3001';
const fullUrl  = (url) => `${BASE_URL}${url}`;

const isRecording   = ref(false);
const recordingTime = ref(0);
const recordedBlob  = ref(null);
const recordedUrl   = ref(null);
const isUploading   = ref(false);
const videoEl       = ref(null);

let mediaRecorder = null;
let liveStream    = null;
let chunks        = [];
let timerInterval = null;

const formatTime = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const startRecording = async () => {
  try {
    liveStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    chunks = [];
    mediaRecorder = new MediaRecorder(liveStream);
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      recordedBlob.value = blob;
      recordedUrl.value  = URL.createObjectURL(blob);
      liveStream.getTracks().forEach(t => t.stop());
    };
    mediaRecorder.start();
    isRecording.value   = true;
    recordingTime.value = 0;
    timerInterval = setInterval(() => recordingTime.value++, 1000);
    await nextTick();
    if (videoEl.value) videoEl.value.srcObject = liveStream;
  } catch (err) {
    alert('Camera/microphone access denied: ' + err.message);
  }
};

const stopRecording = () => {
  mediaRecorder?.stop();
  isRecording.value = false;
  clearInterval(timerInterval);
  if (videoEl.value) videoEl.value.srcObject = null;
};

const addRecorded = async () => {
  isUploading.value = true;
  try {
    const result = await uploadFile(recordedBlob.value, `video-${Date.now()}.webm`);
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