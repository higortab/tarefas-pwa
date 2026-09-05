import apiClient from './config.js'

const LOCATION_FIELDS = [
  'latitude',
  'longitude',
  'geolocation_accuracy',
  'geolocation_timestamp',
  'location_label',
]

function appendLocationFields(body, payload = {}) {
  for (const field of LOCATION_FIELDS) {
    if (field in payload) body[field] = payload[field]
  }
}

const tasksApi = {
  getAll() {
    return apiClient.get('/tasks')
  },

  create({ title, imgAttachmentKey, ...locationFields } = {}) {
    const body = { title }
    if (imgAttachmentKey != null) body.img_attachment_key = imgAttachmentKey
    appendLocationFields(body, locationFields)
    return apiClient.post('/tasks', body)
  },

  update(id, data) {
    return apiClient.patch(`/tasks/${id}`, data)
  },

  remove(id) {
    return apiClient.delete(`/tasks/${id}`)
  },

  uploadImage(file, description = '') {
    const formData = new FormData()
    formData.append('file', file)
    if (description) formData.append('description', description)
    return apiClient.post('/uploads/images/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export default tasksApi
