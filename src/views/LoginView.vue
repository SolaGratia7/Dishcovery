<template>
  <div class="login-wrapper">
    <!-- Animated Background -->
    <AnimatedBackground />
    
    <!-- Login Card - THIS WAS MISSING! -->
    <div class="login-card">
      <!-- Logo and Title -->
      <div class="text-center mb-4">
        <div class="logo-circle mx-auto mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/>
            <line x1="6" y1="17" x2="18" y2="17"/>
          </svg>
        </div>
        <h1 class="app-title">Dishcovery</h1>
        <h3 class="welcome-text">{{ activeTab === 'login' ? 'Welcome Back' : 'Create Account' }}</h3>
        <p class="switch-text">
          {{ activeTab === 'login' ? "Don't have an account?" : "Already have an account?" }}
          <a @click="toggleTab" class="switch-link">
            {{ activeTab === 'login' ? 'Create today!' : 'Sign in!' }}
          </a>
        </p>
      </div>

      <!-- Login Form -->
      <form v-if="activeTab === 'login'" @submit.prevent="handleLogin">
        <div class="mb-3">
          <label for="email1" class="form-label">Email Address</label>
          <input 
            type="email" 
            class="form-control" 
            id="email1" 
            v-model="loginForm.email"
            placeholder="your@email.com"
            required
          >
        </div>

        <div class="mb-3">
          <label for="password1" class="form-label">Password</label>
          <div class="input-group">
            <input 
              :type="showPassword ? 'text' : 'password'" 
              class="form-control" 
              id="password1" 
              v-model="loginForm.password"
              placeholder="Enter your password"
              required
            >
            <button 
              class="btn btn-outline-secondary" 
              type="button"
              @click="showPassword = !showPassword"
            >
              <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
            </button>
          </div>
        </div>

        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" v-model="rememberMe" id="remember">
            <label class="form-check-label" for="remember">
              Remember me
            </label>
          </div>
          <a href="#" class="forgot-link">Forgot password?</a>
        </div>

        <button type="submit" class="btn btn-primary w-100 mb-3" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          <i v-else class="bi bi-box-arrow-in-right me-2"></i>
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>

        <div v-if="message" :class="`alert alert-${messageType === 'error' ? 'danger' : 'success'}`">
          {{ message }}
        </div>
      </form>

      <!-- Sign Up Form -->
      <form v-if="activeTab === 'signup'" @submit.prevent="handleSignup">
        <div class="mb-3">
          <label for="signupEmail" class="form-label">Email Address</label>
          <input 
            type="email" 
            class="form-control" 
            id="signupEmail" 
            v-model="signupForm.email"
            placeholder="your@email.com"
            required
          >
        </div>

        <div class="mb-3">
          <label for="signupPassword" class="form-label">Password</label>
          <div class="input-group">
            <input 
              :type="showPassword ? 'text' : 'password'" 
              class="form-control" 
              id="signupPassword" 
              v-model="signupForm.password"
              placeholder="Minimum 6 characters"
              required
              minlength="6"
            >
            <button 
              class="btn btn-outline-secondary" 
              type="button"
              @click="showPassword = !showPassword"
            >
              <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
            </button>
          </div>
          <small class="form-text text-muted">Minimum 6 characters</small>
        </div>

        <div class="mb-3">
          <label for="confirmPassword" class="form-label">Confirm Password</label>
          <input 
            type="password" 
            class="form-control" 
            id="confirmPassword" 
            v-model="signupForm.confirmPassword"
            placeholder="Re-enter password"
            required
          >
        </div>

        <button type="submit" class="btn btn-primary w-100 mb-3" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          <i v-else class="bi bi-person-plus me-2"></i>
          {{ loading ? 'Creating account...' : 'Create Account' }}
        </button>

        <div v-if="message" :class="`alert alert-${messageType === 'error' ? 'danger' : 'success'}`">
          {{ message }}
        </div>
      </form>
    </div>
    <!-- End of login-card -->
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import AnimatedBackground from '@/components/AnimatedBackground.vue'

const router = useRouter()
const activeTab = ref('login')
const loading = ref(false)
const message = ref('')
const messageType = ref('info')
const rememberMe = ref(true)
const showPassword = ref(false)

const loginForm = ref({
  email: '',
  password: ''
})

const signupForm = ref({
  email: '',
  password: '',
  confirmPassword: ''
})

const toggleTab = () => {
  activeTab.value = activeTab.value === 'login' ? 'signup' : 'login'
  message.value = ''
  showPassword.value = false
  loginForm.value = { email: '', password: '' }
  signupForm.value = { email: '', password: '', confirmPassword: '' }
}

const handleLogin = async () => {
  loading.value = true
  message.value = ''
  
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.value.email,
      password: loginForm.value.password
    })
    
    if (error) throw error
    
    message.value = 'Success! Redirecting...'
    messageType.value = 'success'
    setTimeout(() => router.push('/pantry'), 1000)
  } catch (error) {
    message.value = error.message
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}

const handleSignup = async () => {
  if (signupForm.value.password !== signupForm.value.confirmPassword) {
    message.value = 'Passwords do not match'
    messageType.value = 'error'
    return
  }
  
  if (signupForm.value.password.length < 6) {
    message.value = 'Password must be at least 6 characters'
    messageType.value = 'error'
    return
  }
  
  loading.value = true
  message.value = ''
  
  try {
    const { error } = await supabase.auth.signUp({
      email: signupForm.value.email,
      password: signupForm.value.password
    })
    
    if (error) throw error
    
    message.value = 'Account created! Check your email to verify, then sign in.'
    messageType.value = 'success'
    setTimeout(() => {
      activeTab.value = 'login'
      signupForm.value = { email: '', password: '', confirmPassword: '' }
    }, 3000)
  } catch (error) {
    message.value = error.message
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 3rem 2.5rem;
  width: 100%;
  max-width: 450px;
  position: relative;
  z-index: 1;
  animation: slideUp 0.6s ease-out;
}

/* Add subtle animation to login card */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-circle {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #ff6b1a 0%, #ffb347 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-title {
  font-size: 2rem;  
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.welcome-text {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1rem;
}

.switch-text {
  color: #666;
  margin: 0;
}

.switch-link {
  color: #ff6b1a;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  margin-left: 0.25rem;
}

.switch-link:hover {
  color: #e55f17;
  text-decoration: underline;
}

.form-label {
  font-weight: 600;
  color: #333;
}

.form-control {
  border: 1px solid #ff914d;
  border-radius: 8px;
  padding: 0.75rem;
}

.form-control:focus {
  border-color: #ff6b1a;
  box-shadow: 0 0 0 0.2rem rgba(200, 153, 96, 0.25);
}

.btn-primary {
  background: linear-gradient(135deg, #ff6b1a 0%, #ff9800 100%);
  border: none;
  padding: 0.75rem;
  font-weight: 600;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #ff6b1a 0%, #e55f17 100%);
}

.btn-outline-secondary {
  border-color: #ffb347;
  color: #e55f17;
}

.btn-outline-secondary:hover {
  background-color: #f5e6d3;
  border-color: #ffb347;
  color: #e55f17;
}

.forgot-link {
  color: #ff6b1a;
  text-decoration: none;
  font-size: 0.9rem;
}

.forgot-link:hover {
  color: #e55f17;
  text-decoration: underline;
}

@media (max-width: 500px) {
  .login-card {
    padding: 2rem 1.5rem;
  }
}
</style>