<template>
  <OfflineBanner />
  <AppHeader />
  <main>
    <router-view />
  </main>
  <NotificationPrompt />
</template>

<script setup>
import { onMounted, onUnmounted, watch } from 'vue'
import AppHeader from './components/AppHeader.vue'
import OfflineBanner from './components/OfflineBanner.vue'
import NotificationPrompt from './components/NotificationPrompt.vue'
import { useTasksStore } from './stores/tasks'
import { useAuthStore } from './stores/auth'

const tasksStore = useTasksStore()
const authStore = useAuthStore()

// Re-fetch automático quando o usuário clica em uma notificação e foca o app
function onSwMessage(event) {
  if (event.data?.type === 'PUSH_NOTIFICATION_CLICKED') {
    tasksStore.fetchTasks()
  }
}

function ensurePushSubscription() {
  if (
    !authStore.isAuthenticated ||
    !('serviceWorker' in navigator) ||
    !('Notification' in window) ||
    Notification.permission !== 'granted'
  ) {
    return
  }

  navigator.serviceWorker.ready
    .then((reg) => authStore.subscribe(reg))
    .catch(() => {})
}

watch(() => authStore.isAuthenticated, ensurePushSubscription, { immediate: true })

onMounted(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', onSwMessage)
  }
})

onUnmounted(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.removeEventListener('message', onSwMessage)
  }
})
</script>
