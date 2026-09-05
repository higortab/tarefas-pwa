<template>
  <form class="task-form" @submit.prevent="handleSubmit">
    <div class="task-row">
      <input
        v-model="newTask"
        type="text"
        placeholder="Nova tarefa..."
        class="task-input"
      />
      <button type="submit" class="task-button" :disabled="uploading">
        {{ editingTask ? 'Alterar' : 'Adicionar' }}
      </button>
      <button
        v-if="editingTask"
        type="button"
        class="task-button-cancel"
        @click="handleCancel"
      >
        Cancelar
      </button>
    </div>

    <div class="image-section">
      <img
        v-if="previewUrl || editingTask?.img_url"
        :src="previewUrl || editingTask?.img_url"
        class="image-preview"
        alt="Imagem da tarefa"
      />

      <label class="image-label" :class="{ disabled: uploading }">
        <span v-if="uploading" class="upload-status">Enviando...</span>
        <span v-else>Adicionar imagem</span>
        <input
          type="file"
          accept="image/jpeg,image/png"
          capture="environment"
          class="image-input"
          :disabled="uploading"
          @change="handleImageChange"
        />
      </label>

      <button
        type="button"
        class="task-button-secondary"
        @click="showCameraCapture = !showCameraCapture"
      >
        {{ showCameraCapture ? 'Fechar câmera' : 'Abrir preview ao vivo' }}
      </button>

      <CameraCapture
        v-if="showCameraCapture"
        @captured="handleCameraCapture"
      />
    </div>

    <div class="location-section">
      <p class="location-privacy">
        A localização é opcional e só será associada a esta tarefa se você
        capturar manualmente.
      </p>

      <div class="location-actions">
        <button
          type="button"
          class="task-button-secondary"
          :disabled="!isSupported || loadingLocation"
          @click="handleGetLocation"
        >
          {{ loadingLocation ? 'Obtendo localização...' : 'Usar localização atual' }}
        </button>
        <button
          v-if="location"
          type="button"
          class="task-button-cancel"
          @click="clearLocation"
        >
          Remover localização
        </button>
      </div>

      <label v-if="location" class="location-approx">
        <input v-model="useApproximateLocation" type="checkbox" />
        Salvar localização aproximada
      </label>

      <p v-if="!isSupported" class="location-error">
        Geolocalização não suportada neste dispositivo.
      </p>
      <p v-else-if="locationError" class="location-error">{{ locationError }}</p>

      <div v-if="location" class="location-details">
        <div class="location-meta">
          <span>
            {{ displayLocation.latitude.toFixed(5) }},
            {{ displayLocation.longitude.toFixed(5) }}
          </span>
          <span v-if="displayLocation.accuracy != null">
            (±{{ Math.round(displayLocation.accuracy) }} m)
          </span>
          <span
            v-if="accuracyLevel"
            :class="`accuracy-badge accuracy-badge--${accuracyLevel}`"
          >
            Precisão {{ accuracyLevel }}
          </span>
        </div>
        <p v-if="displayLocation.label" class="location-label">
          {{ displayLocation.label }}
        </p>
        <TaskLocationMap :location="displayLocation" />
        <p class="location-mode">
          {{ useApproximateLocation ? 'Localização aproximada' : 'Localização exata' }}
        </p>
      </div>
    </div>
  </form>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import tasksApi from '../api/tasksApi.js'
import geocodingApi from '../api/geocodingApi.js'
import CameraCapture from './CameraCapture.vue'
import TaskLocationMap from './TaskLocationMap.vue'
import { useGeolocation } from '../composables/useGeolocation.js'
import {
  buildLocationPayload,
  classifyAccuracy,
  roundCoordinate,
} from '../utils/location.js'

