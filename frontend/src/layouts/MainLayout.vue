<template>
  <div class="main-layout">
    <!-- 顶部导航 -->
    <el-header class="header">
      <div class="header-left">
        <img src="/logo.png" alt="Logo" class="logo" />
        <span class="app-name">FAD 学生管理系统</span>
      </div>
      <div class="header-right">
        <el-dropdown @command="handleCommand">
          <span class="user-info">
            <el-icon><User /></el-icon>
            {{ userStore.username }}
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="password">
                <el-icon><Key /></el-icon>
                修改密码
              </el-dropdown-item>
              <el-dropdown-item command="logout" divided>
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <!-- 主内容区 -->
    <el-main class="main">
      <!-- 首页：显示功能卡片 -->
      <div v-if="isHomePage" class="dashboard">
        <h2 class="dashboard-title">功能导航</h2>
        <div class="function-cards">
          <div
            v-for="item in functionCards"
            :key="item.path"
            class="function-card"
            @click="navigateTo(item.path)"
          >
            <div class="card-icon" :style="{ background: item.color }">
              <el-icon :size="32">
                <component :is="item.icon" />
              </el-icon>
            </div>
            <div class="card-title">{{ item.title }}</div>
            <div class="card-subtitle">{{ item.subtitle }}</div>
          </div>
        </div>
      </div>

      <!-- 其他页面：显示内容 + 返回按钮 -->
      <div v-else class="page-content">
        <div class="page-header">
          <el-button
            text
            :icon="ArrowLeft"
            @click="goHome"
            class="back-btn"
          >
            返回首页
          </el-button>
          <h2 class="page-title">{{ $route.meta.title }}</h2>
        </div>
        <div class="page-body">
          <router-view />
        </div>
      </div>
    </el-main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 是否为首页
const isHomePage = computed(() => route.path === '/')

import { getMyClassAsHomeTeacher } from '@/api/students'

// 存储当前用户作为班主任的班级信息
const myClass = ref(null)

// 初始化函数，获取用户班级信息
onMounted(async () => {
  if (['B', 'T', 'S', 'A'].includes(userStore.userGroup)) {
    try {
      const res = await getMyClassAsHomeTeacher()
      if (res.success) {
        myClass.value = res.data
      }
    } catch (error) {
      console.error('获取班主任班级信息失败:', error)
    }
  }
})

// 功能卡片列表
const functionCards = computed(() => {
  const baseCards = [
    {
      title: '录入记录',
      subtitle: '添加学生行为记录',
      path: '/records/insert',
      icon: 'Edit',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      groups: ['S', 'F', 'C', 'T', 'B', 'A'] // 所有用户可见
    },
    {
      title: '我的记录',
      subtitle: '查看已录入的记录',
      path: '/records/my',
      icon: 'List',
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      groups: ['S', 'F', 'C', 'T', 'B', 'A'] // 所有用户可见
    },
    {
      title: 'FAD执行',
      subtitle: '管理FAD执行状态',
      path: '/fad/execution',
      icon: 'Check',
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      groups: ['S', 'T', 'B', 'A'] // S组、T组、B组、A组可见
    },
    {
      title: 'FAD通知单发放',
      subtitle: '发放纸质通知单',
      path: '/fad/deliver',
      icon: 'Promotion',
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      groups: ['S']
    },
    {
      title: '学校FAD统计',
      subtitle: '查看全校FAD数据统计',
      path: '/fad/school-stats',
      icon: 'DataLine',
      color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      groups: ['S', 'A'] // S、A组可见
    },
    {
      title: '班级FAD统计',
      subtitle: '查看本班FAD数据统计',
      path: '/fad/class-stats',
      icon: 'DataLine',
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      groups: ['B', 'T', 'S', 'A'] // B、T、S、A组班主任可见（需班主任权限）
    },
    {
      title: '寝室表扬兑奖',
      subtitle: '兑换寝室表扬奖励',
      path: '/room/praise-reward',
      icon: 'Star',
      color: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      groups: ['S']
    },
    {
      title: '寝室清扫',
      subtitle: '记录寝室清扫情况',
      path: '/room/clean',
      icon: 'Brush',
      color: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
      groups: ['S', 'A']
    },
    {
      title: '最佳寝室排名',
      subtitle: '查看优秀寝室排行',
      path: '/room/best-dorm',
      icon: 'TrophyBase',
      color: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      groups: ['S', 'A']
    },
    {
      title: '网课违规使用电子产品',
      subtitle: '暂停网课资格名单',
      path: '/elec/violations',
      icon: 'Monitor',
      color: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
      groups: ['S', 'T', 'B', 'A'] // S组、T组、B组、A组可见
    },
    {
      title: '未交手机名单',
      subtitle: '查看未交手机学生',
      path: '/phone/no-phone-list',
      icon: 'Iphone',
      color: 'linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)',
      groups: ['S', 'T', 'B', 'A'] // S组、T组、B组、A组可见
    },
    {
      title: '约谈/停课管理',
      subtitle: '管理约谈和停课记录',
      path: '/stop-class',
      icon: 'CircleClose',
      color: 'linear-gradient(135deg, #cd9cf2 0%, #f6f3ff 100%)',
      groups: ['S', 'A']
    },
    {
      title: '教学票兑奖',
      subtitle: '兑换教学奖励',
      path: '/teaching-tickets',
      icon: 'Ticket',
      color: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
      groups: ['S']
    },
    {
      title: '数据查询',
      subtitle: '查询所有数据',
      path: '/data/all',
      icon: 'Search',
      color: 'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)',
      groups: ['S', 'A']
    },
    {
      title: '日程管理',
      subtitle: '预约教师面谈时间',
      path: '/schedule',
      icon: 'Calendar',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      groups: ['S', 'A', 'B', 'T', 'F']
    }
  ]

  // 根据用户组和权限过滤功能卡片
  const currentGroup = userStore.userGroup || 'F'

  // 首先根据用户组进行初步过滤
  let filteredCards = baseCards.filter(card => card.groups.includes(currentGroup))

  // 对于 B、T、S 和 A 组的用户，需要进一步判断是否为班主任才能显示班级FAD统计功能
  if (currentGroup === 'B' || currentGroup === 'T' || currentGroup === 'S' || currentGroup === 'A') {
    filteredCards = filteredCards.filter(card => {
      if (card.path === '/fad/class-stats') {
        // 只有是班主任的用户才能看到班级FAD统计功能
        return !!myClass.value
      }
      return true
    })
  }

  return filteredCards
})

