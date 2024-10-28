import { createRouter, createWebHistory } from 'vue-router'
import TopViewVue from '@/views/TopView.vue'
import WorksViewVue from '@/views/WorksView.vue'
import WorkEditViewVue from '@/views/WorkEditView.vue'
import PasswordResetVue from '@/views/PasswordReset.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'top',
      component: TopViewVue
    },
    {
      path: '/works',
      name: 'works',
      component: WorksViewVue
    },
    {
      path: '/works/:id',
      name: 'workedit',
      component: WorkEditViewVue,
      props: true
    },
    {
      path: '/password-reset',
      name: 'password-reset',
      component: PasswordResetVue
    }
  ]
})

export default router
