import { ref } from 'vue'

const TARGET_ACCURACY_M = 50
const WATCH_BUDGET_MS = 15000

export function useGeolocation() {
  const isSupported =
    typeof navigator !== 'undefined' && typeof navigator.geolocation !== 'undefined'
  const permissionState = ref('unknown')
  const loadingLocation = ref(false)
  const locationError = ref('')
  const location = ref(null)

  async function readPermissionState() {
    if (!navigator.permissions?.query) return
    try {
      const status = await navigator.permissions.query({ name: 'geolocation' })
      permissionState.value = status.state
      status.onchange = () => {
        permissionState.value = status.state
      }
    } catch {
      permissionState.value = 'unknown'
    }
  }

  function setLocationFromTask(task) {
    if (!task || task.latitude == null || task.longitude == null) {
      location.value = null
      return
    }
    location.value = {
      latitude: task.latitude,
      longitude: task.longitude,
      accuracy: task.geolocation_accuracy ?? null,
      timestamp: task.geolocation_timestamp
        ? Date.parse(task.geolocation_timestamp)
        : Date.now(),
      label: task.location_label ?? null,
    }
  }

  function clearLocation() {
    location.value = null
    locationError.value = ''
  }

  function setLocationLabel(label) {
    if (location.value) location.value = { ...location.value, label: label || null }
  }

  function positionToLocation(position) {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
      label: null,
    }
  }

  function requestCurrentLocation() {
    if (!isSupported) {
      locationError.value = 'Geolocalização não suportada neste dispositivo.'
      return Promise.resolve(null)
    }

    loadingLocation.value = true
    locationError.value = ''

    const options = {
      enableHighAccuracy: true,
      // Não reutilizar posição cacheada (no desktop isso costuma ser IP/rede, bem longe).
      maximumAge: 0,
      timeout: 30000,
    }

    return new Promise((resolve) => {
      let best = null
      let settled = false

      const finish = (value) => {
        if (settled) return
        settled = true
        window.clearTimeout(budgetTimer)
        navigator.geolocation.clearWatch(watchId)
        loadingLocation.value = false
        if (value) {
          location.value = value
          if (value.accuracy != null && value.accuracy > 100) {
            locationError.value =
              `Posição com baixa precisão (±${Math.round(value.accuracy)} m). ` +
              'No computador isso é comum (Wi‑Fi/IP). No celular, ative o GPS e tente de novo.'
          }
        }
        resolve(value)
      }

      const fail = (error) => {
        if (best) {
          finish(best)
          return
        }
        if (error.code === error.PERMISSION_DENIED) {
          permissionState.value = 'denied'
          locationError.value = 'Permissão de localização negada.'
        } else if (error.code === error.TIMEOUT) {
          locationError.value = 'Tempo esgotado para obter localização.'
        } else {
          locationError.value = 'Não foi possível obter a localização agora.'
        }
        finish(null)
      }

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          permissionState.value = 'granted'
          const current = positionToLocation(position)
          if (!best || current.accuracy < best.accuracy) {
            best = current
            location.value = current
          }
          if (current.accuracy <= TARGET_ACCURACY_M) {
            finish(current)
          }
        },
        fail,
        options,
      )

      const budgetTimer = window.setTimeout(() => {
        if (best) finish(best)
        else {
          locationError.value =
            'Não foi possível obter uma localização precisa a tempo. Tente novamente.'
          finish(null)
        }
      }, WATCH_BUDGET_MS)
    })
  }

  return {
    isSupported,
    permissionState,
    loadingLocation,
    locationError,
    location,
    readPermissionState,
    setLocationFromTask,
    clearLocation,
    setLocationLabel,
    requestCurrentLocation,
  }
}
