import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import NotFound from '@/views/NotFound.vue'
import AuthView from '@/views/Auth/AuthView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/auth',
      name: 'auth',
      component: AuthView
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not_found',
      component: NotFound
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not_found',
      component: NotFound
    }
  ]
})

export default router
