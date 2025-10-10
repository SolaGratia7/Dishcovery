import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from '@/lib/supabase'
import LoginView from '@/views/LoginView.vue'
import PantryView from '@/views/PantryView.vue'
import RecipeView from '@/views/RecipeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/pantry'
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false }
    },
    {
      path: '/pantry',
      name: 'pantry',
      component: PantryView,
      meta: { requiresAuth: true }
    },
    {
      path: '/recipes',
      name: 'recipes',
      component: RecipeView,
      meta: { requiresAuth: true }
    }
  ]
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const authenticated = await isAuthenticated()
  
  if (to.meta.requiresAuth && !authenticated) {
    next('/login')
  } else if (to.path === '/login' && authenticated) {
    next('/pantry')
  } else {
    next()
  }
})

export default router