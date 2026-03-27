<template>
  <div class="space-y-4">

    <!-- Saved drawings -->
    <div v-if="modelValue.length" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div v-for="(att, i) in modelValue" :key="i" class="relative group">
        <img :src="fullUrl(att.url)"
          class="w-full h-32 object-contain rounded-xl border border-slate-200 bg-white" />
        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
          <a :href="fullUrl(att.url)" :download="att.originalname"
            class="p-2 bg-white/90 rounded-full text-indigo-600 hover:bg-white text-base" title="Download">⬇</a>
          <button @click="removeAttachment(i)"
            class="p-2 bg-white/90 rounded-full text-red-600 hover:bg-white text-base" title="Remove">✕</button>
        </div>
      </div>
    </div>

    <!-- Drawing area -->
    <div class="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-3">
      <p class="text-sm font-semibold text-slate-600">New Drawing</p>

      <!-- Toolbar -->
      <div class="flex items-center gap-2 flex-wrap">
        <button v-for="t in ['pen', 'eraser']" :key="t" @click="activeTool = t"
          :class="activeTool === t
            ? 'bg-indigo-600 text-white'
            : 'bg-white text-slate-600 border border-slate-300 hover:border-indigo-400'"
          class="px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors">
          {{ t === 'pen' ? '✏️ Pen' : '⬜ Eraser' }}
        </button>

        <input type="color" v-model="color" :disabled="activeTool === 'eraser'"
          class="w-8 h-8 rounded cursor-pointer border border-slate-300 disabled:opacity-30"
          title="Colour" />

        <select v-model.number="brushSize"
          class="px-2 py-1.5 border border-slate-300 rounded-lg text-sm bg-white">
          <option v-for="s in [2, 4, 8, 16, 24]" :key="s" :value="s">{{ s }}px</option>
        </select>

        <button @click="undoStroke" :disabled="history.length === 0"
          class="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 rounded-lg text-sm disabled:opacity-40">
          ↩ Undo
        </button>
        <button @click="clearCanvas"
          class="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 rounded-lg text-sm">
          🗑 Clear
        </button>
        <button @click="saveDrawing" :disabled="isUploading || isEmpty"
          class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium ml-auto">
          {{ isUploading ? 'Saving…' : '+ Add Drawing' }}
        </button>
      </div>

      <!-- Canvas -->
      <canvas
        ref="canvasEl"
        width="600" height="300"
        @mousedown="startDraw"
        @mousemove="onDraw"
        @mouseup="endDraw"
        @mouseleave="endDraw"
        @touchstart.prevent="startDrawTouch"
        @touchmove.prevent="onDrawTouch"
        @touchend.prevent="endDraw"
        class="w-full rounded-lg border border-slate-200 bg-white cursor-crosshair touch-none"
        style="max-height: 320px;"
      ></canvas>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { uploadFile, deleteFile } from '../services/api';

const props = defineProps({ modelValue: { type: Array, default: () => [] } });
const emit  = defineEmits(['update:modelValue']);

const BASE_URL = 'http://localhost:3001';
const fullUrl  = (url) => `${BASE_URL}${url}`;

const canvasEl   = ref(null);
const activeTool = ref('pen');
const color      = ref('#1e293b');
const brushSize  = ref(4);
const isUploading = ref(false);
const isEmpty    = ref(true);
const history    = ref([]); // ImageData snapshots for undo

let ctx      = null;
let isDown   = false;
let lastX    = 0;
let lastY    = 0;

onMounted(() => {
  ctx = canvasEl.value.getContext('2d');
  ctx.lineCap  = 'round';
  ctx.lineJoin = 'round';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasEl.value.width, canvasEl.value.height);
});

const getPos = (clientX, clientY) => {
  const rect   = canvasEl.value.getBoundingClientRect();
  const scaleX = canvasEl.value.width  / rect.width;
  const scaleY = canvasEl.value.height / rect.height;
  return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
};

const startDraw = ({ clientX, clientY }) => {
  history.value.push(ctx.getImageData(0, 0, canvasEl.value.width, canvasEl.value.height));
  const { x, y } = getPos(clientX, clientY);
  lastX = x; lastY = y;
  isDown = true;
  // Paint a dot on click
  ctx.beginPath();
  ctx.arc(x, y, (activeTool.value === 'eraser' ? brushSize.value * 2 : brushSize.value) / 2, 0, Math.PI * 2);
  ctx.fillStyle = activeTool.value === 'eraser' ? '#ffffff' : color.value;
  ctx.fill();
  isEmpty.value = false;
};

const onDraw = ({ clientX, clientY }) => {
  if (!isDown) return;
  const { x, y } = getPos(clientX, clientY);
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.strokeStyle = activeTool.value === 'eraser' ? '#ffffff' : color.value;
  ctx.lineWidth   = activeTool.value === 'eraser' ? brushSize.value * 3 : brushSize.value;
  ctx.stroke();
  lastX = x; lastY = y;
};

const endDraw = () => { isDown = false; };

const startDrawTouch = (e) => startDraw({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
const onDrawTouch    = (e) => onDraw({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });

const clearCanvas = () => {
  history.value.push(ctx.getImageData(0, 0, canvasEl.value.width, canvasEl.value.height));
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasEl.value.width, canvasEl.value.height);
  isEmpty.value = true;
};

const undoStroke = () => {
  if (!history.value.length) return;
  ctx.putImageData(history.value.pop(), 0, 0);
  isEmpty.value = history.value.length === 0;
};

const saveDrawing = async () => {
  isUploading.value = true;
  try {
    const blob   = await new Promise(res => canvasEl.value.toBlob(res, 'image/png'));
    const result = await uploadFile(blob, `drawing-${Date.now()}.png`);
    emit('update:modelValue', [...props.modelValue, result]);
    // Reset canvas
    history.value = [];
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasEl.value.width, canvasEl.value.height);
    isEmpty.value = true;
  } finally {
    isUploading.value = false;
  }
};

const removeAttachment = async (i) => {
  await deleteFile(props.modelValue[i].filename);
  const updated = [...props.modelValue];
  updated.splice(i, 1);
  emit('update:modelValue', updated);
};
</script>