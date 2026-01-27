<template>
  <router-view />
</template>

<script setup>
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  /* 防止 iOS 双击缩放 */
  touch-action: manipulation;
  /* 平滑滚动 */
  scroll-behavior: smooth;
  /* 防止文字大小自动调整 */
  -webkit-text-size-adjust: 100%;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', Arial, sans-serif;
  background: linear-gradient(135deg, #f0f7fc 0%, #e8f4f8 100%);
  /* 防止橡皮筋滚动效果 */
  overscroll-behavior: none;
  /* 优化字体渲染 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Element Plus 组件样式覆盖 - 清新校园风格 */
:root {
  --el-color-primary: #5b9bd5;
  --el-color-primary-light-3: #7ab3e0;
  --el-color-primary-light-5: #99c9eb;
  --el-color-primary-light-7: #b8dff5;
  --el-color-primary-light-8: #c8e9fa;
  --el-color-primary-light-9: #d8f3fc;
  --el-color-primary-dark-2: #3870a0;
  --el-border-radius-base: 12px;
  --el-border-radius-small: 8px;
  --el-border-radius-round: 20px;
  --el-border-radius-circle: 50%;
}

/* 卡片圆角和阴影 */
.el-card {
  border-radius: 16px !important;
  border: 1px solid rgba(91, 155, 213, 0.15) !important;
  box-shadow: 0 4px 16px rgba(91, 155, 213, 0.08) !important;
  overflow: hidden;
}

.el-card__header {
  background: linear-gradient(135deg, #f8fafc 0%, #f0f7fc 100%) !important;
  border-bottom: 1px solid rgba(91, 155, 213, 0.1) !important;
  padding: 16px 20px !important;
}

.el-card__body {
  padding: 20px !important;
}

/* 表格样式 */
.el-table {
  border-radius: 12px !important;
  overflow: hidden;
}

.el-table th.el-table__cell {
  background: linear-gradient(135deg, #f8fafc 0%, #f0f7fc 100%) !important;
  color: #3870a0 !important;
  font-weight: 600;
}

.el-table tr:hover > td {
  background-color: rgba(91, 155, 213, 0.05) !important;
}

/* 按钮样式 */
.el-button {
  border-radius: 10px !important;
  font-weight: 500;
  transition: all 0.25s ease;
}

.el-button--primary {
  background: linear-gradient(135deg, #5b9bd5 0%, #3870a0 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(91, 155, 213, 0.3);
}

.el-button--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(91, 155, 213, 0.4);
}

/* 输入框样式 */
.el-input__wrapper,
.el-textarea__inner,
.el-select .el-input__wrapper {
  border-radius: 10px !important;
  box-shadow: 0 0 0 1px rgba(91, 155, 213, 0.2) inset !important;
  transition: all 0.25s ease;
}

.el-input__wrapper:hover,
.el-textarea__inner:hover {
  box-shadow: 0 0 0 1px rgba(91, 155, 213, 0.4) inset !important;
}

.el-input__wrapper.is-focus,
.el-textarea__inner:focus {
  box-shadow: 0 0 0 1px #5b9bd5 inset !important;
}

/* 对话框样式 */
.el-dialog {
  border-radius: 16px !important;
  overflow: hidden;
}

.el-dialog__header {
  background: linear-gradient(135deg, #f8fafc 0%, #f0f7fc 100%);
  border-bottom: 1px solid rgba(91, 155, 213, 0.1);
}

/* 消息提示样式 */
.el-message {
  border-radius: 12px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
}

/* 标签样式 */
.el-tag {
  border-radius: 8px !important;
  font-weight: 500;
}

/* 分页样式 */
.el-pagination {
  gap: 8px;
}

.el-pagination button,
.el-pager li {
  border-radius: 8px !important;
  font-weight: 500;
}

.el-pager li.is-active {
  background: linear-gradient(135deg, #5b9bd5 0%, #3870a0 100%) !important;
}

/* 下拉菜单样式 */
.el-dropdown-menu {
  border-radius: 12px !important;
  border: 1px solid rgba(91, 155, 213, 0.15) !important;
  box-shadow: 0 4px 16px rgba(91, 155, 213, 0.12) !important;
  padding: 8px !important;
}

.el-dropdown-menu__item {
  border-radius: 8px !important;
  margin: 2px 0;
  padding: 8px 16px;
}

.el-dropdown-menu__item:hover {
  background: rgba(91, 155, 213, 0.1) !important;
  color: #5b9bd5 !important;
}

/* 表单项样式 */
.el-form-item__label {
  color: #3870a0 !important;
  font-weight: 500;
}

/* 选择器下拉面板 */
.el-select-dropdown {
  border-radius: 12px !important;
  border: 1px solid rgba(91, 155, 213, 0.15) !important;
}

.el-select-dropdown__item.is-selected {
  color: #5b9bd5 !important;
  font-weight: 500;
}

/* 日期选择器 */
.el-picker-panel {
  border-radius: 12px !important;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(91, 155, 213, 0.05);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(91, 155, 213, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(91, 155, 213, 0.5);
}

/* ========== 移动端响应式优化 ========== */

/* 表格响应式 - 移动端横向滚动 */
@media (max-width: 768px) {
  /* 表格容器横向滚动 */
  .el-table {
    width: 100% !important;
  }

  .el-card__body {
    padding: 12px !important;
    overflow-x: auto;
  }

  /* 表格内容最小宽度，确保可滚动 */
  .el-table__body-wrapper {
    overflow-x: auto !important;
  }

  /* 表格单元格紧凑 */
  .el-table .el-table__cell {
    padding: 8px 4px !important;
    font-size: 13px !important;
  }

  .el-table th.el-table__cell {
    padding: 10px 4px !important;
    font-size: 13px !important;
  }

  /* 表格操作按钮紧凑 */
  .el-table .el-button--small {
    padding: 5px 8px !important;
    font-size: 12px !important;
  }

  /* 表单响应式 - label 顶部显示 */
  .el-form--label-top .el-form-item__label,
  .el-form-item__label {
    float: none !important;
    display: block !important;
    text-align: left !important;
    padding-bottom: 8px !important;
  }

  .el-form-item__content {
    margin-left: 0 !important;
  }

  /* 表单项间距调整 */
  .el-form-item {
    margin-bottom: 16px !important;
  }

  /* 卡片头部响应式 */
  .el-card__header {
    padding: 12px 16px !important;
  }

  .card-header {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 12px !important;
  }

  .card-header .filters {
    width: 100% !important;
    flex-wrap: wrap !important;
  }

  .card-header .filters .el-select {
    width: 100% !important;
    min-width: unset !important;
  }

  /* 分页响应式 */
  .el-pagination {
    flex-wrap: wrap !important;
    justify-content: center !important;
    gap: 8px !important;
  }

  .el-pagination .el-pagination__sizes {
    margin: 0 !important;
  }

  .el-pagination .el-pagination__total {
    width: 100% !important;
    text-align: center !important;
    margin-bottom: 8px !important;
  }

  /* 表格底部操作区响应式 */
  .table-footer {
    flex-direction: column !important;
    gap: 12px !important;
  }

  .table-footer .batch-actions {
    width: 100% !important;
  }

  .table-footer .batch-actions .el-button {
    width: 100% !important;
  }

  /* 对话框响应式 */
  .el-dialog {
    width: 90% !important;
    max-width: 90% !important;
    margin: 5vh auto !important;
  }

  .el-dialog__body {
    padding: 16px !important;
  }

  /* 消息框响应式 */
  .el-message-box {
    width: 90% !important;
    max-width: 90% !important;
  }

  /* 下拉选择器响应式 */
  .el-select-dropdown {
    max-width: 90vw !important;
  }

  /* 日期选择器响应式 */
  .el-date-picker {
    width: 100% !important;
  }

  .el-picker-panel {
    max-width: 95vw !important;
  }

  /* 标签响应式 */
  .el-tag {
    font-size: 12px !important;
    padding: 0 6px !important;
    height: 24px !important;
    line-height: 22px !important;
  }

  /* 按钮触摸优化 - 增大点击区域 */
  .el-button {
    min-height: 36px !important;
  }

  .el-button--small {
    min-height: 28px !important;
  }
}

/* 超小屏幕优化 */
@media (max-width: 480px) {
  .el-card__body {
    padding: 8px !important;
  }

  .el-table .el-table__cell {
    padding: 6px 2px !important;
    font-size: 12px !important;
  }

  .el-form-item__label {
    font-size: 13px !important;
  }

  /* 隐藏表格中不重要的列 */
  .el-table .hide-on-mobile {
    display: none !important;
  }

  /* 分页简化 */
  .el-pagination .el-pagination__sizes,
  .el-pagination .el-pagination__jump {
    display: none !important;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  /* 增大可点击元素的触摸区域 */
  .el-button {
    min-height: 40px !important;
    min-width: 40px !important;
  }

  .el-checkbox__inner,
  .el-radio__inner {
    width: 18px !important;
    height: 18px !important;
  }

  .el-input__wrapper {
    min-height: 40px !important;
  }

  /* 移除 hover 效果，改用 active */
  .el-button:hover {
    transform: none !important;
  }

  .el-button:active {
    transform: scale(0.98) !important;
    opacity: 0.9;
  }

  .function-card:hover {
    transform: none !important;
  }

  .function-card:active {
    transform: scale(0.98) !important;
  }
}

/* 横屏模式优化 */
@media (max-height: 500px) and (orientation: landscape) {
  .el-dialog {
    margin: 2vh auto !important;
    max-height: 96vh !important;
  }

  .el-dialog__body {
    max-height: 70vh !important;
    overflow-y: auto !important;
  }
}
</style>
