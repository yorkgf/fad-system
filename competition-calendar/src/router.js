import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'CompetitionCalendar',
    component: () => import('./CompetitionCalendar.vue')
  },
  {
    path: '/best-dorm',
    name: 'BestDormRanking',
    component: () => import('./BestDormRanking.vue')
  },
  {
    path: '/best-class',
    name: 'BestClassRanking',
    component: () => import('./BestClassRanking.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
