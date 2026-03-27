<template>
  <div id="userLayout" class="login-page">
    <div class="login-aura login-aura-left" />
    <div class="login-aura login-aura-right" />
    <div class="login-grid" />
    <canvas ref="particleCanvas" class="particle-canvas" />

    <div class="login-shell">
      <div class="login-panel">
        <div class="brand-block">
          <div class="logo-wrap">
            <Logo :size="14" />
          </div>
          
          <div class="brand-tags">
            <span>低延迟</span>
            <span>多引擎</span>
            <span>高并发</span>
          </div>
        </div>

        <el-form
          ref="loginForm"
          :model="loginFormData"
          :rules="rules"
          :validate-on-rule-change="false"
          class="login-form"
          @keyup.enter="submitForm"
        >
          <el-form-item prop="username" class="mb-6">
            <el-input
              v-model="loginFormData.username"
              size="large"
              placeholder="请输入用户名"
              suffix-icon="user"
            />
          </el-form-item>
          <el-form-item prop="password" class="mb-6">
            <el-input
              v-model="loginFormData.password"
              show-password
              size="large"
              type="password"
              placeholder="请输入密码"
            />
          </el-form-item>
          <el-form-item
            v-if="loginFormData.openCaptcha"
            prop="captcha"
            class="mb-6"
          >
            <div class="captcha-row">
              <el-input
                v-model="loginFormData.captcha"
                placeholder="请输入验证码"
                size="large"
                class="captcha-input"
              />
              <div class="captcha-box">
                <img
                  v-if="picPath"
                  class="captcha-img"
                  :src="picPath"
                  alt="请输入验证码"
                  @click="loginVerify()"
                />
              </div>
            </div>
          </el-form-item>
          <el-form-item class="mb-4">
            <el-button
              class="login-btn shadow shadow-active h-11 w-full"
              type="primary"
              size="large"
              @click="submitForm"
              >登 录</el-button
            >
          </el-form-item>
          <!-- <el-form-item v-if="isDev" class="mb-6">
            <el-button
              class="shadow shadow-active h-11 w-full"
              type="primary"
              size="large"
              @click="checkInit"
              >前往初始化</el-button
            >
          </el-form-item> -->
        </el-form>
      </div>

      <div class="login-poster hidden md:flex">
        <!-- 主题插画：神经网络 + 流式推理 -->
        <div class="poster-bg" />
        <svg class="poster-svg" viewBox="0 0 480 600" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <!-- 光晕 -->
          <ellipse cx="240" cy="260" rx="180" ry="140" fill="url(#glowCenter)" opacity="0.38"/>
          <!-- 节点连线 -->
          <g stroke="url(#lineGrad)" stroke-width="1.2" opacity="0.55">
            <line x1="90" y1="150" x2="200" y2="220"/>
            <line x1="200" y1="220" x2="310" y2="160"/>
            <line x1="310" y1="160" x2="390" y2="240"/>
            <line x1="200" y1="220" x2="240" y2="310"/>
            <line x1="310" y1="160" x2="240" y2="310"/>
            <line x1="240" y1="310" x2="160" y2="390"/>
            <line x1="240" y1="310" x2="330" y2="400"/>
            <line x1="390" y1="240" x2="330" y2="400"/>
            <line x1="160" y1="390" x2="240" y2="460"/>
            <line x1="330" y1="400" x2="240" y2="460"/>
            <line x1="90" y1="150" x2="140" y2="80"/>
            <line x1="310" y1="160" x2="370" y2="90"/>
            <line x1="130" y1="270" x2="200" y2="220"/>
            <line x1="130" y1="270" x2="160" y2="390"/>
            <line x1="390" y1="240" x2="420" y2="340"/>
            <line x1="420" y1="340" x2="330" y2="400"/>
          </g>
          <!-- 流动数据粒子（用小圆点模拟） -->
          <g fill="#7ecfff" opacity="0.7">
            <circle cx="145" cy="185" r="2.5"><animate attributeName="cx" from="90" to="200" dur="3s" repeatCount="indefinite"/><animate attributeName="cy" from="150" to="220" dur="3s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite"/></circle>
            <circle cx="255" cy="265" r="2"><animate attributeName="cx" from="200" to="240" dur="2.4s" begin="0.6s" repeatCount="indefinite"/><animate attributeName="cy" from="220" to="310" dur="2.4s" begin="0.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="2.4s" begin="0.6s" repeatCount="indefinite"/></circle>
            <circle cx="290" cy="235" r="2"><animate attributeName="cx" from="310" to="240" dur="2.8s" begin="1s" repeatCount="indefinite"/><animate attributeName="cy" from="160" to="310" dur="2.8s" begin="1s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="2.8s" begin="1s" repeatCount="indefinite"/></circle>
            <circle cx="365" cy="320" r="2.5"><animate attributeName="cx" from="390" to="330" dur="2.2s" begin="0.3s" repeatCount="indefinite"/><animate attributeName="cy" from="240" to="400" dur="2.2s" begin="0.3s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="2.2s" begin="0.3s" repeatCount="indefinite"/></circle>
            <circle cx="190" cy="425" r="2"><animate attributeName="cx" from="160" to="240" dur="2.6s" begin="1.4s" repeatCount="indefinite"/><animate attributeName="cy" from="390" to="460" dur="2.6s" begin="1.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="2.6s" begin="1.4s" repeatCount="indefinite"/></circle>
          </g>
          <!-- 节点 -->
          <g>
            <!-- 输入层 -->
            <circle cx="90" cy="150" r="11" fill="#1a4fa0" stroke="#4da9ff" stroke-width="2"/>
            <circle cx="130" cy="270" r="9" fill="#16407e" stroke="#4da9ff" stroke-width="1.5"/>
            <circle cx="140" cy="80" r="7" fill="#16407e" stroke="#3a8fd4" stroke-width="1.5" opacity="0.8"/>
            <!-- 隐藏层1 -->
            <circle cx="200" cy="220" r="14" fill="#163d6e" stroke="#5bbeff" stroke-width="2.5"/>
            <circle cx="310" cy="160" r="13" fill="#163d6e" stroke="#5bbeff" stroke-width="2.5"/>
            <circle cx="370" cy="90" r="7" fill="#163d6e" stroke="#3a8fd4" stroke-width="1.5" opacity="0.8"/>
            <!-- 核心节点（高亮） -->
            <circle cx="240" cy="310" r="18" fill="#0e3580" stroke="url(#coreGrad)" stroke-width="3"/>
            <circle cx="240" cy="310" r="10" fill="url(#coreFill)" opacity="0.9"/>
            <!-- 隐藏层2 -->
            <circle cx="160" cy="390" r="12" fill="#163d6e" stroke="#5bbeff" stroke-width="2"/>
            <circle cx="330" cy="400" r="12" fill="#163d6e" stroke="#5bbeff" stroke-width="2"/>
            <circle cx="390" cy="240" r="11" fill="#163d6e" stroke="#5bbeff" stroke-width="2"/>
            <circle cx="420" cy="340" r="9" fill="#16407e" stroke="#4da9ff" stroke-width="1.5" opacity="0.8"/>
            <!-- 输出节点 -->
            <circle cx="240" cy="460" r="14" fill="#0e2d6e" stroke="url(#outGrad)" stroke-width="2.5"/>
          </g>
          <!-- 标签文字 -->
          <text x="46" y="135" fill="#aad4f5" font-size="9" font-family="monospace" opacity="0.75">Input</text>
          <text x="196" y="210" fill="#aad4f5" font-size="8.5" font-family="monospace" opacity="0.75" text-anchor="middle">Encode</text>
          <text x="310" y="150" fill="#aad4f5" font-size="8.5" font-family="monospace" opacity="0.75" text-anchor="middle">Attn</text>
          <text x="240" y="298" fill="#e2f4ff" font-size="9" font-family="monospace" font-weight="bold" text-anchor="middle">LLM</text>
          <text x="240" y="450" fill="#aad4f5" font-size="9" font-family="monospace" opacity="0.9" text-anchor="middle">Output</text>
          <!-- 渐变定义 -->
          <defs>
            <radialGradient id="glowCenter" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#3ba4ff" stop-opacity="1"/>
              <stop offset="100%" stop-color="#0a2060" stop-opacity="0"/>
            </radialGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#5bbeff"/>
              <stop offset="100%" stop-color="#1d6fd4"/>
            </linearGradient>
            <radialGradient id="coreGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#7dd8ff"/>
              <stop offset="100%" stop-color="#2277e0"/>
            </radialGradient>
            <radialGradient id="coreFill" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#bbeeff"/>
              <stop offset="100%" stop-color="#3399ff"/>
            </radialGradient>
            <linearGradient id="outGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#7de8ff"/>
              <stop offset="100%" stop-color="#2468d4"/>
            </linearGradient>
          </defs>
        </svg>

        <!-- 指标卡片 -->
        <div class="poster-chips">
          <div class="chip"><span class="chip-val">10x</span><span class="chip-label">推理加速</span></div>
          <div class="chip"><span class="chip-val">7+</span><span class="chip-label">模态支持</span></div>
          <div class="chip"><span class="chip-val">ms</span><span class="chip-label">低延迟</span></div>
        </div>

        <div class="poster-content">
          <p class="poster-eyebrow">Inference Speedup · Multimodal</p>
          <p class="poster-title">Multi-modal LLM Turbo</p>
          <p class="poster-desc">构建更快、更稳、更智能的推理工作流</p>
        </div>
      </div>
    </div>

    <!-- <BottomInfo class="left-0 right-0 absolute bottom-3 mx-auto w-full z-20">
      <div class="links items-center justify-center gap-2 hidden md:flex">
        <a href="https://www.gin-vue-admin.com/" target="_blank">
          <img src="@/assets/docs.png" class="w-8 h-8" alt="文档" />
        </a>
        <a href="https://support.qq.com/product/371961" target="_blank">
          <img src="@/assets/kefu.png" class="w-8 h-8" alt="客服" />
        </a>
        <a
          href="https://github.com/flipped-aurora/gin-vue-admin"
          target="_blank"
        >
          <img src="@/assets/github.png" class="w-8 h-8" alt="github" />
        </a>
        <a href="https://space.bilibili.com/322210472" target="_blank">
          <img src="@/assets/video.png" class="w-8 h-8" alt="视频站" />
        </a>
      </div>
    </BottomInfo> -->
  </div>
