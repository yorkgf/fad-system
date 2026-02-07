import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getMyClassAsHomeTeacher } from '@/api/students'

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
        path: 'fad/school-stats',
        name: 'SchoolFADStats',
        component: () => import('@/views/fad/SchoolFADStats.vue'),
        meta: { title: '学校FAD统计' }
      },
      {
        path: 'fad/class-stats',
        name: 'ClassFADStats',
        component: () => import('@/views/fad/ClassFADStats.vue'),
        meta: { title: '班级FAD统计' }
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
        meta: { title: '网课违规使用电子产品' }
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

// C组和F组用户可访问的路由
const limitedAllowedRoutes = ['/', '/records/insert', '/records/my', '/settings/password', '/login']

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth !== false && !userStore.isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && userStore.isLoggedIn) {
    next('/')
  } else if ((userStore.userGroup === 'C' || userStore.userGroup === 'F') && !limitedAllowedRoutes.includes(to.path)) {
    // C组和F组用户尝试访问未授权页面，重定向到首页
    next('/')
  } else if (to.path === '/fad/school-stats') {
    // 学校FAD统计页面：S组、A组可以访问
    if (userStore.userGroup === 'S' || userStore.userGroup === 'A') {
      next()
    } else {
      next('/')
    }
  } else if (to.path === '/fad/class-stats') {
    // 班级FAD统计页面：B组、T组、S组、A组班主任可以访问（都需要班主任权限）
    if (['B', 'T', 'S', 'A'].includes(userStore.userGroup)) {
      // B组、T组、S组、A组都需要检查是否为班主任
      try {
        const res = await getMyClassAsHomeTeacher()
        if (res.success && res.data) {
          next()
        } else {
          next('/')
        }
      } catch (error) {
        console.error('获取班主任班级信息失败:', error)
        next('/')
      }
    } else {
      next('/')
    }
  } else if (to.path === '/fad/execution') {
    // FAD执行页面：S组、T组、B组、A组可以访问
    if (['S', 'T', 'B', 'A'].includes(userStore.userGroup)) {
      next()
    } else {
      next('/')
    }
  } else if (to.path === '/room/clean' || to.path === '/room/best-dorm') {
    // 寝室清扫、最佳寝室排名页面：S组、A组可以访问
    if (['S', 'A'].includes(userStore.userGroup)) {
      next()
    } else {
      next('/')
    }
  } else if (to.path === '/elec/violations' || to.path === '/phone/no-phone-list') {
    // 网课违规使用电子产品、未交手机名单页面：S组、T组、B组、A组可以访问
    if (['S', 'T', 'B', 'A'].includes(userStore.userGroup)) {
      next()
    } else {
      next('/')
    }
  } else if (to.path === '/stop-class' || to.path === '/data/all') {
    // 约谈/停课管理、数据查询页面：S组、A组可以访问
    if (['S', 'A'].includes(userStore.userGroup)) {
      next()
    } else {
      next('/')
    }
  } else {
    next()
  }
})

export default router
