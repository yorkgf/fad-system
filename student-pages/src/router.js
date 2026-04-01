import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from './auth.js'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('./components/AccessGate.vue'),
    meta: { public: true }
  },
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
  },
  {
    path: '/universities',
    name: 'UniversityList',
    component: () => import('./views/UniversityList.vue')
  },
  {
    path: '/university/:id',
    name: 'UniversityDetail',
    component: () => import('./views/UniversityDetail.vue')
  },
  {
    path: '/essay-guide',
    name: 'EssayGuide',
    component: () => import('./views/EssayGuide.vue')
  },
  {
    path: '/essay-examples',
    name: 'EssayExamples',
    component: () => import('./views/EssayExamples.vue')
  },
  {
    path: '/essay-detail/:source/:theme',
    name: 'EssayDetail',
    component: () => import('./views/EssayDetail.vue')
  },
  {
    path: '/knowledge/:doc',
    name: 'KnowledgeViewer',
    component: () => import('./views/KnowledgeBaseViewer.vue')
  },
  {
    path: '/knowledge/:doc/:category',
    name: 'KnowledgeLesson',
    component: () => import('./views/KnowledgeBaseViewer.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  if (to.meta.public) return true
  if (!isAuthenticated()) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
