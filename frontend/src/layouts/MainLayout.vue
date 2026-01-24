<template>
  <el-container class="main-layout">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="aside">
      <div class="logo">
        <img src="/logo.png" alt="Logo" class="logo-img" />
        <span v-if="!isCollapse" class="logo-text">FAD 管理系统</span>
      </div>

      <el-menu
        :default-active="$route.path"
        :collapse="isCollapse"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-sub-menu index="records">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>记录管理</span>
          </template>
          <el-menu-item index="/records/insert">
            <el-icon><Edit /></el-icon>
            <span>录入记录</span>
          </el-menu-item>
          <el-menu-item index="/records/my">
            <el-icon><List /></el-icon>
            <span>我的记录</span>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="fad">
          <template #title>
            <el-icon><Warning /></el-icon>
            <span>FAD管理</span>
          </template>
          <el-menu-item index="/fad/execution">
            <el-icon><Check /></el-icon>
            <span>FAD执行</span>
          </el-menu-item>
          <el-menu-item index="/fad/deliver">
            <el-icon><Promotion /></el-icon>
            <span>FAD通知单发放</span>
          </el-menu-item>
          <el-menu-item index="/fad/stats">
            <el-icon><DataLine /></el-icon>
            <span>FAD统计</span>
          </el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/reward/deliver">
          <el-icon><Trophy /></el-icon>
          <span>Reward通知单发放</span>
        </el-menu-item>

        <el-sub-menu index="room">
          <template #title>
            <el-icon><House /></el-icon>
            <span>寝室管理</span>
          </template>
          <el-menu-item index="/room/praise-reward">
            <el-icon><Star /></el-icon>
            <span>寝室表扬兑奖</span>
          </el-menu-item>
          <el-menu-item index="/room/clean">
            <el-icon><Brush /></el-icon>
            <span>寝室清扫</span>
          </el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/elec/violations">
          <el-icon><Monitor /></el-icon>
          <span>电子产品违规</span>
        </el-menu-item>

        <el-menu-item index="/phone/no-phone-list">
          <el-icon><Iphone /></el-icon>
          <span>未交手机名单</span>
        </el-menu-item>

        <el-menu-item index="/stop-class">
          <el-icon><CircleClose /></el-icon>
          <span>停课名单</span>
        </el-menu-item>

        <el-menu-item index="/teaching-tickets">
          <el-icon><Ticket /></el-icon>
          <span>教学票兑奖</span>
        </el-menu-item>

        <el-menu-item index="/data/all">
          <el-icon><Search /></el-icon>
          <span>数据查询</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- 顶部导航 -->
      <el-header class="header">
        <div class="header-left">
          <el-icon
            class="collapse-btn"
            @click="isCollapse = !isCollapse"
          >
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>{{ $route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
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
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const isCollapse = ref(false)

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
  height: 100vh;
}

.aside {
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;
}

.logo {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  background-color: #263445;
  padding: 0 14px;
}

.logo-img {
  height: 90px;
  width: 90px;
  object-fit: contain;
  flex-shrink: 0;
}

.logo-text {
  white-space: nowrap;
  overflow: hidden;
}

.el-menu {
  border-right: none;
}

.header {
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #606266;
}

.collapse-btn:hover {
  color: #409eff;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #606266;
}

.user-info:hover {
  color: #409eff;
}

.main {
  background-color: #f5f7fa;
  padding: 20px;
}
</style>
