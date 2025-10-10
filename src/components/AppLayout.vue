<template>
  <div>
    <!-- Fixed Navbar -->
    <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm fixed-top">
      <div class="container">
        <router-link to="/pantry" class="navbar-brand">
          <i class="bi bi-cart3 me-2" style="color: #c89960; font-size: 1.5rem;"></i>
          <span class="fw-bold" style="color: #c89960;">Dishcovery</span>
        </router-link>
        
        <button 
          class="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto align-items-lg-center">
            <li class="nav-item">
              <router-link to="/pantry" class="nav-link">
                <i class="bi bi-box-seam me-1"></i>
                Pantry
              </router-link>
            </li>
            <li class="nav-item">
              <router-link to="/recipes" class="nav-link">
                <i class="bi bi-book me-1"></i>
                Recipes
              </router-link>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#">
                <i class="bi bi-calendar-week me-1"></i>
                Meal Planner
              </a>
            </li>
            <li class="nav-item">
              <button @click="handleLogout" class="btn btn-danger btn-sm ms-lg-3 mt-2 mt-lg-0">
                <i class="bi bi-box-arrow-right me-1"></i>
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Page Content -->
    <div class="content-wrapper">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const router = useRouter()

const handleLogout = async () => {
  await supabase.auth.signOut()
  router.push('/login')
}
</script>

<style scoped>
.navbar {
  z-index: 1000;
}

.navbar-brand {
  font-size: 1.5rem;
}

.nav-link {
  color: #666;
  font-weight: 500;
  transition: color 0.3s;
  padding: 0.5rem 1rem;
}

.nav-link:hover {
  color: #c89960;
}

.nav-link.router-link-active {
  color: #c89960;
  font-weight: 600;
}

.content-wrapper {
  padding-top: 70px; /* Offset for fixed navbar */
  min-height: 100vh;
  background: #f8f9fa;
}

@media (max-width: 991px) {
  .navbar-nav {
    padding-top: 1rem;
  }
  
  .nav-item {
    padding: 0.25rem 0;
  }
}
</style>