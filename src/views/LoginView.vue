<template>
  <div class="login-container">
    <form class="login-form" @submit.prevent="handleLogin">
      <h1>Entrar</h1>
      <p class="login-subtitle">Acesse sua conta para gerenciar as tarefas.</p>

      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

      <div class="field">
        <label for="email">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          class="login-input"
          placeholder="seu@email.com"
          required
          autocomplete="email"
        />
      </div>

      <div class="field">
        <label for="password">Senha</label>
        <input
          id="password"
          v-model="password"
          type="password"
          class="login-input"
          placeholder="••••••••"
          required
          autocomplete="current-password"
        />
      </div>

      <button type="submit" class="login-button" :disabled="loading">
        {{ loading ? 'Entrando...' : 'Entrar' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

async function handleLogin() {
  loading.value = true;
  errorMessage.value = '';
  try {
    await authStore.login(email.value, password.value);
    router.push('/');
  } catch (err) {
    errorMessage.value =
      err.response?.data?.detail ??
      'Erro ao entrar. Verifique suas credenciais.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  padding-top: 24px;
}

.login-form {
  width: 100%;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 24px 20px;
}

.login-form h1 {
  font-size: 1.3rem;
  color: #4a90d9;
  margin-bottom: 6px;
}

.login-subtitle {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 20px;
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  color: #666;
  margin-bottom: 6px;
}

.login-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  color: #333;
  outline: none;
  transition: border-color 0.2s;
  background: #fff;
}

.login-input:focus {
  border-color: #4a90d9;
}

.login-input::placeholder {
  color: #999;
}

.login-button {
  width: 100%;
  margin-top: 8px;
  padding: 12px 20px;
  background-color: #4a90d9;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.login-button:hover:not(:disabled) {
  background-color: #357abd;
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: #c0392b;
  background-color: #fdecea;
  border: 1px solid #e74c3c;
  border-radius: 6px;
  padding: 10px 14px;
  margin-bottom: 16px;
  font-size: 0.9rem;
}
</style>
