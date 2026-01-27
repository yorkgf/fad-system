import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'Home',
          component: () => import('@/views/Home.vue'),
          meta: { title: '首页' }
        },
        // 记录模块
      {
        path: 'records/insert',
        name: 'InsertRecord',
        component: () => import('@/views/records/InsertRecord.vue'),
        meta: { title: '录入记录' }
      },
      {
        path: 'records/my',
        name: 'MyRecords',
        component: () => import('@/views/records/MyRecords.vue'),
        meta: { title: '我的记录' }
      },
      // FAD模块
      {
        path: 'fad/execution',
        name: 'FADExecution',
        component: () => import('@/views/fad/FADExecution.vue'),
        meta: { title: 'FAD执行' }
      },
      {
        path: 'fad/deliver',
        name: 'FADDeliver',
        component: () => import('@/views/fad/FADDeliver.vue'),
        meta: { title: 'FAD通知单发放' }
      },
      {
        path: 'fad/stats',
        name: 'FADStats',
        component: () => import('@/views/fad/FADStats.vue'),
        meta: { title: 'FAD统计' }
      },
      // Reward模块
      {
        path: 'reward/deliver',
        name: 'RewardDeliver',
        component: () => import('@/views/reward/RewardDeliver.vue'),
        meta: { title: 'Reward通知单发放' }
      },
      // 寝室模块
      {
        path: 'room/praise-reward',
        name: 'RoomPraiseReward',
        component: () => import('@/views/room/PraiseReward.vue'),
        meta: { title: '寝室表扬兑奖' }
      },
      {
        path: 'room/clean',
        name: 'RoomClean',
        component: () => import('@/views/room/RoomClean.vue'),
        meta: { title: '寝室清扫' }
      },
      {
        path: 'room/best-dorm',
        name: 'BestDormRanking',
        component: () => import('@/views/room/BestDormRanking.vue'),
        meta: { title: '最佳寝室排名' }
      },
      // 其他模块
      {
        path: 'elec/violations',
        name: 'ElecViolations',
        component: () => import('@/views/elec/Violations.vue'),
        meta: { title: '电子产品违规' }
      },
      {
        path: 'phone/no-phone-list',
        name: 'NoPhoneList',
        component: () => import('@/views/phone/NoPhoneList.vue'),
        meta: { title: '未交手机名单' }
      },
      {
        path: 'stop-class',
        name: 'StopClass',
        component: () => import('@/views/StopClass.vue'),
        meta: { title: '停课名单' }
      },
      {
        path: 'teaching-tickets',
        name: 'TeachingTickets',
        component: () => import('@/views/TeachingTickets.vue'),
        meta: { title: '教学票兑奖' }
      },
      {
        path: 'data/all',
        name: 'AllData',
        component: () => import('@/views/data/AllData.vue'),
        meta: { title: '数据查询' }
      },
      {
        path: 'settings/password',
        name: 'ChangePassword',
        component: () => import('@/views/settings/ChangePassword.vue'),
        meta: { title: '修改密码' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth !== false && !userStore.isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && userStore.isLoggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router
