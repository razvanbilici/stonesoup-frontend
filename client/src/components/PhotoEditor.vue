<template>
  <div class="space-y-4">

    <!-- Saved photos -->
    <div v-if="modelValue.length" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div v-for="(att, i) in modelValue" :key="i" class="relative group">
        <img :src="fullUrl(att.url)" class="w-full h-32 object-cover rounded-xl border border-slate-200" />
        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
          <a :href="fullUrl(att.url)" :download="att.originalname"
            class="p-2 bg-white/90 rounded-full text-indigo-600 hover:bg-white text-base" title="Download">⬇</a>
          <button @click="removeAttachment(i)"
            class="p-2 bg-white/90 rounded-full text-red-600 hover:bg-white text-base" title="Remove">✕</button>
        </div>
      </div>
    </div>

    <!-- Add photo -->
    <div class="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-4">
      <p class="text-sm font-semibold text-slate-600">Add Photo</p>

      <!-- Camera / preview area -->
      <div v-if="cameraActive || capturedBlob">
        <video v-if="cameraActive && !capturedBlob"
          ref="videoEl" autoplay muted playsinline
          class="w-full max-h-52 rounded-lg bg-black">
        </video>
        <img v-if="capturedBlob" :src="capturedUrl"
          class="w-full max-h-52 object-contain rounded-lg border border-slate-200 bg-white" />
        <canvas ref="canvasEl" class="hidden"></canvas>
      </div>

      <div class="flex items-center gap-3 flex-wrap">
        <button v-if="!cameraActive && !capturedBlob" @click="openCamera"
          class="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">
          📷 Open Camera
        </button>
        <button v-if="cameraActive && !capturedBlob" @click="capture"
          class="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">
          ⊙ Capture
        </button>
        <button v-if="cameraActive && !capturedBlob" @click="closeCamera"
          class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm">
          Cancel
        </button>
        <template v-if="capturedBlob">
          <button @click="addCaptured" :disabled="isUploading"
            class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
            {{ isUploading ? 'Uploading…' : '+ Add' }}
          </button>
          <button @click="retake"
            class="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm">
            Retake
          </button>
        </template>
      </div>

      <div class="border-t border-slate-200 pt-3">
        <label class="flex items-center gap-2 cursor-pointer px-4 py-2 bg-white border border-slate-300 hover:border-indigo-400 rounded-lg text-sm text-slate-600 w-fit transition-colors">
          📁 Upload image file
          <input type="file" accept="image/*" class="hidden" @change="handleFileUpload" />
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

const cameraActive  = ref(false);
const capturedBlob  = ref(null);
const capturedUrl   = ref(null);
const isUploading   = ref(false);
const videoEl       = ref(null);
const canvasEl      = ref(null);
let stream = null;

const openCamera = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    cameraActive.value = true;
    await nextTick();
    if (videoEl.value) videoEl.value.srcObject = stream;
  } catch (err) {
    alert('Camera access denied: ' + err.message);
  }
};

const capture = () => {
  const video  = videoEl.value;
  const canvas = canvasEl.value;
  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  canvas.toBlob((blob) => {
    capturedBlob.value = blob;
    capturedUrl.value  = URL.createObjectURL(blob);
  }, 'image/png');
  closeCamera();
};

const closeCamera = () => {
  stream?.getTracks().forEach(t => t.stop());
  cameraActive.value = false;
};

const retake = () => {
  if (capturedUrl.value) URL.revokeObjectURL(capturedUrl.value);
  capturedBlob.value = null;
  capturedUrl.value  = null;
  openCamera();
};

const addCaptured = async () => {
  isUploading.value = true;
  try {
    const result = await uploadFile(capturedBlob.value, `photo-${Date.now()}.png`);
    emit('update:modelValue', [...props.modelValue, result]);
    if (capturedUrl.value) URL.revokeObjectURL(capturedUrl.value);
    capturedBlob.value = null;
    capturedUrl.value  = null;
  } finally {
    isUploading.value = false;
  }
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