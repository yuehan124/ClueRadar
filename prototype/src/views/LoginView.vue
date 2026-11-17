<template>
  <div class="login-page">
    <!-- 左侧品牌区 -->
    <div class="login-hero">
      <div class="brand">
        <div class="brand-logo">雷</div>
        <div>
          <div class="brand-name">线索雷达</div>
          <div class="brand-sub">LeadRadar · AI 获客</div>
        </div>
      </div>

      <div class="hero-body">
        <h2 class="hero-title">
          从噪音里，<br />
          捞出真正想买单的人
        </h2>
        <p class="hero-desc">
          四层信号体系过滤无效互动，AI 判定决策阶段与身份，
          让销售每天只看那几条值得打的线索。
        </p>

        <ul class="hero-list">
          <li v-for="f in features" :key="f.title">
            <el-icon class="hero-icon"><component :is="f.icon" /></el-icon>
            <div>
              <div class="hero-item-title">{{ f.title }}</div>
              <div class="hero-item-desc">{{ f.desc }}</div>
            </div>
          </li>
        </ul>
      </div>

      <div class="hero-footer">数据源：MediaCrawler（脱敏版）· 仅供学习研究</div>
    </div>

    <!-- 右侧登录区 -->
    <div class="login-panel">
      <div class="login-card">
        <div class="mobile-brand">
          <div class="brand-logo">雷</div>
          <span class="brand-name" style="color: #1f2333">线索雷达</span>
        </div>

        <h1 class="login-title">登录</h1>
        <p class="login-sub">请使用分配给你的账号登录工作台</p>

        <el-alert
          v-if="errorMsg"
          :title="errorMsg"
          type="error"
          :closable="false"
          show-icon
          style="margin-bottom: 16px"
        />

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          size="large"
          @submit.prevent="submit"
        >
          <el-form-item label="账号" prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入账号"
              :prefix-icon="User"
              clearable
              autocomplete="username"
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              :prefix-icon="Lock"
              show-password
              autocomplete="current-password"
              @keyup.enter="submit"
            />
          </el-form-item>

          <div class="login-row">
            <el-checkbox v-model="form.remember">记住登录状态</el-checkbox>
            <el-link type="primary" :underline="false" @click="fillDemo">忘记密码？</el-link>
          </div>

          <el-button
            type="primary"
            size="large"
            style="width: 100%; margin-top: 6px"
            :loading="auth.loading"
            @click="submit"
          >
            {{ auth.loading ? '登录中…' : '登 录' }}
          </el-button>
        </el-form>

        <div class="demo-hint">
          <div style="flex: 1">
            <div class="demo-hint-title">
              <el-icon style="vertical-align: -2px"><InfoFilled /></el-icon>
              原型演示账号
            </div>
            <div class="demo-hint-body mono">
              账号 demo &nbsp;/&nbsp; 密码 demo123
            </div>
          </div>
          <el-button size="small" @click="fillDemo">一键填入</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Aim, InfoFilled, Lock, MagicStick, User } from '@element-plus/icons-vue'
import { DEMO_ACCOUNT, useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const features = [
  { icon: MagicStick, title: 'AI 意向判定', desc: '自动识别决策阶段、身份与真实需求' },
  { icon: Aim, title: '四层信号过滤', desc: '噪声词 / 意向词 / 身份词 / 阶段词' },
]

const formRef = ref<FormInstance>()
const errorMsg = ref('')

const form = reactive({
  username: '',
  password: '',
  remember: true,
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
}

function fillDemo() {
  form.username = DEMO_ACCOUNT.username
  form.password = DEMO_ACCOUNT.password
  errorMsg.value = ''
}

async function submit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  errorMsg.value = ''
  try {
    await auth.login(form.username, form.password, form.remember)
    ElMessage.success(`欢迎回来，${auth.user?.display}`)
    const redirect = route.query.redirect as string | undefined
    router.replace(redirect || '/')
  } catch (e) {
    errorMsg.value = (e as Error).message
    form.password = ''
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  min-height: 100vh;
  background: #f4f6fb;
}

/* ---------- 左侧 ---------- */
.login-hero {
  flex: 1.1;
  background: linear-gradient(150deg, #1c2030 0%, #272d4d 48%, #4f6ef7 145%);
  color: #fff;
  padding: 40px 48px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.login-hero::after {
  content: '';
  position: absolute;
  width: 520px;
  height: 520px;
  right: -180px;
  top: -140px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.35), transparent 70%);
}

.login-hero .brand {
  display: flex;
  align-items: center;
  gap: 11px;
  position: relative;
  z-index: 1;
}

.hero-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  z-index: 1;
  max-width: 460px;
}

.hero-title {
  font-size: 34px;
  line-height: 1.35;
  margin: 0 0 16px;
  font-weight: 700;
  letter-spacing: 1px;
}

.hero-desc {
  font-size: 14px;
  line-height: 1.9;
  color: #b9c0d8;
  margin: 0 0 32px;
}

.hero-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hero-list li {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.hero-icon {
  font-size: 17px;
  color: #8b9dff;
  margin-top: 2px;
  flex: none;
}

.hero-item-title {
  font-size: 13.5px;
  font-weight: 600;
}

.hero-item-desc {
  font-size: 12.5px;
  color: #9aa3bd;
  margin-top: 3px;
  line-height: 1.6;
}

.hero-footer {
  font-size: 11.5px;
  color: #6f7791;
  position: relative;
  z-index: 1;
}

/* ---------- 右侧 ---------- */
.login-panel {
  flex: 0 0 520px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
}

.login-card {
  width: 100%;
  max-width: 380px;
}

.mobile-brand {
  display: none;
  align-items: center;
  gap: 10px;
  margin-bottom: 26px;
}

.login-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 6px;
}

.login-sub {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 24px;
}

.login-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: -6px 0 6px;
}

.demo-hint {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 22px;
  padding: 12px 14px;
  border-radius: 10px;
  background: #eef1ff;
  border: 1px dashed var(--el-color-primary-light-5);
}

.demo-hint-title {
  font-size: 12.5px;
  font-weight: 600;
  color: #4f6ef7;
}

.demo-hint-body {
  font-size: 12.5px;
  color: #414a63;
  margin-top: 4px;
}

@media (max-width: 900px) {
  .login-hero {
    display: none;
  }
  .login-panel {
    flex: 1;
  }
  .mobile-brand {
    display: flex;
  }
}
</style>
