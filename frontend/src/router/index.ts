import { createRouter, createWebHistory } from 'vue-router'
import TopViewVue from '@/views/TopView.vue'
import WorksViewVue from '@/views/WorksView.vue'
import WorkEditViewVue from '@/views/WorkEditView.vue'

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
    }
  ]
})

export default router
