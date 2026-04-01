<template>
  <div class="app-layout">
    <header class="app-header">
      <div class="header-left">
        <img src="/logo.png" alt="Logo" class="logo" />
        <nav class="header-nav">
          <router-link to="/" class="nav-link" :class="{ active: $route.path === '/' }">
            {{ $t('app.navCalendar') }}
          </router-link>
          <router-link to="/best-dorm" class="nav-link" :class="{ active: $route.path === '/best-dorm' }">
            {{ $t('app.navBestDorm') }}
          </router-link>
          <router-link to="/best-class" class="nav-link" :class="{ active: $route.path === '/best-class' }">
            {{ $t('app.navBestClass') }}
          </router-link>
          <router-link to="/universities" class="nav-link" :class="{ active: $route.path.startsWith('/universit') }">
            {{ $t('app.navUniversities') }}
          </router-link>
          <router-link to="/essay-guide" class="nav-link" :class="{ active: $route.path === '/essay-guide' }">
            {{ $t('app.navEssayGuide') }}
          </router-link>
          <router-link to="/essay-examples" class="nav-link" :class="{ active: $route.path.startsWith('/essay-examples') || $route.path.startsWith('/essay-detail') }">
            {{ $t('app.navEssayExamples') }}
          </router-link>
        </nav>
      </div>
      <button class="lang-btn" @click="switchLang">
        {{ $t('app.langSwitch') }}
      </button>
    </header>
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
function switchLang() {
  const LOCALE_KEY = 'competition-calendar-locale'
  const current = localStorage.getItem(LOCALE_KEY) || 'zh-CN'
  localStorage.setItem(LOCALE_KEY, current === 'zh-CN' ? 'en' : 'zh-CN')
  window.location.reload()
}
</script>

<style>
/* Global reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  background: linear-gradient(135deg, #f0f7fc 0%, #e8f4f8 100%);
  min-height: 100vh;
}
</style>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #5b9bd5 0%, #3870a0 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 64px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.logo {
  height: 40px;
  width: auto;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-link {
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
  padding: 6px 16px;
  border-radius: 16px;
  transition: all 0.25s ease;
}

.nav-link:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
}

.nav-link.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
}

.lang-btn {
  color: #fff;
  padding: 6px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.25s ease;
}

.lang-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.app-main {
  flex: 1;
  padding: 20px;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .app-header {
    padding: 0 12px;
    height: 56px;
  }

  .logo {
    height: 32px;
  }

  .header-left {
    gap: 12px;
  }

  .nav-link {
    font-size: 13px;
    padding: 4px 10px;
  }

  .app-main {
    padding: 12px 8px;
  }
}

@media (max-width: 480px) {
  .header-left {
    gap: 8px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .logo {
    height: 28px;
    flex-shrink: 0;
  }

  .header-nav {
    flex-shrink: 0;
  }

  .nav-link {
    font-size: 12px;
    padding: 4px 8px;
    white-space: nowrap;
  }

  .lang-btn {
    padding: 4px 10px;
    font-size: 12px;
    flex-shrink: 0;
  }
}
</style>
