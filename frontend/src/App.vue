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

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', Arial, sans-serif;
  background: linear-gradient(135deg, #f0f7fc 0%, #e8f4f8 100%);
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
</style>
