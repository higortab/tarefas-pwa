<template>
  <div class="task-item-wrap">
    <div class="task-item" :class="{ done: task.done }">
      <img
        v-if="task.img_url"
        :src="task.img_url"
        class="task-thumbnail"
        alt="Imagem da tarefa"
      />
      <label class="task-label">
        <input type="checkbox" :checked="task.done" @change="$emit('toggle', task.id)" />
        <span class="task-title">{{ task.title }}</span>
      </label>
      <div class="task-actions">
        <button
          v-if="task.latitude != null"
          type="button"
          class="task-expand"
          @click="expanded = !expanded"
        >
          {{ expanded ? 'Ocultar mapa' : 'Ver mapa' }}
        </button>
        <button class="task-edit" @click="$emit('edit', task)">Editar</button>
        <button class="task-remove" @click="$emit('remove', task.id)">Remover</button>
      </div>
    </div>

    <div v-if="task.location_label || expanded" class="task-extra">
      <span
        v-if="task.location_label"
        class="task-location-tag"
        :title="task.location_label"
      >
        📍 {{ task.location_label }}
      </span>

      <TaskLocationMap
        v-if="expanded && task.latitude != null"
        :location="{
          latitude: task.latitude,
          longitude: task.longitude,
          accuracy: task.geolocation_accuracy,
          label: task.location_label,
        }"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TaskLocationMap from './TaskLocationMap.vue'

defineProps({
  task: {
    type: Object,
    required: true,
  },
})

defineEmits(['toggle', 'remove', 'edit'])

const expanded = ref(false)
</script>

<style scoped>
.task-item-wrap {
  margin-bottom: 10px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 14px;

  width: 100%;
  min-height: 74px;

  padding: 12px 16px;

  background: #ffffff;

  border: 1px solid #e5e9ee;
  border-radius: 12px;

  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.045);

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;
}

.task-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.07);
}

.task-item.done {
  opacity: 0.62;
}

.task-label {
  display: flex;
  align-items: center;
  gap: 12px;

  flex: 1;
  min-width: 0;

  cursor: pointer;
}

.task-label input[type='checkbox'] {
  width: 21px;
  height: 21px;

  margin: 0;

  accent-color: #4a90d9;

  cursor: pointer;
}

.task-title {
  overflow: hidden;

  color: #34434d;

  font-size: 16px;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-item.done .task-title {
  color: #8b959e;
  text-decoration: line-through;
}

.task-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.task-edit,
.task-remove,
.task-expand {
  padding: 7px 10px;

  border: none;
  border-radius: 7px;

  background: transparent;

  font-size: 14px;
  font-weight: 500;

  cursor: pointer;

  transition: background 0.2s ease;
}

.task-edit,
.task-expand {
  color: #4a90d9;
}

.task-edit:hover,
.task-expand:hover {
  background: #edf5ff;
}

.task-remove {
  color: #e74c3c;
}

.task-remove:hover {
  background: #fff0ee;
}

.task-thumbnail {
  width: 52px;
  height: 52px;

  flex-shrink: 0;

  object-fit: cover;

  border: 1px solid #e0e5ea;
  border-radius: 8px;
}

.task-extra {
  padding: 0 8px 4px;
}

.task-location-tag {
  display: inline-block;
  margin-top: 6px;
  max-width: 100%;
  overflow: hidden;
  color: #5a6a75;
  font-size: 0.8rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 600px) {
  .task-item {
    gap: 9px;
    padding: 11px;
  }

  .task-thumbnail {
    width: 46px;
    height: 46px;
  }

  .task-label {
    gap: 8px;
  }

  .task-title {
    font-size: 15px;
  }

  .task-actions {
    flex-direction: column;
  }

  .task-edit,
  .task-remove,
  .task-expand {
    padding: 4px 7px;
    font-size: 13px;
  }
}
</style>