const props = defineProps({
  editingTask: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['add', 'update', 'cancel'])
const newTask = ref('')
const previewUrl = ref(null)
const imgAttachmentKey = ref(null)
const uploading = ref(false)
const showCameraCapture = ref(false)
const useApproximateLocation = ref(false)

const {
  isSupported,
  loadingLocation,
  locationError,
  location,
  readPermissionState,
  setLocationFromTask,
  clearLocation,
  setLocationLabel,
  requestCurrentLocation,
} = useGeolocation()

const accuracyLevel = computed(() => classifyAccuracy(location.value?.accuracy))

const displayLocation = computed(() => {
  if (!location.value) return null
  if (!useApproximateLocation.value) return location.value
  return {
    ...location.value,
    latitude: roundCoordinate(location.value.latitude),
    longitude: roundCoordinate(location.value.longitude),
  }
})

onMounted(() => {
  readPermissionState()
})

function handleCameraCapture(file) {
  previewUrl.value = URL.createObjectURL(file)
  uploading.value = true
  tasksApi
    .uploadImage(file)
    .then((response) => {
      imgAttachmentKey.value = response.data.attachment_key
    })
    .catch((err) => {
      console.error(err)
      previewUrl.value = null
    })
    .finally(() => {
      uploading.value = false
    })
}

watch(
  () => props.editingTask,
  (task) => {
    newTask.value = task ? task.title : ''
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
    imgAttachmentKey.value = null
    useApproximateLocation.value = false
    setLocationFromTask(task)
  },
  { immediate: true },
)

async function handleGetLocation() {
  const captured = await requestCurrentLocation()
  if (!captured) return

  try {
    const address = await geocodingApi.reverse(captured.latitude, captured.longitude)
    setLocationLabel(address?.label)
  } catch {
    locationError.value =
      'Localização obtida, mas não foi possível identificar a rua.'
  }
}

async function handleImageChange(event) {
  const file = event.target.files[0]
  if (!file) return
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = URL.createObjectURL(file)
  uploading.value = true
  try {
    const response = await tasksApi.uploadImage(file)
    imgAttachmentKey.value = response.data.attachment_key
  } catch (err) {
    console.error('Erro ao fazer upload da imagem', err)
    previewUrl.value = null
    imgAttachmentKey.value = null
  } finally {
    uploading.value = false
  }
}

function handleSubmit() {
  if (!newTask.value.trim()) return

  const payloadLocation = useApproximateLocation.value && location.value
    ? {
        ...location.value,
        latitude: roundCoordinate(location.value.latitude),
        longitude: roundCoordinate(location.value.longitude),
      }
    : location.value

  const payload = {
    title: newTask.value.trim(),
    imgAttachmentKey: imgAttachmentKey.value,
    ...buildLocationPayload(payloadLocation),
  }

  if (props.editingTask) {
    emit('update', props.editingTask.id, payload)
  } else {
    emit('add', payload)
  }

  newTask.value = ''
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null
  imgAttachmentKey.value = null
  useApproximateLocation.value = false
  clearLocation()
}

function handleCancel() {
  newTask.value = ''
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null
  imgAttachmentKey.value = null
  useApproximateLocation.value = false
  clearLocation()
  emit('cancel')
}
</script>

<style scoped>
.task-form {
  margin-bottom: 24px;
}

.task-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.task-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

.task-input:focus {
  border-color: #4a90d9;
}

.task-button {
  padding: 12px 20px;
  background-color: #4a90d9;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.task-button:hover:not(:disabled) {
  background-color: #357abd;
}

.task-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.task-button-cancel {
  padding: 12px 16px;
  background-color: transparent;
  color: #666;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: border-color 0.2s;
}

.task-button-cancel:hover {
  border-color: #aaa;
}

.task-button-secondary {
  padding: 8px 14px;
  background: white;
  border: 1.5px solid #4a90d9;
  color: #4a90d9;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
}

.task-button-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.image-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #ccc;
}

.image-preview {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #ddd;
  flex-shrink: 0;
}

.image-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: white;
  border: 1.5px solid #4a90d9;
  color: #4a90d9;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.image-label:hover:not(.disabled) {
  background: #eaf2fb;
}

.image-label.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.image-input {
  display: none;
}

.upload-status {
  color: #888;
}

.location-section {
  margin-top: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #ccc;
}

.location-privacy {
  margin: 0 0 10px;
  font-size: 0.8rem;
  color: #666;
}

.location-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.location-approx {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 0.875rem;
  color: #444;
  cursor: pointer;
}

.location-error {
  margin: 0 0 8px;
  color: #c0392b;
  font-size: 0.875rem;
}

.location-details {
  margin-top: 8px;
}

.location-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #444;
}

.location-label {
  margin: 8px 0 0;
  font-size: 0.9rem;
  color: #2c3e50;
}

.location-mode {
  margin: 8px 0 0;
  font-size: 0.8rem;
  color: #666;
}

.accuracy-badge {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 12px;
}

.accuracy-badge--boa {
  background: #d4edda;
  color: #155724;
}

.accuracy-badge--moderada {
  background: #fff3cd;
  color: #856404;
}

.accuracy-badge--baixa {
  background: #f8d7da;
  color: #721c24;
}
</style>
