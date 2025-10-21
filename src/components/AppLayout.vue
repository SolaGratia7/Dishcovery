<template>
  <div>
    <!-- Fixed Navbar -->
    <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm fixed-top">
      <div class="container">
        <router-link to="/home" class="navbar-brand">
          <div class="brand-icon">
            <div class="mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#ff6b1a" stroke-width="2">
                <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/>
                <line x1="6" y1="17" x2="18" y2="17"/>
              </svg>
            </div>  
          </div>
          <span class="brand-name">Dishcovery</span>
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
              <router-link to="/home" class="nav-link">
                <i class="bi bi-box-seam me-1"></i>
                Home
              </router-link>
            </li>            
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
              <router-link to="/planning" class="nav-link">
                <i class="bi bi-calendar-week me-1"></i>
                Meal Planner
              </router-link>
            </li>
            <li class="nav-item">
              <router-link to="/shopping" class="nav-link">
                <i class="bi bi-cart3"></i>
                Shopping cart
              </router-link>
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
.navbar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
}

.brand-icon {
  width: 10px;
  height: 10px;
  display: flex;
  margin: 1rem;
  align-items: center;
  justify-content: center;
}

.brand-icon i,
.brand-icon svg {
  color: white;
  font-size: 1.5rem;
}

.brand-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #ff6b1a;
}

.nav-link {
  color: #666;
  font-weight: 500;
  transition: color 0.3s;
  padding: 0.5rem 1rem;
}

.nav-link:hover {
  color: #ff6b1a;
}

.nav-link.router-link-active {
  color: #ff6b1a;
  font-weight: 600;
}

.content-wrapper {
  padding-top: 70px; /* Offset for fixed navbar */
  min-height: 100vh;
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