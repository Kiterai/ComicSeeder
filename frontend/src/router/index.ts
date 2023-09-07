import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'top',
      component: HomeView
    },
    {
      path: '/works',
      name: 'works',
      component: HomeView
    },
    {
      path: '/works/:id',
      name: 'workedit',
      component: HomeView
    }
  ]
})

export default router
