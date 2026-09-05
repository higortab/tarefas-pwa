<template>
  <div>
    <p v-if="store.error" class="error-message">{{ store.error }}</p>

    <TaskForm
      :editing-task="editingTask"
      @add="handleAdd"
      @update="handleUpdate"
      @cancel="handleCancel"
    />

    <p v-if="store.loading" class="loading-message">Carregando tarefas...</p>

    <template v-else>
      <label class="location-filter">
        <input v-model="onlyWithLocation" type="checkbox" />
        Somente com localização
      </label>

      <section v-if="pendingTasks.length > 0">
        <h2 class="section-title">Pendentes ({{ pendingTasks.length }})</h2>
        <TaskItem
          v-for="task in pendingTasks"
          :key="task.id"
          :task="task"
          @toggle="handleToggle"
          @remove="handleRemove"
          @edit="handleEdit"
        />
      </section>

      <section v-if="completedTasks.length > 0">
        <h2 class="section-title">Concluídas ({{ completedTasks.length }})</h2>
        <TaskItem
          v-for="task in completedTasks"
          :key="task.id"
          :task="task"
          @toggle="handleToggle"
          @remove="handleRemove"
          @edit="handleEdit"
        />
      </section>

      <p v-if="filteredTasks.length === 0" class="empty-message">
        {{
          onlyWithLocation
            ? 'Nenhuma tarefa com localização.'
            : 'Nenhuma tarefa cadastrada. Adicione uma acima.'
        }}
      </p>
    </template>

    <InstallButton />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import TaskForm from '../components/TaskForm.vue'
import TaskItem from '../components/TaskItem.vue'
import InstallButton from '../components/InstallButton.vue'
import { useTasksStore } from '../stores/tasks.js'

const store = useTasksStore()
const editingTask = ref(null)
const onlyWithLocation = ref(false)

const filteredTasks = computed(() =>
  onlyWithLocation.value
    ? store.tasks.filter((t) => t.latitude != null)
    : store.tasks,
)

const pendingTasks = computed(() => filteredTasks.value.filter((t) => !t.done))
const completedTasks = computed(() => filteredTasks.value.filter((t) => t.done))

onMounted(() => {
  store.fetchTasks()
})

function handleAdd(payload) {
  store.addTask(payload)
}

function handleUpdate(id, payload) {
  store.updateTask(id, payload)
  editingTask.value = null
}

function handleCancel() {
  editingTask.value = null
}

function handleEdit(task) {
  editingTask.value = task
}

function handleToggle(id) {
  store.toggleTask(id)
}

function handleRemove(id) {
  if (editingTask.value?.id === id) editingTask.value = null
  store.removeTask(id)
}
</script>

<style scoped>
.section-title {
  font-size: 1rem;
  color: #666;
  margin-bottom: 12px;
  margin-top: 20px;
}

.location-filter {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0 8px;
  font-size: 0.9rem;
  color: #555;
  cursor: pointer;
}

.empty-message {
  text-align: center;
  color: #999;
  margin-top: 40px;
  font-size: 0.95rem;
}

.error-message {
  color: #c0392b;
  background-color: #fdecea;
  border: 1px solid #e74c3c;
  border-radius: 6px;
  padding: 10px 14px;
  margin-bottom: 12px;
  font-size: 0.9rem;
}

.loading-message {
  color: #666;
  font-size: 0.9rem;
  padding: 8px 0;
}
</style>