</template>

<script setup>
  import { captcha } from '@/api/user'
  import { checkDB } from '@/api/initdb'
  import BottomInfo from '@/components/bottomInfo/bottomInfo.vue'
  import { reactive, ref } from 'vue'
  import { ElMessage } from 'element-plus'
  import { useRouter } from 'vue-router'
  import { useUserStore } from '@/pinia/modules/user'
  import Logo from '@/components/logo/index.vue'
  import { isDev } from '@/utils/env.js'

  import { onMounted, onUnmounted } from 'vue'

  defineOptions({
    name: 'Login'
  })

  // ---------- 粒子特效 ----------
  const particleCanvas = ref(null)
  let animFrameId = null

  onMounted(() => {
    const canvas = particleCanvas.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    window.addEventListener('resize', resize)
    resize()

    const NUM = 80
    const particles = Array.from({ length: NUM }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.6 + 0.4,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      alpha: Math.random() * 0.5 + 0.25,
    }))

    const LINK_DIST = 120

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // 更新位置
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
      }
      // 连线
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < LINK_DIST) {
            const alpha = (1 - dist / LINK_DIST) * 0.28
            ctx.beginPath()
            ctx.strokeStyle = `rgba(100,200,255,${alpha})`
            ctx.lineWidth = 0.6
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }
      // 绘制粒子
      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(140,215,255,${p.alpha})`
        ctx.fill()
      }
      animFrameId = requestAnimationFrame(tick)
    }
    tick()

    onUnmounted(() => {
      cancelAnimationFrame(animFrameId)
      window.removeEventListener('resize', resize)
    })
  })
  // ---------- end 粒子特效 ----------

  const router = useRouter()
  const captchaRequiredLength = ref(6)
  // 验证函数
  const checkUsername = (rule, value, callback) => {
    if (value.length < 5) {
      return callback(new Error('请输入正确的用户名'))
    } else {
      callback()
    }
  }
  const checkPassword = (rule, value, callback) => {
    if (value.length < 6) {
      return callback(new Error('请输入正确的密码'))
    } else {
      callback()
    }
  }
  const checkCaptcha = (rule, value, callback) => {
    if (!loginFormData.openCaptcha) {
      return callback()
    }
    const sanitizedValue = (value || '').replace(/\s+/g, '')
    if (!sanitizedValue) {
      return callback(new Error('请输入验证码'))
    }
    if (!/^\d+$/.test(sanitizedValue)) {
      return callback(new Error('验证码须为数字'))
    }
    if (sanitizedValue.length < captchaRequiredLength.value) {
      return callback(
        new Error(`请输入至少${captchaRequiredLength.value}位数字验证码`)
      )
    }
    if (sanitizedValue !== value) {
      loginFormData.captcha = sanitizedValue
    }
    callback()
  }

  // 获取验证码
  const loginVerify = async () => {
    const ele = await captcha()
    captchaRequiredLength.value = Number(ele.data?.captchaLength) || 0
    picPath.value = ele.data?.picPath
    loginFormData.captchaId = ele.data?.captchaId
    loginFormData.openCaptcha = ele.data?.openCaptcha
  }
  loginVerify()

  // 登录相关操作
  const loginForm = ref(null)
  const picPath = ref('')
  const loginFormData = reactive({
    username: 'admin',
    password: '',
    captcha: '',
    captchaId: '',
    openCaptcha: false
  })
  const rules = reactive({
    username: [{ validator: checkUsername, trigger: 'blur' }],
    password: [{ validator: checkPassword, trigger: 'blur' }],
    captcha: [{ validator: checkCaptcha, trigger: 'blur' }]
  })

  const userStore = useUserStore()
  const login = async () => {
    return await userStore.LoginIn(loginFormData)
  }
  const submitForm = () => {
    loginForm.value.validate(async (v) => {
      if (!v) {
        // 未通过前端静态验证
        ElMessage({
          type: 'error',
          message: '请正确填写登录信息',
          showClose: true
        })
        return false
      }

      // 通过验证，请求登陆
      const flag = await login()

      // 登陆失败，刷新验证码
      if (!flag) {
        await loginVerify()
        return false
      }

      // 登陆成功
      return true
    })
  }

  // 跳转初始化
  const checkInit = async () => {
    const res = await checkDB()
    if (res.code === 0) {
      if (res.data?.needInit) {
        userStore.NeedInit()
        await router.push({ name: 'Init' })
      } else {
        ElMessage({
          type: 'info',
          message: '已配置数据库信息，无法初始化'
        })
      }
    }
  }
</script>

<style scoped lang="scss">
  .login-page {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 100vh;
    overflow: hidden;
    background:
      radial-gradient(circle at 16% 18%, rgb(47 182 255 / 24%), transparent 40%),
      radial-gradient(circle at 85% 85%, rgb(35 92 247 / 24%), transparent 44%),
      linear-gradient(128deg, #091229 0%, #0d1f45 46%, #123372 100%);
  }

  .particle-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
  }

  .login-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgb(255 255 255 / 6%) 1px, transparent 1px),
      linear-gradient(90deg, rgb(255 255 255 / 6%) 1px, transparent 1px);
    background-size: 26px 26px;
    mask-image: radial-gradient(circle at center, #000 36%, transparent 90%);
    pointer-events: none;
  }

  .login-aura {
    position: absolute;
    border-radius: 999px;
    filter: blur(54px);
    pointer-events: none;
  }

  .login-aura-left {
    top: -120px;
    left: -100px;
    width: 340px;
    height: 340px;
    background: rgb(92 219 255 / 28%);
  }

  .login-aura-right {
    right: -140px;
    bottom: -130px;
    width: 420px;
    height: 420px;
    background: rgb(47 113 255 / 34%);
  }

  .login-shell {
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-columns: 1fr;
    width: min(1080px, calc(100% - 40px));
    min-height: 640px;
    border: 1px solid rgb(255 255 255 / 22%);
    border-radius: 24px;
    overflow: hidden;
    background: rgb(11 22 49 / 84%);
    box-shadow: 0 28px 70px rgb(5 10 26 / 46%);
    backdrop-filter: blur(10px);
  }

  .login-panel {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 28px 38px 24px;
  }

  .brand-block {
    margin-bottom: 8px;
  }

  .logo-wrap {
    margin-bottom: -56px;
    line-height: 0;
  }

  :deep(.logo-wrap img) {
    transform: translateY(24px);
  }

  .brand-subtitle {
    margin: 0;
    font-size: 14px;
    color: rgb(204 226 255 / 82%);
    letter-spacing: 0.2px;
  }

  .brand-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
  }

  .brand-tags span {
    padding: 5px 10px;
    border: 1px solid rgb(126 194 255 / 46%);
    border-radius: 999px;
    font-size: 12px;
    color: #d1ebff;
    background: rgb(34 98 177 / 25%);
  }

  .captcha-row {
    display: flex;
    gap: 14px;
    width: 100%;
  }

  .captcha-input {
    flex: 1;
  }

  .captcha-box {
    width: 36%;
    min-width: 116px;
    height: 44px;
    border: 1px solid rgb(140 201 255 / 34%);
    border-radius: 12px;
    overflow: hidden;
    background: rgb(170 218 255 / 14%);
  }

  .captcha-img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    cursor: pointer;
  }

  .login-btn {
    border: 0;
    background: linear-gradient(90deg, #1b84ff 0%, #32c5ff 100%);
    box-shadow: 0 12px 24px rgb(27 132 255 / 32%);
  }

  .login-btn:hover {
    filter: brightness(1.08);
    transform: translateY(-1px);
  }

  .login-poster {
    position: relative;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-end;
    overflow: hidden;
    background: linear-gradient(160deg, #071535 0%, #0c2260 55%, #0a3380 100%);
  }

  .poster-bg {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgb(255 255 255 / 5%) 1px, transparent 1px),
      linear-gradient(90deg, rgb(255 255 255 / 5%) 1px, transparent 1px);
    background-size: 30px 30px;
    pointer-events: none;
  }

  .poster-svg {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -56%);
    width: 90%;
    max-width: 420px;
    height: auto;
    opacity: 0.92;
    pointer-events: none;
  }

  .poster-chips {
    position: absolute;
    top: 28px;
    right: 28px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .chip {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 14px;
    background: rgb(20 68 160 / 44%);
    border: 1px solid rgb(92 185 255 / 36%);
    border-radius: 12px;
    backdrop-filter: blur(6px);
    min-width: 60px;
  }

  .chip-val {
    font-size: 18px;
    font-weight: 700;
    color: #7ee3ff;
    line-height: 1.1;
  }

  .chip-label {
    font-size: 10px;
    color: rgb(200 230 255 / 82%);
    letter-spacing: 0.6px;
    margin-top: 2px;
  }

  .poster-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .poster-overlay {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgb(6 17 43 / 18%) 0%, rgb(7 16 33 / 58%) 100%),
      linear-gradient(90deg, rgb(6 14 33 / 64%) 0%, transparent 56%);
  }

  .poster-content {
    position: absolute;
    left: 34px;
    right: 34px;
    bottom: 38px;
    color: #e9f5ff;
  }

  .poster-eyebrow {
    margin: 0;
    font-size: 12px;
    letter-spacing: 2.2px;
    color: rgb(186 220 255 / 86%);
    text-transform: uppercase;
  }

  .poster-title {
    margin: 10px 0 0;
    font-size: 32px;
    font-weight: 700;
    line-height: 1.18;
  }

  .poster-desc {
    margin: 12px 0 0;
    font-size: 14px;
    color: rgb(225 241 255 / 85%);
  }

  :deep(.login-form .el-input__wrapper) {
    background: rgb(7 24 53 / 64%);
    border-radius: 12px;
    box-shadow: inset 0 0 0 1px rgb(115 179 243 / 28%);
    transition: box-shadow 0.24s ease;
  }

  :deep(.login-form .el-input__wrapper.is-focus) {
    box-shadow:
      inset 0 0 0 1px rgb(108 191 255 / 72%),
      0 0 0 3px rgb(66 142 247 / 20%);
  }

  :deep(.login-form .el-input__inner) {
    color: #edf6ff;
  }

  :deep(.login-form .el-input__inner::placeholder) {
    color: rgb(177 210 248 / 64%);
  }

  :deep(.login-form .el-input__suffix-inner) {
    color: rgb(181 221 255 / 80%);
  }

  :deep(.login-form .el-form-item__error) {
    color: #ffb6b6;
  }

  @media (min-width: 960px) {
    .login-shell {
      grid-template-columns: minmax(390px, 1fr) minmax(380px, 1fr);
      min-height: 650px;
    }

    .login-panel {
      padding: 34px 40px 28px;
    }
  }

  @media (max-width: 959px) {
    .login-page {
      align-items: flex-start;
      min-height: 100vh;
      padding: 18px 0;
    }

    .login-shell {
      min-height: auto;
      border-radius: 20px;
    }

    .login-panel {
      padding: 34px 24px 26px;
    }
  }

  @media (max-width: 520px) {
    .login-shell {
      width: calc(100% - 24px);
      border-radius: 16px;
    }

    .login-panel {
      padding: 28px 16px 18px;
    }

    .brand-tags {
      gap: 6px;
    }

    .captcha-row {
      gap: 10px;
    }

    .captcha-box {
      min-width: 100px;
    }
  }
</style>