// 导航到指定路径
const navigateTo = (path) => {
  router.push(path)
}

// 返回首页
const goHome = () => {
  router.push('/')
}

// 处理下拉菜单命令
const handleCommand = (command) => {
  if (command === 'logout') {
    userStore.logout()
    router.push('/login')
  } else if (command === 'password') {
    router.push('/settings/password')
  }
}
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 顶部导航 */
.header {
  background: linear-gradient(135deg, #5b9bd5 0%, #3870a0 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  height: 64px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo {
  height: 40px;
  width: auto;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

.app-name {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #fff;
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.25s ease;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.1);
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 主内容区 */
.main {
  flex: 1;
  background: linear-gradient(135deg, #f0f7fc 0%, #e8f4f8 100%);
  padding: 20px;
  overflow-y: auto;
}

/* 首页：功能卡片 */
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-title {
  color: #3870a0;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  text-align: center;
}

.function-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding: 20px 0;
}

.function-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(91, 155, 213, 0.08);
  border: 1px solid rgba(91, 155, 213, 0.1);
}

.function-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(91, 155, 213, 0.15);
}

.card-icon {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-bottom: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-title {
  color: #3870a0;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
}

.card-subtitle {
  color: #666;
  font-size: 14px;
  text-align: center;
}

/* 页面内容 */
.page-content {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.back-btn {
  font-size: 16px;
  color: #5b9bd5;
  font-weight: 500;
}

.back-btn:hover {
  background: rgba(91, 155, 213, 0.1);
}

.page-title {
  color: #3870a0;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.page-body {
  background: transparent;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .function-cards {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }

  .app-name {
    font-size: 16px;
  }
}

@media (max-width: 992px) {
  .header {
    padding: 0 16px;
    height: 60px;
  }

  .logo {
    height: 36px;
  }

  .app-name {
    font-size: 14px;
  }

  .function-cards {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }

  .function-card {
    padding: 20px;
  }

  .card-icon {
    width: 64px;
    height: 64px;
  }

  .card-title {
    font-size: 16px;
  }

  .card-subtitle {
    font-size: 13px;
  }

  .dashboard-title {
    font-size: 20px;
  }

  .page-title {
    font-size: 20px;
  }
}

@media (max-width: 768px) {
  .header {
    padding: 0 12px;
  }

  .logo {
    height: 32px;
  }

  .app-name {
    font-size: 13px;
  }

  .user-info {
    padding: 6px 12px;
    font-size: 14px;
    gap: 6px;
  }

  .main {
    padding: 16px 12px;
  }

  .function-cards {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 12px 0;
  }

  .function-card {
    padding: 16px;
    flex-direction: row;
    text-align: left;
    gap: 16px;
  }

  .card-icon {
    width: 56px;
    height: 56px;
    margin-bottom: 0;
    flex-shrink: 0;
  }

  .card-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .card-title {
    font-size: 15px;
    text-align: left;
  }

  .card-subtitle {
    font-size: 12px;
    text-align: left;
  }

  .dashboard-title {
    font-size: 18px;
    margin-bottom: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .page-title {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .header {
    padding: 0 8px;
    height: 56px;
  }

  .logo {
    height: 28px;
  }

  .app-name {
    display: none;
  }

  .user-info {
    padding: 4px 8px;
    font-size: 12px;
  }

  .main {
    padding: 12px 8px;
  }

  .function-card {
    padding: 12px;
    gap: 12px;
  }

  .card-icon {
    width: 48px;
    height: 48px;
  }

  .card-title {
    font-size: 14px;
  }

  .card-subtitle {
    font-size: 11px;
  }

  .dashboard-title {
    font-size: 16px;
  }

  .page-title {
    font-size: 16px;
  }

  .back-btn {
    font-size: 14px;
  }
}
</style>
