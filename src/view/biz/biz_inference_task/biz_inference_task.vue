<template>
  <div class="rt-page">
    <div class="rt-container">
      <section v-if="isRealtimeOnly" class="rt-section rt-hero">
        <div>
          <h2 class="rt-title">实时性能可视化</h2>
          <p class="rt-subtitle">对比不同量化策略在相同测试样本下的吞吐、延迟和显存表现。</p>
        </div>
        <div class="hero-tags">
          <span class="tag">模型 {{ selectedModelLabel }}</span>
          <span class="tag muted">已选算法 {{ selectedAlgorithms.length }}</span>
        </div>
      </section>

      <section v-if="isRealtimeOnly" class="rt-section">
        <div class="section-head">
          <h3>参数选择</h3>
        </div>
        <div class="control-grid">
          <div class="control-field">
            <label>模型</label>
            <el-select
              v-model="selectedModel"
              placeholder="请选择模型"
              class="control-select"
              @change="onParamChange"
            >
              <el-option
                v-for="item in modelOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>

          <div class="control-field">
            <label>数据集</label>
            <el-select
              v-model="selectedDatasetId"
              filterable
              placeholder="请选择数据集"
              class="control-select"
              @change="onDatasetChange"
            >
              <el-option
                v-for="item in datasetOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>

          <div class="control-field">
            <label>样本</label>
            <div class="sample-selector">
              <el-select
                v-model="selectedSampleIndex"
                :disabled="!datasetOptions.length"
                filterable
                placeholder="选择样本"
                class="control-select"
                @change="onSampleChange"
              >
                <el-option
                  v-for="s in sampleOptions"
                  :key="s.value"
                  :label="s.label"
                  :value="s.value"
                />
              </el-select>
            </div>
          </div>
        </div>

        <div class="algo-row">
          <label>加速算法</label>
          <el-checkbox-group v-model="selectedAlgorithms" @change="onAlgorithmChange">
            <el-checkbox
              v-for="item in accelerationOptions"
              :key="item.value"
              :value="item.value"
              :label="item.label"
            />
          </el-checkbox-group>
        </div>
      </section>

      <!-- 推理结果（合并：运行状态 + 结果展示） -->
      <section v-if="isRealtimeOnly" class="rt-section result-section" v-loading="loading">
        <div class="section-head">
          <h3>推理结果</h3>
          <div class="status-actions">
            <span class="progress-text">
              样本 {{ hasSamples ? currentSample.index : '--' }} / {{ sampleOptions.length }}
            </span>
            <el-select
              v-model="selectedSampleIndex"
              :disabled="!hasSamples"
              filterable
              placeholder="选择样本"
              class="header-sample-select"
              @change="onSampleChange"
            >
              <el-option
                v-for="s in sampleOptions"
                :key="'hdr-' + s.value"
                :label="s.label"
                :value="s.value"
              />
            </el-select>
            <el-button
              class="run-btn"
              :class="{ streaming: isStreaming }"
              :disabled="isStreaming || !selectedAlgorithms.length || !hasSamples"
              @click="startStreaming"
            >
              <span v-if="isStreaming" class="run-dot" />
              {{ isStreaming ? '推理中…' : '开始推理' }}
            </el-button>
          </div>
        </div>

        <el-empty
          v-if="!hasSamples"
          description="当前数据集暂无样本，请先在数据集管理中维护样本"
        />

        <template v-else>
          <div class="status-grid">
            <div class="meta-chip">
              <span class="meta-label">序号</span>
              <span class="meta-val">{{ currentSample.index }}</span>
            </div>
            <div class="meta-chip prompt-chip">
              <span class="meta-label">提示词</span>
              <span class="meta-val">{{ currentSample.prompt }}</span>
            </div>
            <div class="meta-chip image-chip">
              <span class="meta-label">样本图片</span>
              <img v-if="currentSample.image" class="case-image" :src="resolveImageUrl(currentSample.image)" alt="测试图片" />
              <span v-else class="meta-val">暂无图片</span>
            </div>
          </div>

          <el-empty
            v-if="!algorithmCards.length"
            description="请至少选择一个加速算法"
          />

          <div v-else class="cards-grid">
            <article
              v-for="card in algorithmCards"
              :key="card.key"
              class="metric-card"
            >
              <div class="card-head">{{ card.title }}</div>

              <div class="metric-main">
                <div class="metric-item metric-strong">
                  <span class="metric-label">吞吐量</span>
                  <span class="metric-value">{{ getDisplayThroughput(currentSample.index, card.key, card.throughput) }} <em>token/s</em></span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">token 平均延迟</span>
                  <span class="metric-value">{{ getDisplayAvgLatency(currentSample.index, card.key, card.avgLatency) }} <em>ms/token</em></span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">GPU 显存</span>
                  <span class="metric-value">{{ getDisplayGpuMemory(currentSample.index, card.key, card.gpuMemory) }} <em>G</em></span>
                </div>
              </div>

              <div class="token-stream">
                <template v-if="streamingData.tokens[currentSample.index] && streamingData.tokens[currentSample.index][card.key] && streamingData.tokens[currentSample.index][card.key].length">
                  <div
                    v-for="(tok, idx) in streamingData.tokens[currentSample.index][card.key]"
                    :key="`${card.key}-t-${idx}`"
                    class="token-item"
                  >
                    <span class="token-text">{{ tok.char }}</span>
                    <span class="token-latency">{{ tok.latencyMs }}ms</span>
                  </div>
                  <div v-if="streamingData.active[currentSample.index] && streamingData.active[currentSample.index][card.key]" class="token-item cursor-item">
                    <span class="stream-cursor">▌</span>
                  </div>
                </template>
                <div v-else class="token-placeholder">等待推理…</div>
              </div>

              <div class="avg-block">
                <div><b>Average Throughput:</b> {{ getDisplaySampleAvgThroughput() }} token/s</div>
                <div><b>Average Latency:</b> {{ getDisplaySampleAvgLatency() }} ms/token</div>
                <div><b>Average GPU memory:</b> {{ getDisplaySampleAvgGpuMemory() }} G</div>
              </div>
            </article>
          </div>
        </template>
      </section>

      <section v-if="isRankOnly" class="rt-section" v-loading="rankLoading">
        <div class="section-head">
          <h3>排名管理</h3>
          <el-button class="ghost-btn" @click="refreshRankData">刷新榜单</el-button>
        </div>

        <div class="table-toolbar">
          <div class="control-field compact">
            <label>测试用例</label>
            <el-select
              v-model="rankCase"
              class="control-select compact-select"
              placeholder="请选择测试用例"
              @change="refreshRankData"
            >
              <el-option
                v-for="item in caseOptions"
                :key="`rank-${item.value}`"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>

          <div class="control-field compact">
            <label>榜单</label>
            <el-select
              v-model="rankMetric"
              class="control-select compact-select"
              placeholder="请选择榜单类型"
              @change="refreshRankData"
            >
              <el-option
                v-for="item in rankMetricOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
        </div>

        <div class="table-wrap">
          <el-table :data="rankRows" stripe>
            <el-table-column label="排名" width="78" align="center">
              <template #default="scope">
                <span class="rank-badge" :class="`top-${scope.row.rank}`">{{ scope.row.rank }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="modelName" label="模型" min-width="200" show-overflow-tooltip />
            <el-table-column prop="algorithmName" label="加速算法" min-width="120" />
            <el-table-column prop="throughput" label="吞吐量" min-width="130" />
            <el-table-column prop="latency" label="单token延迟" min-width="130" />
            <el-table-column prop="gpuMemory" label="显存占用" min-width="120" />
            <el-table-column prop="executionTime" label="执行时间" min-width="168" />
            <el-table-column prop="operatorName" label="执行人" min-width="110" />
          </el-table>
        </div>

        <div class="table-footer">
          <el-pagination
            v-model:current-page="rankPage"
            v-model:page-size="rankPageSize"
            layout="total, prev, pager, next"
            :total="rankTotal"
            @current-change="fetchRankData"
          />
        </div>
      </section>

      <section v-if="isHistoryOnly" class="rt-section" v-loading="historyLoading">
        <div class="section-head">
          <h3>历史记录</h3>
          <el-button class="ghost-btn" @click="refreshHistoryData">刷新记录</el-button>
        </div>

        <div class="table-toolbar">
          <div class="control-field compact">
            <label>测试用例</label>
            <el-select
              v-model="historyCase"
              class="control-select compact-select"
              placeholder="请选择测试用例"
              @change="refreshHistoryData"
            >
              <el-option
                v-for="item in caseOptions"
                :key="`history-${item.value}`"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
        </div>

        <div class="table-wrap">
          <el-table :data="historyRows" stripe>
            <el-table-column prop="taskHash" label="任务编号" min-width="140" show-overflow-tooltip />
            <el-table-column prop="modelName" label="模型" min-width="220" show-overflow-tooltip />
            <el-table-column prop="testCase" label="测试用例" min-width="120" />
            <el-table-column label="加速算法" min-width="180">
              <template #default="scope">
                <div class="algo-tags">
                  <el-tag
                    v-for="algo in scope.row.algorithms"
                    :key="`${scope.row.taskHash}-${algo}`"
                    size="small"
                    effect="plain"
                    class="algo-tag"
                  >
                    {{ algo }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="executionTime" label="测试时间" min-width="168" />
            <el-table-column prop="operatorName" label="执行人" min-width="100" />
            <el-table-column label="操作" width="144" fixed="right">
              <template #default="scope">
                <el-button type="primary" link @click="viewHistoryRow(scope.row)">查看</el-button>
                <el-button type="danger" link @click="deleteHistoryRow(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="table-footer">
          <el-pagination
            v-model:current-page="historyPage"
            v-model:page-size="historyPageSize"
            layout="total, prev, pager, next"
            :total="historyTotal"
            @current-change="fetchHistoryData"
          />
        </div>
      </section>
    </div>

    <el-dialog
      v-model="historyDetailVisible"
      title="任务详情"
      width="680px"
      class="history-detail-dialog"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="任务编号">{{ historyDetail.taskHash }}</el-descriptions-item>
        <el-descriptions-item label="模型">{{ historyDetail.modelName }}</el-descriptions-item>
        <el-descriptions-item label="测试用例">{{ historyDetail.testCase }}</el-descriptions-item>
        <el-descriptions-item label="执行人">{{ historyDetail.operatorName }}</el-descriptions-item>
        <el-descriptions-item label="测试时间" :span="2">{{ historyDetail.executionTime }}</el-descriptions-item>
        <el-descriptions-item label="加速算法" :span="2">{{ historyDetail.algorithms.join(' / ') }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted, onActivated, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import {
  deleteBizInferenceTask,
  getBizInferenceTaskList,
  getBizInferenceCompleteRecord,
  runBizInferenceTask
} from '@/api/biz/biz_inference_task'
import { getBizDatasetList } from '@/api/biz/biz_dataset'
import { getBizSampleList } from '@/api/biz/biz_sample'
import { addInferenceRecord, getHistoryRecords, getRankRecords, deleteInferenceRecord, formatTimestamp } from '@/utils/inferenceRecords'

const route = useRoute()
const router = useRouter()
const currentMenuTitle = computed(() => String(route.meta?.title || ''))

const isHistoryOnly = computed(() => currentMenuTitle.value.includes('推理任务记录'))
const isRankOnly = computed(() => currentMenuTitle.value.includes('推理排行榜'))
const isRealtimeOnly = computed(() => !isHistoryOnly.value && !isRankOnly.value)

/* ───────── 常量 ───────── */

const defaultModelOptions = [
  { label: 'Qwen2.5-VL-7B-Instruct', value: 'qwen2.5-vl-7b-instruct' },
  { label: 'Qwen2.5-VL-3B-Instruct', value: 'qwen2.5-vl-3b-instruct' }
]

const defaultAccelerationOptions = [
  { label: 'unquantized', value: 'unquantized' },
  { label: 'bnb-4bit', value: 'bnb-4bit' }
]

const defaultCaseOptions = [
  { label: '动物识别', value: 'animal-recognition' },
  { label: '交通场景理解', value: 'traffic-understanding' },
  { label: '图表解读', value: 'chart-reading' }
]

const rankMetricOptions = [
  { label: '吞吐量', value: 'throughput' },
  { label: '单token延迟', value: 'latency' },
  { label: '显存占用', value: 'gpuMemory' },
  { label: '执行时间', value: 'executionTime' }
]

const baselineAlgorithmProfiles = {
  unquantized: {
    title: 'Unquantized',
    throughput: 132,
    latency: 0.0031,
    gpuMemory: 15.36,
    avgThroughput: 141,
    avgLatency: 0.0028,
    avgGpuMemory: 15.35
  },
  'bnb-4bit': {
    title: 'Bnb-4bit',
    throughput: 280,
    latency: 0.0004,
    gpuMemory: 4.32,
    avgThroughput: 301,
    avgLatency: 0.0005,
    avgGpuMemory: 4.32
  }
}

const emptySample = {
  index: '--',
  sampleId: '',
  label: '暂无样本',
  prompt: '--',
  image: '',
  algorithms: {}
}

const pickFirst = (item, keys, fallback = '') => {
  for (const key of keys) {
    if (item?.[key] !== undefined && item?.[key] !== null && item?.[key] !== '') {
      return item[key]
    }
  }
  return fallback
}

const extractList = (data) => {
  const list = data?.list || data?.records || data?.items || data?.rows || []
  return Array.isArray(list) ? list : []
}

const buildResultTextFromPrompt = (prompt) => {
  const p = String(prompt || '').trim()
  if (!p) return '样本未提供提示词，无法生成有效推理结果。'
  return `基于输入提示词“${p}”，模型完成了图像与文本的联合理解，并输出了结构化结论。`
}

const buildAlgorithmProfiles = (prompt) => {
  const fullText = buildResultTextFromPrompt(prompt)
  return {
    unquantized: {
      ...baselineAlgorithmProfiles.unquantized,
      fullText
    },
    'bnb-4bit': {
      ...baselineAlgorithmProfiles['bnb-4bit'],
      fullText
    }
  }
}

const resolveImageUrl = (src) => {
  const value = String(src || '').trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  const base = String(import.meta.env.VITE_BASE_API || '').replace(/\/$/, '')
  const normalized = value.replace(/^\/+/, '')
  return `${base}/${normalized}`
}

const normalizeDatasetOption = (item) => {
  const id = pickFirst(item, ['ID', 'id', 'datasetId'], '')
  const name = pickFirst(item, ['datasetName', 'name', 'dataset_name'], '')
  return {
    label: name || `数据集 ${id}`,
    value: String(id)
  }
}

const normalizeSampleOption = (item, index) => {
  const prompt = String(pickFirst(item, ['prompt', 'question', 'text'], '')).trim()
  const preview = prompt
    ? (prompt.length > 24 ? `${prompt.slice(0, 24)}...` : prompt)
    : `样本${index + 1}`
  const sampleId = String(pickFirst(item, ['ID', 'id', 'sampleId'], ''))
  return {
    index: index + 1,
    sampleId,
    label: preview,
    prompt: prompt || '--',
    image: String(pickFirst(item, ['img', 'image', 'imageUrl', 'pic'], '')),
    algorithms: buildAlgorithmProfiles(prompt)
  }
}

const mockRankRows = [
  { rank: 1, modelName: 'Qwen2.5-VL-7B-Instruct', algorithmName: 'bnb-4bit', throughput: '340 token/s', latency: '0.0005 s', gpuMemory: '5.34 G', executionTime: '2025-12-28 16:05:03', operatorName: 'YRC' },
  { rank: 2, modelName: 'Qwen2.5-VL-3B-Instruct', algorithmName: 'bnb-4bit', throughput: '335 token/s', latency: '0.0007 s', gpuMemory: '5.21 G', executionTime: '2026-01-22 15:04:03', operatorName: 'WXF' }
]

const mockHistoryRows = [
  { id: 'm-1', taskHash: '89h8912d', modelName: 'Qwen2.5-VL-7B-Instruct', modelValue: 'qwen2.5-vl-7b-instruct', testCase: '动物识别', testCaseValue: 1, algorithms: ['unquantized', 'bnb-4bit'], algorithmValue: 'unquantized', executionTime: '2025-12-28 16:05:03', operatorName: 'YRC' },
  { id: 'm-2', taskHash: 'e9a79f34x', modelName: 'Qwen2.5-VL-3B-Instruct', modelValue: 'qwen2.5-vl-3b-instruct', testCase: '动物识别', testCaseValue: 1, algorithms: ['unquantized', 'bnb-4bit'], algorithmValue: 'bnb-4bit', executionTime: '2026-01-22 15:04:03', operatorName: 'WXF' }
]

/* ───────── 实时推理 state ───────── */

const modelOptions = ref(defaultModelOptions)
const accelerationOptions = ref(defaultAccelerationOptions)
const caseOptions = ref(defaultCaseOptions)
const datasetOptions = ref([])
const datasetSamples = ref([])
const selectedDatasetId = ref('')

const selectedModel = ref(defaultModelOptions[0].value)
const selectedAlgorithms = ref(defaultAccelerationOptions.map((i) => i.value))
const loading = ref(false)

/* ───────── 当前登录用户名（用于记录） ───────── */
const getCurrentUser = () => {
  try {
    const info = JSON.parse(localStorage.getItem('userInfo') || '{}')
    return info?.userName || info?.nickName || 'User'
  } catch {
    return 'User'
  }
}

const selectedSampleIndex = ref(null)
const sampleIndexInput = ref('')

const sampleOptions = computed(() =>
  datasetSamples.value.map((s) => ({
    label: String(s.index),
    value: s.index
  }))
)

const currentSample = computed(() =>
  datasetSamples.value.find((s) => s.index === selectedSampleIndex.value) || datasetSamples.value[0] || emptySample
)

const hasSamples = computed(() => sampleOptions.value.length > 0)

const selectedModelLabel = computed(() => {
  const hit = modelOptions.value.find((i) => i.value === selectedModel.value)
  return hit?.label || '--'
})

const realtimeStats = reactive({})
const sampleAverageSnapshot = reactive({})
const runningAlgorithmsBySample = reactive({})

const algorithmCards = computed(() => {
  const allAlgorithms = currentSample.value.algorithms || {}
  const selected = new Set(selectedAlgorithms.value)
  return accelerationOptions.value
    .filter((opt) => selected.has(opt.value))
    .map((opt) => ({ key: opt.value, ...allAlgorithms[opt.value] }))
    .filter((item) => item.title)
})

const getSampleById = (sampleId) => datasetSamples.value.find((s) => s.index === sampleId) || currentSample.value

const getSelectedAlgorithmKeys = (sampleId) => {
  const sample = getSampleById(sampleId)
  const allAlgorithms = sample?.algorithms || {}
  const selected = new Set(selectedAlgorithms.value)
  return accelerationOptions.value
    .filter((opt) => selected.has(opt.value) && allAlgorithms[opt.value])
    .map((opt) => opt.value)
}

const buildSampleAverageMetrics = (sampleId, keys, preferRealtime = false) => {
  const sample = getSampleById(sampleId)
  const allAlgorithms = sample?.algorithms || {}
  const normalizedKeys = Array.isArray(keys) && keys.length ? keys : getSelectedAlgorithmKeys(sampleId)

  let throughputSum = 0
  let throughputCount = 0
  let latencySum = 0
  let latencyCount = 0
  let gpuMemorySum = 0
  let gpuMemoryCount = 0

  normalizedKeys.forEach((key) => {
    const dynamic = realtimeStats[sampleId]?.[key]
    const fallback = allAlgorithms[key]

    const throughput = Number(preferRealtime
      ? (dynamic?.throughput ?? fallback?.avgThroughput ?? fallback?.throughput)
      : (fallback?.avgThroughput ?? fallback?.throughput)
    )
    if (Number.isFinite(throughput)) {
      throughputSum += throughput
      throughputCount += 1
    }

    const avgLatency = Number(preferRealtime
      ? (dynamic?.avgLatency ?? fallback?.avgLatency ?? fallback?.latency)
      : (fallback?.avgLatency ?? fallback?.latency)
    )
    if (Number.isFinite(avgLatency)) {
      latencySum += avgLatency
      latencyCount += 1
    }

    const gpuMemory = Number(preferRealtime
      ? (dynamic?.gpuMemory ?? fallback?.avgGpuMemory ?? fallback?.gpuMemory)
      : (fallback?.avgGpuMemory ?? fallback?.gpuMemory)
    )
    if (Number.isFinite(gpuMemory)) {
      gpuMemorySum += gpuMemory
      gpuMemoryCount += 1
    }
  })

  return {
    throughput: throughputCount ? throughputSum / throughputCount : null,
    avgLatency: latencyCount ? latencySum / latencyCount : null,
    gpuMemory: gpuMemoryCount ? gpuMemorySum / gpuMemoryCount : null
  }
}

const refreshSampleAverageSnapshot = (sampleId, preferRealtime = false, keys = undefined) => {
  sampleAverageSnapshot[sampleId] = buildSampleAverageMetrics(sampleId, keys, preferRealtime)
}

const sampleAverageMetrics = computed(() => {
  const sampleId = selectedSampleIndex.value
  return sampleAverageSnapshot[sampleId] || buildSampleAverageMetrics(sampleId)
})

const getDisplaySampleAvgThroughput = () => {
  const value = sampleAverageMetrics.value.throughput
  return Number.isFinite(value) ? value.toFixed(2) : '--'
}

const getDisplaySampleAvgLatency = () => {
  const value = sampleAverageMetrics.value.avgLatency
  return Number.isFinite(value) ? (value * 1000).toFixed(2) : '--'
}

const getDisplaySampleAvgGpuMemory = () => {
  const value = sampleAverageMetrics.value.gpuMemory
  return Number.isFinite(value) ? value.toFixed(2) : '--'
}

/* ───────── 流式输出 ───────── */

const streamingData = reactive({ tokens: {}, active: {} })
const isBatchInferencing = ref(false)

const POLL_INTERVAL_MS = 1000
const POLL_TIMEOUT_MS = 3 * 60 * 1000
const MAX_POLL_FAILURE = 3

let inferencePollTimerId = null
let inferenceRunToken = 0

const clearInferencePollTimer = () => {
  if (inferencePollTimerId) {
    clearTimeout(inferencePollTimerId)
    inferencePollTimerId = null
  }
}

const toFiniteNumber = (value, fallback = null) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const normalizeLatencySeconds = (value) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return null
  return num   // ← 直接返回，单位已经是 ms，不需要转换
}

const ensureSampleState = (sampleIndex) => {
  if (!streamingData.tokens[sampleIndex]) {
    streamingData.tokens[sampleIndex] = {}
  }
  if (!streamingData.active[sampleIndex]) {
    streamingData.active[sampleIndex] = {}
  }
}

const ensureRealtimeStat = (sampleId, key, fallback = {}) => {
  if (!realtimeStats[sampleId]) {
    realtimeStats[sampleId] = {}
  }
  if (!realtimeStats[sampleId][key]) {
    const baseThroughput = toFiniteNumber(fallback.throughput, 0)
    const baseAvgLatency = toFiniteNumber(fallback.avgLatency, 0)
    const baseGpuMemory = toFiniteNumber(fallback.gpuMemory, 0)
    realtimeStats[sampleId][key] = {
      throughput: baseThroughput,
      avgLatency: baseAvgLatency,
      gpuMemory: baseGpuMemory
    }
  }
  return realtimeStats[sampleId][key]
}

const getDisplayThroughput = (sampleId, key, fallbackValue) => {
  const value = realtimeStats[sampleId]?.[key]?.throughput
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toFixed(2)
  }
  const fallback = Number(fallbackValue)
  return Number.isFinite(fallback) ? fallback.toFixed(2) : fallbackValue
}

const getDisplayAvgLatency = (sampleId, key, fallbackValue) => {
  const value = realtimeStats[sampleId]?.[key]?.avgLatency
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toFixed(2)   // ← 去掉 * 1000
  }
  const fallback = Number(fallbackValue)
  return Number.isFinite(fallback) ? fallback.toFixed(2) : '--'
}

const getDisplayGpuMemory = (sampleId, key, fallbackValue) => {
  const value = realtimeStats[sampleId]?.[key]?.gpuMemory
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toFixed(2)
  }
  const fallback = Number(fallbackValue)
  return Number.isFinite(fallback) ? fallback.toFixed(2) : fallbackValue
}

const isStreaming = computed(() => {
  if (isBatchInferencing.value) return true
  const sampleId = selectedSampleIndex.value
  if (!streamingData.active[sampleId]) return false
  return Object.values(streamingData.active[sampleId]).some((v) => v)
})

const stopStreaming = (sampleId) => {
  ensureSampleState(sampleId)
  if (streamingData.active[sampleId]) {
    Object.keys(streamingData.active[sampleId]).forEach((k) => {
      streamingData.active[sampleId][k] = false
    })
  }
}

const stopAllInferenceWork = () => {
  inferenceRunToken += 1
  isBatchInferencing.value = false
  clearInferencePollTimer()
  Object.keys(streamingData.active).forEach((sampleId) => stopStreaming(sampleId))
  Object.keys(runningAlgorithmsBySample).forEach((sampleId) => {
    delete runningAlgorithmsBySample[sampleId]
  })
}

const extractRecordList = (data) => {
  if (Array.isArray(data)) return data          // ← 后端 data 字段直接是数组
  const list = data?.list || data?.records || data?.items || data?.rows || data?.result || []
  if (Array.isArray(list)) return list
  if (data && typeof data === 'object') return [data]
  return []
}

const parseJsonLog = (jsonLog) => {
  if (Array.isArray(jsonLog)) return jsonLog
  if (typeof jsonLog === 'string') {
    try {
      const parsed = JSON.parse(jsonLog)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

const sortBySeq = (a, b) => Number(a?.seq || 0) - Number(b?.seq || 0)

const toTokenLatencyMs = (value) => {
  const sec = normalizeLatencySeconds(value)
  return Number.isFinite(sec) ? +(sec * 1000).toFixed(2) : '--'
}

// const getSelectedModelMeta = () => {
//   const model = modelOptions.value.find((item) => item.value === selectedModel.value)
//   const modelName = String(pickFirst(model, ['label', 'modelName', 'name', 'value'], selectedModel.value))
//   const modelId = String(pickFirst(model, ['id', 'modelId', 'value'], selectedModel.value))
//   const modelType = String(pickFirst(model, ['modelType', 'type'], ''))
//   return { modelName, modelId, modelType }
// }

const getSelectedModelMeta = () => {
  // 1. 先找到该模型在数组中的索引
  const modelIndex = modelOptions.value.findIndex((item) => item.value === selectedModel.value)
  
  // 2. 获取模型对象（用于提取其他属性）
  const model = modelOptions.value[modelIndex]
  
  // 3. 将 modelId 定义为序号 (从 1 开始就 +1，从 0 开始就直接用 modelIndex)
  // 如果没找到（modelIndex 为 -1），可以给个默认值 0 或 --
  const modelId = modelIndex !== -1 ? String(modelIndex + 1) : '0'

  const modelName = String(pickFirst(model, ['label', 'modelName', 'name', 'value'], selectedModel.value))
  const modelType = String(pickFirst(model, ['modelType', 'type'], ''))

  // 调试一下看看输出
  console.log(`🎯 模型序号调试: 索引=${modelIndex}, 转换后的序号=${modelId}`)

  return { modelName, modelId, modelType }
}

const getSelectedAlgorithmMetas = () => {
  const ordered = selectedAlgorithms.value.map((key) => {
    const option = accelerationOptions.value.find((item) => String(item.value) === String(key))
    if (!option) return null
    const displayKey = String(option.value)
    return {
      key: displayKey,
      taskInnerSeq: 0,
      algorithmId: String(pickFirst(option, ['id', 'algorithmId', 'value'], displayKey)),
      algorithmName: String(pickFirst(option, ['label', 'algorithmName', 'name', 'value'], displayKey))
    }
  }).filter(Boolean)

  return ordered.map((item, index) => ({
    ...item,
    taskInnerSeq: index + 1
  }))
}

// const applyCompleteLogToSample = (sample, algoMeta, log) => {
//   const sampleIndex = sample.index
//   const sampleId = sample.sampleId
//   const key = algoMeta.key
//   ensureSampleState(sampleIndex)
//   const fallback = currentSample.value.algorithms?.[key] || {}
//   const stat = ensureRealtimeStat(sampleIndex, key, {
//     throughput: fallback.throughput,
//     avgLatency: fallback.avgLatency ?? fallback.latency,
//     gpuMemory: fallback.gpuMemory
//   })

//   const tokenLogs = parseJsonLog(log?.jsonLog).sort(sortBySeq)

//   // 更新指标（单位已经是 ms，直接存）
//   const throughput = toFiniteNumber(log?.throughput)
//   if (Number.isFinite(throughput)) stat.throughput = throughput

//   const lastToken = tokenLogs[tokenLogs.length - 1] || {}
//   const avgLatency = toFiniteNumber(
//     log?.latency ?? lastToken?.avg_latency_to_now ?? lastToken?.per_token_gen_time
//   )
//   if (Number.isFinite(avgLatency)) stat.avgLatency = avgLatency

//   const gpuMemory = toFiniteNumber(log?.gpuMemory)
//   if (Number.isFinite(gpuMemory)) stat.gpuMemory = gpuMemory

//   // 清空并标记 active，立刻开始动画
//   streamingData.tokens[sampleIndex][key] = []
//   streamingData.active[sampleIndex][key] = true

//   const tokens = tokenLogs.map((item) => ({
//     char: String(item?.content ?? ''),
//     latencyMs: toFiniteNumber(item?.per_token_gen_time, 50)
//   }))

//   let i = 0
//   const push = () => {
//     if (i >= tokens.length) {
//       streamingData.active[sampleIndex][key] = false
//       addInferenceRecord({
//         modelName: log?.modelName || selectedModelLabel.value || selectedModel.value,
//         modelValue: selectedModel.value,
//         testCase: sample.label || sample.index || '--',
//         testCaseValue: String(sampleId || ''),
//         algorithmName: log?.algorithmName || algoMeta.algorithmName || key,
//         algorithmValue: key,
//         throughput: stat.throughput,
//         latency: stat.avgLatency,
//         gpuMemory: stat.gpuMemory,
//         operatorName: getCurrentUser()
//       })
//       return
//     }
//     streamingData.tokens[sampleIndex][key].push(tokens[i])
//     i++
//     // per_token_gen_time 就是 ms，直接用，限制在 30~200ms 之间保证视觉效果
//     const delay = Math.min(200, Math.max(30, tokens[i - 1].latencyMs))
//     setTimeout(push, delay)
//   }
//   push()
// }
const applyCompleteLogToSample = (sample, algoMeta, log) => {
  const sampleIndex = sample.index
  const sampleId = sample.sampleId
  const key = algoMeta.key
  ensureSampleState(sampleIndex)
  const fallback = currentSample.value.algorithms?.[key] || {}
  
  // stat 是响应式对象，修改它的属性会直接触发页面更新
  const stat = ensureRealtimeStat(sampleIndex, key, {
    throughput: fallback.throughput,
    avgLatency: fallback.avgLatency ?? fallback.latency,
    gpuMemory: fallback.gpuMemory
  })

  const tokenLogs = parseJsonLog(log?.jsonLog).sort(sortBySeq)

  // 清空并标记 active，立刻开始动画
  streamingData.tokens[sampleIndex][key] = []
  streamingData.active[sampleIndex][key] = true

  const tokens = tokenLogs.map((item) => ({
    char: String(item?.content ?? ''),
    // 1. token时间不保留小数：使用 Math.round() 四舍五入取整
    latencyMs: Math.round(toFiniteNumber(item?.per_token_gen_time, 50)),
    
    // 提前把每一个 token 瞬间对应的动态指标提取出来
    dynamicThroughput: toFiniteNumber(item?.avg_throughput_to_now),
    dynamicLatency: toFiniteNumber(item?.avg_latency_to_now),
    dynamicGpuMem: toFiniteNumber(item?.per_token_gpu_mem)
  }))

  let i = 0
  const push = () => {
    if (i >= tokens.length) {
      streamingData.active[sampleIndex][key] = false

      // 动画完全结束时，将数据对齐为最外层 log 给出的最终标准汇总值
      const finalThroughput = toFiniteNumber(log?.throughput)
      if (Number.isFinite(finalThroughput)) stat.throughput = finalThroughput

      const finalLatency = toFiniteNumber(log?.latency)
      if (Number.isFinite(finalLatency)) stat.avgLatency = finalLatency

      const finalGpuMem = toFiniteNumber(log?.gpuMemory)
      if (Number.isFinite(finalGpuMem)) stat.gpuMemory = finalGpuMem

      addInferenceRecord({
        modelName: log?.modelName || selectedModelLabel.value || selectedModel.value,
        modelValue: selectedModel.value,
        testCase: sample.label || sample.index || '--',
        testCaseValue: String(sampleId || ''),
        algorithmName: log?.algorithmName || algoMeta.algorithmName || key,
        algorithmValue: key,
        throughput: stat.throughput,
        latency: stat.avgLatency,
        gpuMemory: stat.gpuMemory,
        operatorName: getCurrentUser()
      })
      return
    }

    const currentToken = tokens[i]
    streamingData.tokens[sampleIndex][key].push(currentToken)

    // 2. 动态更新面板上的吞吐、延迟、显存（数字跳动效果）
    if (Number.isFinite(currentToken.dynamicThroughput)) stat.throughput = currentToken.dynamicThroughput
    if (Number.isFinite(currentToken.dynamicLatency)) stat.avgLatency = currentToken.dynamicLatency
    if (Number.isFinite(currentToken.dynamicGpuMem)) stat.gpuMemory = currentToken.dynamicGpuMem

    i++
    // 延迟时间取 token 实际时间，限制在 30~200ms 之间保证视觉效果不至于卡死
    const delay = Math.min(200, Math.max(30, currentToken.latencyMs))
    setTimeout(push, delay)
  }
  
  push()
}

const resolveAlgorithmMetaFromLog = (log, algorithmMetas) => {
  const seq = Number(log?.taskInnerSeq)
  if (Number.isInteger(seq) && seq >= 1 && seq <= algorithmMetas.length) {
    return algorithmMetas[seq - 1]
  }

  const logAlgorithmId = String(log?.algorithmId || '')
  if (logAlgorithmId) {
    const byId = algorithmMetas.find((item) => String(item.algorithmId) === logAlgorithmId)
    if (byId) return byId
  }

  const logAlgorithmName = String(log?.algorithmName || '').toLowerCase()
  if (logAlgorithmName) {
    const byName = algorithmMetas.find((item) => String(item.algorithmName || '').toLowerCase() === logAlgorithmName)
    if (byName) return byName
  }

  if (algorithmMetas.length === 1) return algorithmMetas[0]
  return null
}

const isLogMatchedToSample = (log, sample, modelMeta, taskHashes) => {
  const logSampleId = String(log?.sampleId ?? '')
  if (logSampleId && String(sample.sampleId) !== logSampleId) return false

  const logDatasetId = String(log?.datasetId ?? '')
  if (logDatasetId && String(selectedDatasetId.value) !== logDatasetId) return false

  // ⚠️ 关键修改：不要用 modelId 校验了，改用名称校验，因为后端返回的 ID 和前端序号对不上
  const logModelName = String(log?.modelName ?? '')
  if (logModelName && String(modelMeta.modelName) !== logModelName) return false

  if (taskHashes.size) {
    const taskHash = String(log?.taskHash || '')
    if (taskHash && !taskHashes.has(taskHash)) return false
  }

  return true
}

// const runSingleSampleInference = async (sample, modelMeta, algorithmMetas, runToken) => {
//   if (!sample?.sampleId) {
//     throw new Error(`样本 ${sample.index} 缺少 sampleId，无法发起真实推理`)
//   }

//   const sampleIndex = sample.index
//   const runningKeys = algorithmMetas.map((item) => item.key)
//   runningAlgorithmsBySample[sampleIndex] = [...runningKeys]
//   refreshSampleAverageSnapshot(sampleIndex, false, runningKeys)
//   ensureSampleState(sampleIndex)

//   algorithmMetas.forEach((item) => {
//     streamingData.tokens[sampleIndex][item.key] = []
//     streamingData.active[sampleIndex][item.key] = true
//   })

//   const taskHashes = new Set()
//   for (const item of algorithmMetas) {
//     if (runToken !== inferenceRunToken) {
//       return
//     }
//     const payload = {
//       taskInnerSeq: item.taskInnerSeq,
//       modelName: modelMeta.modelName,
//       modelId: parseInt(modelMeta.modelId),
//       algorithmIds: [1, 2, 3],
//       modelType: 1,
//       datasetId: parseInt(selectedDatasetId.value),
//       sampleId: parseInt(sample.sampleId)
//     }
//     console.log('runBizInferenceTask.')
//     console.log('payload', payload)
//     const runRes = await runBizInferenceTask(payload)
//     if (runRes?.code !== 0) {
//       throw new Error(runRes?.msg || `算法 ${item.algorithmName} 发起失败`)
//     }
//     const responseData = runRes?.data
//     console.log('responseData:', responseData)
//     const taskHash = responseData && responseData.length > 0 
//       ? responseData[0].taskHash 
//       : ''

//     if (taskHash) {
//       console.log('✅ 提取成功:', taskHash)
//       taskHashes.add(String(taskHash))
//     } else {
//       console.error('❌ 固定结构中未找到 taskHash 字段')
//     }
//   }

//   await new Promise((resolve, reject) => {
//     const pendingKeys = new Set(runningKeys)
//     const doneKeys = new Set()
//     const startedAt = Date.now()
//     let failCount = 0

//     const tick = async () => {
//       if (runToken !== inferenceRunToken) {
//         resolve()
//         return
//       }

//       if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
//         reject(new Error(`样本 ${sample.index} 推理轮询超时`))
//         return
//       }

//       try {
//         const params = {
//           datasetId: selectedDatasetId.value,
//           sampleId: sample.sampleId,
//           modelId: modelMeta.modelId,
//           modelName: modelMeta.modelName
//         }
//         const hashArray = [...taskHashes];
//         if (hashArray.length > 0) {
//           params.TaskHash = hashArray[0]; // 满足后端必填
//           params.taskHash = hashArray[0]; // 兼容小写
//         }
        
//         // 如果有多个，额外附带 List 字段供后端批量查询
//         if (hashArray.length > 1) {
//           params.TaskHashList = hashArray.join(',');
//           params.taskHashList = hashArray.join(',');
//         }

//         const pollRes = await getBizInferenceCompleteRecord(params)
//         if (pollRes?.code !== 0) {
//           throw new Error(pollRes?.msg || '查询推理完成记录失败')
//         }

//         const records = extractRecordList(pollRes?.data)
//         failCount = 0

//         records.forEach((log) => {
//           if (!isLogMatchedToSample(log, sample, modelMeta, taskHashes)) return
//           const algoMeta = resolveAlgorithmMetaFromLog(log, algorithmMetas)
//           if (!algoMeta) return
//           if (!pendingKeys.has(algoMeta.key) || doneKeys.has(algoMeta.key)) return
//           applyCompleteLogToSample(sample, algoMeta, log)
//           pendingKeys.delete(algoMeta.key)
//           doneKeys.add(algoMeta.key)
//         })

//         if (!pendingKeys.size) {
//           // ← 改为：等所有 key 的动画播完再 resolve
//           refreshSampleAverageSnapshot(sampleIndex, true, runningKeys)
//           delete runningAlgorithmsBySample[sampleIndex]
          
//           const waitAnimation = () => {
//             const stillAnimating = runningKeys.some(
//               (k) => streamingData.active[sampleIndex]?.[k]
//             )
//             if (stillAnimating) {
//               setTimeout(waitAnimation, 100)
//             } else {
//               resolve()
//             }
//           }
//           waitAnimation()
//           return
//         }

//         clearInferencePollTimer()
//         inferencePollTimerId = setTimeout(tick, POLL_INTERVAL_MS)
//       } catch (error) {
//         failCount += 1
//         if (failCount >= MAX_POLL_FAILURE) {
//           reject(error)
//           return
//         }
//         clearInferencePollTimer()
//         inferencePollTimerId = setTimeout(tick, POLL_INTERVAL_MS)
//       }
//     }

//     tick()
//   })
// }

// const runSingleSampleInference = async (sample, modelMeta, algorithmMetas, runToken) => {
//   if (!sample?.sampleId) {
//     throw new Error(`样本 ${sample.index} 缺少 sampleId，无法发起真实推理`)
//   }

//   const sampleIndex = sample.index
//   const runningKeys = algorithmMetas.map((item) => item.key)
  
//   runningAlgorithmsBySample[sampleIndex] = [...runningKeys]
//   refreshSampleAverageSnapshot(sampleIndex, false, runningKeys)
//   ensureSampleState(sampleIndex)

//   // 初始化流式动画状态
//   algorithmMetas.forEach((item) => {
//     streamingData.tokens[sampleIndex][item.key] = []
//     streamingData.active[sampleIndex][item.key] = true
//   })

//   // 1. 遍历算法，发起推理请求并直接消费返回的数据
//   for (const item of algorithmMetas) {
//     if (runToken !== inferenceRunToken) return

//     const payload = {
//       taskInnerSeq: item.taskInnerSeq,
//       modelName: modelMeta.modelName,
//       modelId: parseInt(modelMeta.modelId),
//       algorithmIds: [1, 2, 3], 
//       modelType: 1,
//       datasetId: parseInt(selectedDatasetId.value),
//       sampleId: parseInt(sample.sampleId)
//     }

//     try {
//       const runRes = await runBizInferenceTask(payload)
//       if (runRes?.code !== 0) {
//         throw new Error(runRes?.msg || `算法 ${item.algorithmName} 发起失败`)
//       }

//       const responseData = runRes?.data
      
//       // 🌟 核心修改：不再只取 taskHash，而是直接提取完整的数据结构交由 UI 渲染
//       if (responseData && responseData.length > 0) {
//         const log = responseData[0] // 这里拿到的就是你提供的那段 JSON object
        
//         // 解析算法元数据
//         const algoMeta = resolveAlgorithmMetaFromLog(log, algorithmMetas) || item
        
//         // 直接触发前端的打字机流式渲染动画
//         applyCompleteLogToSample(sample, algoMeta, log)
//       } else {
//         console.error('未返回预期的推理数据结构')
//         streamingData.active[sampleIndex][item.key] = false
//       }
//     } catch (err) {
//       console.error(err)
//       streamingData.active[sampleIndex][item.key] = false
//     }
//   }

//   // 2. 等待当前样本所有算法的前端打字机动画播放完毕，再进入下一个样本
//   await new Promise((resolve) => {
//     refreshSampleAverageSnapshot(sampleIndex, true, runningKeys)
//     delete runningAlgorithmsBySample[sampleIndex]

//     const waitAnimation = () => {
//       // 检查是否还有动画没有播放完
//       const stillAnimating = runningKeys.some(
//         (k) => streamingData.active[sampleIndex]?.[k]
//       )
//       if (stillAnimating) {
//         setTimeout(waitAnimation, 100)
//       } else {
//         resolve()
//       }
//     }
//     waitAnimation()
//   })
// }

const runSingleSampleInference = async (sample, modelMeta, algorithmMetas, runToken) => {
  if (!sample?.sampleId) {
    throw new Error(`样本 ${sample.index} 缺少 sampleId，无法发起真实推理`)
  }

  const sampleIndex = sample.index
  const runningKeys = algorithmMetas.map((item) => item.key)
  runningAlgorithmsBySample[sampleIndex] = [...runningKeys]
  refreshSampleAverageSnapshot(sampleIndex, false, runningKeys)
  ensureSampleState(sampleIndex)

  // 提前初始化所有选中算法的流式渲染状态，此时 UI 上会显示“等待推理...”或光标闪烁
  algorithmMetas.forEach((item) => {
    streamingData.tokens[sampleIndex][item.key] = []
    streamingData.active[sampleIndex][item.key] = true
  })

  // 1. 遍历算法，直接发送请求并消费完整数据
  for (const item of algorithmMetas) {
    if (runToken !== inferenceRunToken) return

    const payload = {
      taskInnerSeq: item.taskInnerSeq,
      modelName: modelMeta.modelName,
      modelId: parseInt(modelMeta.modelId),
      algorithmIds: [1, 2, 3], 
      modelType: 1,
      datasetId: parseInt(selectedDatasetId.value),
      sampleId: parseInt(sample.sampleId)
    }

    try {
      const runRes = await runBizInferenceTask(payload)
      if (runRes?.code !== 0) {
        throw new Error(runRes?.msg || `算法 ${item.algorithmName} 发起失败`)
      }

      const responseData = runRes?.data

      // 🌟 核心修改点：直接读取 responseData[0] 中的完整 JSON 日志喂给前端动画
      if (responseData && responseData.length > 0) {
        const log = responseData[0]
        const algoMeta = resolveAlgorithmMetaFromLog(log, algorithmMetas) || item
        
        // 触发打字机动画并写入指标（throughput、latency、gpuMemory）
        applyCompleteLogToSample(sample, algoMeta, log)
      } else {
        console.error(`算法 ${item.algorithmName} 未返回预期的数据结构`)
        streamingData.active[sampleIndex][item.key] = false
      }
    } catch (error) {
      console.error(error)
      streamingData.active[sampleIndex][item.key] = false
    }
  }

  // 2. 阻塞当前函数，直到该样本的所有前端动画（打字机效果）播放完毕，再进入下一个样本
  await new Promise((resolve) => {
    refreshSampleAverageSnapshot(sampleIndex, true, runningKeys)
    delete runningAlgorithmsBySample[sampleIndex]

    const waitAnimation = () => {
      // 增加 runToken 校验，防止用户中途点击“刷新”或切换参数导致幽灵动画
      if (runToken !== inferenceRunToken) {
        resolve()
        return
      }
      
      const stillAnimating = runningKeys.some(
        (k) => streamingData.active[sampleIndex]?.[k]
      )
      
      if (stillAnimating) {
        setTimeout(waitAnimation, 100)
      } else {
        resolve()
      }
    }
    waitAnimation()
  })
}

const startStreaming = async () => {
  if (!hasSamples.value) {
    ElMessage.warning('当前数据集暂无样本，请先在数据集管理中添加样本')
    return
  }
  const algorithmMetas = getSelectedAlgorithmMetas()
  if (!algorithmMetas.length) {
    ElMessage.warning('请至少选择一个加速算法')
    return
  }

  resetStreamingState()
  const runToken = ++inferenceRunToken
  isBatchInferencing.value = true

  const samples = [...datasetSamples.value].sort((a, b) => Number(a.index) - Number(b.index))
  if (samples.length) {
    selectedSampleIndex.value = samples[0].index
    onSampleChange()
  }

  const modelMeta = getSelectedModelMeta()
  try {
    for (const sample of samples) {
      if (runToken !== inferenceRunToken) return
      selectedSampleIndex.value = sample.index
      onSampleChange()
      await runSingleSampleInference(sample, modelMeta, algorithmMetas, runToken)
    }
    if (runToken === inferenceRunToken) {
      ElMessage.success('当前数据集已完成全部样本推理')
    }
  } catch (error) {
    if (runToken === inferenceRunToken) {
      ElMessage.error(error?.message || '推理失败，请稍后重试')
    }
  } finally {
    if (runToken === inferenceRunToken) {
      isBatchInferencing.value = false
      clearInferencePollTimer()
      Object.keys(streamingData.active).forEach((sampleId) => stopStreaming(sampleId))
      Object.keys(runningAlgorithmsBySample).forEach((sampleId) => {
        delete runningAlgorithmsBySample[sampleId]
      })
    }
  }
}


const resetStreamingState = () => {
  stopAllInferenceWork()
  Object.keys(streamingData.tokens).forEach((sampleId) => {
    Object.keys(streamingData.tokens[sampleId] || {}).forEach((k) => {
      streamingData.tokens[sampleId][k] = []
    })
  })
  Object.keys(realtimeStats).forEach((sampleId) => {
    Object.keys(realtimeStats[sampleId] || {}).forEach((k) => {
      delete realtimeStats[sampleId][k]
    })
  })
  Object.keys(sampleAverageSnapshot).forEach((sampleId) => {
    delete sampleAverageSnapshot[sampleId]
  })
  Object.keys(runningAlgorithmsBySample).forEach((sampleId) => {
    delete runningAlgorithmsBySample[sampleId]
  })
}

/* ───────── 样本选择 ───────── */

const onSampleChange = () => {
  const sampleId = selectedSampleIndex.value
  if (!sampleId) return
  ensureSampleState(sampleId)
  if (!sampleAverageSnapshot[sampleId]) {
    refreshSampleAverageSnapshot(sampleId)
  }
}

const onDatasetChange = async () => {
  resetStreamingState()
  await loadDatasetSamples(selectedDatasetId.value)
}

const jumpToSample = () => {
  const idx = parseInt(sampleIndexInput.value, 10)
  if (isNaN(idx)) {
    ElMessage.warning('请输入有效的样本序号')
    return
  }
  const exists = datasetSamples.value.find((s) => s.index === idx)
  if (!exists) {
    ElMessage.warning(`样本序号 ${idx} 不存在，可选范围 1 ~ ${datasetSamples.value.length}`)
    return
  }
  selectedSampleIndex.value = idx
  sampleIndexInput.value = ''
  onSampleChange()
}

const onParamChange = () => {
  resetStreamingState()
  onSampleChange()
}

const onAlgorithmChange = () => {
  const sampleId = selectedSampleIndex.value
  const hasRunning = (runningAlgorithmsBySample[sampleId] || [])
    .some((key) => !!streamingData.active[sampleId]?.[key])
  if (!hasRunning) {
    refreshSampleAverageSnapshot(sampleId)
  }
}

/* ───────── 排名 state ───────── */

const rankCase = ref(defaultCaseOptions[0].value)
const rankMetric = ref(rankMetricOptions[0].value)
const rankPage = ref(1)
const rankPageSize = ref(10)
const rankTotal = ref(0)
const rankRows = ref([])
const rankLoading = ref(false)

/* ───────── 历史 state ───────── */

const historyCase = ref(defaultCaseOptions[0].value)
const historyPage = ref(1)
const historyPageSize = ref(10)
const historyTotal = ref(0)
const historyRows = ref([])
const historyLoading = ref(false)

const historyDetailVisible = ref(false)
const historyDetail = ref({
  taskHash: '--',
  modelName: '--',
  testCase: '--',
  algorithms: [],
  executionTime: '--',
  operatorName: '--'
})

/* ───────── 通用工具 ───────── */

const readField = (item, keys, fallback = '--') => {
  for (const key of keys) {
    if (item?.[key] !== undefined && item?.[key] !== null && item?.[key] !== '') {
      return item[key]
    }
  }
  return fallback
}

const toCaseLabel = (caseValue) => {
  const hit = caseOptions.value.find((i) => i.value === caseValue)
  return hit?.label || caseValue || '--'
}

const normalizeAlgorithmList = (value) => {
  if (Array.isArray(value)) return value
  if (!value) return []
  return String(value).split(/[,|/]/).map((i) => i.trim()).filter(Boolean)
}

const resolvePagePayload = (data, fallbackList = []) => {
  const list = data?.list || data?.records || data?.items || data?.rows || fallbackList
  const total = Number(data?.total || data?.count || data?.all || list.length || 0)
  return { list: Array.isArray(list) ? list : fallbackList, total }
}

const buildRankMetricValue = (item) => {
  const valueMap = {
    throughput: readField(item, ['throughput', 'averageThroughput'], '--'),
    latency: readField(item, ['latency', 'averageLatency'], '--'),
    gpuMemory: readField(item, ['gpuMemory', 'averageGpuMemory'], '--'),
    executionTime: readField(item, ['executionTime', 'createdAt', 'created_at'], '--')
  }
  return valueMap[rankMetric.value]
}

const mapRankRow = (item, index) => ({
  rank: Number(readField(item, ['rank', 'ranking'], index + 1)),
  modelName: readField(item, ['modelName', 'model', 'model_name']),
  algorithmName: readField(item, ['algorithmName', 'algorithm', 'accelerationAlgorithm', 'algorithm_name']),
  throughput: `${readField(item, ['throughput', 'averageThroughput'], '--')} token/s`,
  latency: `${readField(item, ['latency', 'averageLatency'], '--')} s`,
  gpuMemory: `${readField(item, ['gpuMemory', 'averageGpuMemory'], '--')} G`,
  executionTime: formatTimestamp(readField(item, ['executionTime', 'createdAt', 'created_at', 'CreatedAt'])),
  operatorName: readField(item, ['operatorName', 'operator', 'operator_name'], '--'),
  score: buildRankMetricValue(item)
})

const mapHistoryRow = (item) => ({
  id: readField(item, ['ID', 'id', 'taskId'], ''),
  taskHash: readField(item, ['taskHash', 'taskNo', 'taskCode', 'task_hash'], '--'),
  modelName: readField(item, ['modelName', 'model', 'model_name'], '--'),
  modelValue: readField(item, ['modelValue'], ''),
  testCase: readField(item, ['testCase', 'datasetName', 'caseName', 'dataset_name'], toCaseLabel(historyCase.value)),
  testCaseValue: readField(item, ['testCaseValue'], ''),
  algorithms: normalizeAlgorithmList(readField(item, ['accelerationAlgorithms', 'algorithmName', 'algorithm', 'algorithm_name'], '')),
  algorithmValue: readField(item, ['algorithmValue'], ''),
  executionTime: formatTimestamp(readField(item, ['executionTime', 'createdAt', 'created_at', 'CreatedAt'], '--')),
  operatorName: readField(item, ['operatorName', 'operator', 'operator_name'], '--')
})

/* ───────── API 调用 ───────── */

const applyRealtimePayload = (payload) => {
  if (Array.isArray(payload.modelOptions) && payload.modelOptions.length) {
    modelOptions.value = payload.modelOptions
  }
  if (Array.isArray(payload.accelerationOptions) && payload.accelerationOptions.length) {
    accelerationOptions.value = payload.accelerationOptions
  }
}

const syncCaseOptionsFromDataset = () => {
  caseOptions.value = datasetOptions.value.map((item) => ({
    label: item.label,
    value: item.value
  }))
  if (!caseOptions.value.length) {
    rankCase.value = ''
    historyCase.value = ''
    return
  }
  if (!caseOptions.value.some((item) => item.value === rankCase.value)) {
    rankCase.value = caseOptions.value[0].value
  }
  if (!caseOptions.value.some((item) => item.value === historyCase.value)) {
    historyCase.value = caseOptions.value[0].value
  }
}

const ensureSampleSelection = () => {
  if (!datasetSamples.value.length) {
    selectedSampleIndex.value = null
    return
  }
  const exists = datasetSamples.value.some((s) => s.index === selectedSampleIndex.value)
  if (!exists) {
    selectedSampleIndex.value = datasetSamples.value[0].index
  }
}

const loadDatasetSamples = async (datasetId) => {
  if (!datasetId) {
    datasetSamples.value = []
    selectedSampleIndex.value = null
    return
  }
  const table = await getBizSampleList({ page: 1, pageSize: 1000, datasetId })
  if (table?.code === 0) {
    const list = extractList(table.data)
    datasetSamples.value = list.map((item, index) => normalizeSampleOption(item, index))
  } else {
    datasetSamples.value = []
  }
  ensureSampleSelection()
  onSampleChange()
}

const fetchRealtimeData = async () => {
  loading.value = true
  try {
    const datasetRes = await getBizDatasetList({ page: 1, pageSize: 1000 })
    if (datasetRes?.code === 0) {
      const list = extractList(datasetRes.data)
      datasetOptions.value = list
        .map((item) => normalizeDatasetOption(item))
        .filter((item) => item.value)
    } else {
      datasetOptions.value = []
    }
    syncCaseOptionsFromDataset()

    if (!datasetOptions.value.length) {
      datasetSamples.value = []
      selectedDatasetId.value = ''
      selectedSampleIndex.value = null
      return
    }

    const hasCurrentDataset = datasetOptions.value.some((item) => String(item.value) === String(selectedDatasetId.value))
    if (!hasCurrentDataset) {
      selectedDatasetId.value = datasetOptions.value[0].value
    }
    await loadDatasetSamples(selectedDatasetId.value)
    applyRealtimePayload({})
  } catch (_e) {
    datasetOptions.value = []
    syncCaseOptionsFromDataset()
    datasetSamples.value = []
    selectedDatasetId.value = ''
    selectedSampleIndex.value = null
    ElMessage.error('加载数据集失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const fetchRankData = async () => {
  rankLoading.value = true
  try {
    // First try localStorage (records from actual inference runs)
    const localRecords = getRankRecords(rankMetric.value)
    if (localRecords.length) {
      rankRows.value = localRecords
      rankTotal.value = localRecords.length
      return
    }
    rankRows.value = mockRankRows
    rankTotal.value = mockRankRows.length
  } catch (_e) {
    rankRows.value = mockRankRows
    rankTotal.value = mockRankRows.length
  } finally {
    rankLoading.value = false
  }
}

const fetchHistoryData = async () => {
  historyLoading.value = true
  try {
    const res = await getBizInferenceTaskList({
      page: historyPage.value,
      pageSize: historyPageSize.value,
      caseName: historyCase.value
    })
    if (res?.code === 0 && res?.data) {
      const { list, total } = resolvePagePayload(res.data, [])
      if (list.length) {
        historyRows.value = list.map((item) => mapHistoryRow(item))
        historyTotal.value = total
        return
      }
    }
  } catch (_e) {
    // fall through to localStorage
  } finally {
    historyLoading.value = false
  }
  // Use localStorage records as source of truth
  const localRecords = getHistoryRecords()
  if (localRecords.length) {
    historyRows.value = localRecords
    historyTotal.value = localRecords.length
  } else {
    historyRows.value = mockHistoryRows
    historyTotal.value = mockHistoryRows.length
  }
}

const refreshRankData = () => { rankPage.value = 1; fetchRankData() }
const refreshHistoryData = () => { historyPage.value = 1; fetchHistoryData() }

const viewHistoryRow = (row) => {
  // 将预填参数写入 sessionStorage，这样即使 keep-alive 组件重新激活也能获取到
  const prefill = {}
  if (row.modelValue) prefill.model = row.modelValue
  if (row.testCaseValue) prefill.sample = row.testCaseValue
  if (row.algorithmValue) prefill.algo = row.algorithmValue
  else if (row.algorithms && row.algorithms.length) prefill.algo = row.algorithms[0]
  try {
    sessionStorage.setItem(PREFILL_KEY, JSON.stringify(prefill))
  } catch { /* ignore */ }

  // 动态查找“多模态大模型推理”页面路由
  const inferenceRoute = findInferenceRoute()
  if (inferenceRoute?.name) {
    router.push({ name: inferenceRoute.name }).catch(() => {
      // 同路由导航失败则直接展示详情弹窗
      historyDetail.value = {
        taskHash: row.taskHash || '--',
        modelName: row.modelName || '--',
        testCase: row.testCase || '--',
        algorithms: row.algorithms || [],
        executionTime: row.executionTime || '--',
        operatorName: row.operatorName || '--'
      }
      historyDetailVisible.value = true
    })
  } else {
    // 找不到路由：展示详情弹窗作为备用
    historyDetail.value = {
      taskHash: row.taskHash || '--',
      modelName: row.modelName || '--',
      testCase: row.testCase || '--',
      algorithms: row.algorithms || [],
      executionTime: row.executionTime || '--',
      operatorName: row.operatorName || '--'
    }
    historyDetailVisible.value = true
  }
}

const deleteHistoryRow = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除任务 ${row.taskHash} 吗？`, '删除确认', { type: 'warning' })
    const targetId = row.id
    // Try to delete from local storage first
    if (targetId && !String(targetId).startsWith('m-')) {
      try {
        const res = await deleteBizInferenceTask({ ID: targetId })
        if (res?.code === 0) {
          ElMessage.success('删除成功')
          fetchHistoryData()
          return
        }
      } catch {
        // fall through to local delete
      }
    }
    // Delete from localStorage
    if (targetId) deleteInferenceRecord(targetId)
    historyRows.value = historyRows.value.filter((i) => i.id !== targetId && i.taskHash !== row.taskHash)
    historyTotal.value = Math.max(0, historyTotal.value - 1)
    ElMessage.success('已删除')
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('删除失败')
  }
}

/* ───────── 生命周期 ───────── */

/**
 * 从已注册路由中动态找到“多模态大模型推理”页面对应的路由，
 * 即：与当前组件相同但 meta.title 不含《推理任务记录》和《推理排行榜》关键字的路由。
 */
const findInferenceRoute = () => {
  const allRoutes = router.getRoutes()
  
  // Try exact match by title first
  let target = allRoutes.find((r) => {
    const title = String(r.meta?.title || '')
    return title.includes('多模态大模型推理')
  })
  if (target) return target

  return allRoutes.find((r) => {
    const title = String(r.meta?.title || '')
    return (
      !title.includes('推理任务记录') &&
      !title.includes('推理排行榜') &&
      (
        String(r.name || '').toLowerCase().includes('inference') ||
        String(r.name || '').toLowerCase().includes('biz_inference_task')
      )
    )
  }) ||
  // Broader fallback: any route whose title explicitly includes 推理 but NOT the two excluded ones
  allRoutes.find((r) => {
    const title = String(r.meta?.title || '')
    return title.includes('推理') && !title.includes('任务记录') && !title.includes('排行榜')
  })
}

/**
 * 将 sessionStorage 中存储的预填参数应用到当前推理页面。
 * 分 onMounted / onActivated 两种场景都需要处理（keep-alive 场景下
 * onMounted 只调一次，后续返回该页动 onActivated）。
 */
const PREFILL_KEY = 'mllmt_inference_prefill'

const applyPrefill = () => {
  if (!isRealtimeOnly.value) return
  // Priority 1: sessionStorage (set by viewHistoryRow)
  let changed = false
  try {
    const raw = sessionStorage.getItem(PREFILL_KEY)
    if (raw) {
      sessionStorage.removeItem(PREFILL_KEY)
      const p = JSON.parse(raw)
      if (p.model) {
        const found = modelOptions.value.find((m) => m.value === p.model)
        if (found && selectedModel.value !== p.model) {
          selectedModel.value = p.model
          changed = true
        }
      }
      if (p.sample) {
        const target = datasetSamples.value.find((s) => String(s.sampleId) === String(p.sample) || String(s.index) === String(p.sample))
        if (target && selectedSampleIndex.value !== target.index) {
          selectedSampleIndex.value = target.index
          changed = true
        }
      }
      if (p.algo) {
        const found = accelerationOptions.value.find((a) => a.value === p.algo)
        if (found && !selectedAlgorithms.value.includes(p.algo)) {
          selectedAlgorithms.value = [p.algo]
          changed = true
        }
      }
      if (changed) {
        onParamChange()
        onSampleChange()
      }
      return
    }
  } catch { /* ignore */ }
  // Priority 2: route query params (kept for direct URL navigation)
  const q = route.query
  if (q.model) {
    const found = modelOptions.value.find((m) => m.value === q.model)
    if (found && selectedModel.value !== q.model) {
      selectedModel.value = q.model
      changed = true
    }
  }
  if (q.sample) {
    const target = datasetSamples.value.find((s) => String(s.sampleId) === String(q.sample) || String(s.index) === String(q.sample))
    if (target && selectedSampleIndex.value !== target.index) {
      selectedSampleIndex.value = target.index
      changed = true
    }
  }
  if (q.algo) {
    const found = accelerationOptions.value.find((a) => a.value === q.algo)
    if (found && !selectedAlgorithms.value.includes(q.algo)) {
      selectedAlgorithms.value = [q.algo]
      changed = true
    }
  }
  
  if (changed) {
    onParamChange()
    onSampleChange()
  }
}

onMounted(() => {
  applyPrefill()
})

// keep-alive 场景：重新进入页面时触发
onActivated(() => {
  // 如果是历史页面，重新加载历史记录（可能新增了记录）
  if (isHistoryOnly.value) {
    fetchHistoryData()
    return
  }
  // 如果是推理页面，应用待处理的预填参数
  if (isRealtimeOnly.value) {
    applyPrefill()
  }
})

watch(
  [isHistoryOnly, isRankOnly],
  ([historyOnly, rankOnly]) => {
    if (historyOnly) {
      stopAllInferenceWork()
      fetchHistoryData()
      return
    }
    if (rankOnly) {
      stopAllInferenceWork()
      fetchRankData()
      return
    }
    fetchRealtimeData()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  stopAllInferenceWork()
})
</script>

<style scoped>
.rt-page {
  --space-8: 8px;
  --space-12: 12px;
  --space-16: 16px;
  --space-24: 24px;
  
  /* Light theme variables (default) */
  --bg-page: #f8fafc;
  --bg-card: #ffffff;
  --text-main: #334155;
  --text-sub: #64748b;
  --line-soft: #e2e8f0;
  --primary: #3b82f6;
  --primary-dark: #2563eb;
  --primary-light: #eff6ff;
  --primary-border: #bfdbfe;
  --hero-from: #f0f9ff;
  --hero-to: #e0f2fe;
  --hero-end: #bae6fd;
  
  --bg-chip: #f1f5f9;
  --border-chip: #cbd5e1;
  --hero-title: #0f172a;
  --hero-subtitle: #475569;
  --hero-glow: rgba(59, 130, 246, 0.1);
  --btn-ghost-bg: #f8fafc;
  --btn-ghost-border: #e2e8f0;
  
  --metric-card-bg: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  --metric-item-bg: #f1f5f9;
  --metric-item-strong-bg: #eff6ff;
  
  --token-bg: #f1f5f9;
  --token-border: #e2e8f0;
  
  --select-wrapper-bg: #ffffff;
  --table-th-bg: #f1f5f9;
  --table-th-text: #475569;
  --table-tr-hover: #f8fafc;

  --hero-text: #334155;
  --hero-tag-text: #1d4ed8;
  --hero-tag-border: rgba(37, 99, 235, 0.3);
  --hero-tag-bg: rgba(59, 130, 246, 0.15);
  
  --hero-tag-muted-text: #475569;
  --hero-tag-muted-border: rgba(148, 163, 184, 0.4);
  --hero-tag-muted-bg: rgba(148, 163, 184, 0.15);

  background: var(--bg-page);
  color: var(--text-main);
  min-height: calc(100vh - 120px);
  padding: var(--space-24);
}



.rt-container {
  max-width: 1260px;
  margin: 0 auto;
  display: grid;
  gap: var(--space-16);
}

.rt-section {
  background: var(--bg-card);
  border: 1px solid var(--line-soft);
  border-radius: 14px;
  padding: var(--space-16);
  box-shadow: 0 8px 24px rgba(3, 8, 20, 0.42);
}

/* ── Hero ───────────────────── */
.rt-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-16);
  background: linear-gradient(135deg, var(--hero-from) 0%, var(--hero-to) 60%, var(--hero-end) 100%);
  border: 1px solid var(--primary-border);
  color: var(--hero-text);
  padding: 22px 24px;
  border-radius: 14px;
  box-shadow: 0 8px 28px rgba(3, 8, 20, 0.5);
  position: relative;
  overflow: hidden;
}

.rt-hero::before {
  content: '';
  position: absolute;
  top: -40%;
  right: -10%;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: var(--hero-glow);
  filter: blur(50px);
  pointer-events: none;
}

.rt-title {
  margin: 0;
  font-size: 24px;
  line-height: 1.3;
  color: var(--hero-title);
  font-weight: 700;
}

.rt-subtitle {
  margin: var(--space-8) 0 0;
  color: var(--hero-subtitle);
  font-size: 14px;
  line-height: 1.6;
}

.hero-tags {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  flex-wrap: wrap;
}

.tag {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--hero-tag-border);
  color: var(--hero-tag-text);
  background: var(--hero-tag-bg);
  font-size: 12px;
  font-weight: 600;
  backdrop-filter: blur(4px);
}

.tag.muted {
  color: var(--hero-tag-muted-text);
  border-color: var(--hero-tag-muted-border);
  background: var(--hero-tag-muted-bg);
}

/* ── Controls ──────────────── */
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-12);
}

.section-head h3 {
  margin: 0;
  font-size: 16px;
  color: var(--text-main);
  font-weight: 600;
}

.control-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-16);
}

.control-field {
  display: grid;
  gap: var(--space-8);
}

.control-field label,
.algo-row > label {
  font-size: 13px;
  color: var(--text-sub);
  font-weight: 600;
}

.control-select {
  width: min(360px, 100%);
}

/* ── Sample selector ───────── */
.sample-selector {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  flex-wrap: wrap;
}

.sample-dropdown {
  width: 200px;
  flex-shrink: 0;
}

.sample-index-box {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sample-idx-input {
  width: 90px;
}

.jump-btn {
  border: 1px solid var(--line-soft);
  color: var(--text-sub);
  background: var(--primary-light);
  border-radius: 10px;
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
  transition: all 0.2s ease;
}

.jump-btn:hover {
  border-color: var(--primary-border);
  color: var(--primary);
  background: rgba(77, 135, 255, 0.12);
}

/* ── Algo row ──────────────── */
.algo-row {
  margin-top: var(--space-16);
  display: grid;
  gap: var(--space-8);
}

.algo-row :deep(.el-checkbox-group) {
  display: flex;
  gap: var(--space-12);
  flex-wrap: wrap;
}

.algo-row :deep(.el-checkbox) {
  margin-right: 0;
}

.algo-row :deep(.el-checkbox__label) {
  color: var(--text-sub);
  font-size: 13px;
}

/* ── Status actions & grid ─── */
.status-actions {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.progress-text {
  font-size: 13px;
  color: var(--primary);
  font-weight: 600;
  background: var(--primary-light);
  border-radius: 999px;
  padding: 6px 10px;
}

.run-btn {
  border: 1px solid var(--primary);
  color: var(--primary);
  background: var(--primary-light);
  border-radius: 10px;
  height: 34px;
  padding: 0 16px;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.run-btn:hover:not(:disabled) {
  background: var(--primary);
  color: #fff;
  box-shadow: 0 4px 14px rgba(77, 135, 255, 0.4);
}

.run-btn.streaming {
  border-color: #f59e0b;
  color: #d97706;
  background: rgba(245, 158, 11, 0.08);
  cursor: default;
}

.run-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f59e0b;
  animation: pulse-dot 1.2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.7); }
}

.status-grid {
  display: grid;
  grid-template-columns: 120px minmax(240px, 1fr) 240px;
  gap: var(--space-12);
  margin-bottom: var(--space-16);
}

.meta-chip {
  min-height: 72px;
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  background: var(--bg-chip);
  color: var(--text-main);
  display: flex;
  align-items: center;
  padding: 0 var(--space-12);
  font-size: 13px;
  gap: var(--space-8);
}

.meta-label {
  color: var(--text-sub);
  font-weight: 600;
  flex-shrink: 0;
}

.meta-val {
  color: var(--text-main);
  font-weight: 500;
}

.prompt-chip {
  overflow: hidden;
}

.prompt-chip .meta-val {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-chip {
  justify-content: space-between;
}

.case-image {
  width: 96px;
  height: 56px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--line-soft);
}

/* ── Cards grid ────────────── */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-16);
  align-items: stretch;
}

.metric-card {
  border: 1px solid var(--line-soft);
  border-radius: 14px;
  background: var(--metric-card-bg);
  padding: var(--space-16);
  display: flex;
  flex-direction: column;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.metric-card:hover {
  border-color: rgba(77, 135, 255, 0.42);
  box-shadow: 0 10px 28px rgba(77, 135, 255, 0.2);
  transform: translateY(-2px);
}

.card-head {
  font-size: 18px;
  color: var(--text-main);
  font-weight: 700;
  margin-bottom: var(--space-12);
}

.metric-main {
  display: grid;
  gap: var(--space-8);
}

.metric-item {
  border: 1px solid var(--line-soft);
  background: var(--metric-item-bg);
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-12);
}

.metric-item.metric-strong {
  border-color: var(--primary-border);
  background: var(--metric-item-strong-bg);
}

.metric-label {
  color: var(--text-sub);
  font-size: 12px;
}

.metric-value {
  color: var(--text-main);
  font-size: 18px;
  font-weight: 700;
}

.metric-value em {
  font-style: normal;
  font-size: 12px;
  color: var(--text-sub);
  margin-left: 3px;
  font-weight: 500;
}

/* ── Token stream (per-char boxes) ── */
.token-stream {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: var(--space-8);
  margin-top: var(--space-16);
  padding-top: var(--space-12);
  border-top: 1px dashed var(--line-soft);
  min-height: 68px;
}

.token-item {
  width: 54px;
  min-height: 54px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--token-border);
  border-radius: 10px;
  background: var(--token-bg);
  padding: 6px 4px;
  animation: token-in 0.15s ease-out;
}

@keyframes token-in {
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
}

.token-text {
  font-size: 14px;
  color: var(--text-main);
}

.token-latency {
  margin-top: 2px;
  color: var(--text-sub);
  font-size: 10px;
}

.cursor-item {
  border-color: transparent;
  background: transparent;
}

.stream-cursor {
  color: var(--primary);
  font-weight: 700;
  font-size: 18px;
  animation: blink-cursor 0.9s step-end infinite;
}

@keyframes blink-cursor {
  50% { opacity: 0; }
}

.token-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 68px;
  color: var(--text-sub);
  font-style: italic;
  font-size: 13px;
}

/* ── Header sample selector ── */
.header-sample-select {
  width: 170px;
}

.header-idx-box {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-idx-input {
  width: 72px;
}

/* ── Average block ─────────── */
.avg-block {
  margin-top: auto;
  padding-top: var(--space-12);
  border-top: 1px solid var(--line-soft);
  display: grid;
  gap: 4px;
  color: var(--text-sub);
  font-size: 12px;
  line-height: 1.5;
}

.avg-block b {
  color: var(--text-main);
}

/* ── Table styles ──────────── */
.table-toolbar {
  display: flex;
  align-items: flex-end;
  gap: var(--space-16);
  flex-wrap: wrap;
  margin-bottom: var(--space-12);
}

.control-field.compact {
  gap: 6px;
}

.compact-select {
  width: 220px;
}

.ghost-btn {
  border: 1px solid var(--btn-ghost-border);
  color: var(--text-sub);
  background: var(--btn-ghost-bg);
  border-radius: 10px;
  height: 34px;
  padding: 0 14px;
  transition: all 0.2s ease;
}

.ghost-btn:hover {
  border-color: var(--primary-border);
  color: var(--primary);
  background: rgba(77, 135, 255, 0.12);
}

.table-wrap {
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  overflow: hidden;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--primary-dark);
  background: var(--primary-light);
}

.rank-badge.top-1 { color: #ffd98a; background: rgba(255, 196, 74, 0.18); }
.rank-badge.top-2 { color: #d2def5; background: rgba(176, 196, 222, 0.2); }
.rank-badge.top-3 { color: #f3c7a8; background: rgba(216, 146, 92, 0.2); }

.algo-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.algo-tag {
  border-radius: 999px;
}

.table-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-12);
}

/* ── Deep overrides ────────── */
:deep(.el-select__wrapper) {
  border-radius: 10px;
  min-height: 38px;
  background: var(--select-wrapper-bg);
  box-shadow: inset 0 0 0 1px var(--line-soft);
}

:deep(.el-checkbox__inner) {
  border-radius: 4px;
}

:deep(.el-button.is-text:hover) {
  background: var(--primary-light);
}

:deep(.el-table th.el-table__cell) {
  background: var(--table-th-bg);
  color: var(--table-th-text);
  font-size: 12px;
  font-weight: 600;
}

:deep(.el-table td.el-table__cell) {
  color: var(--text-main);
  background: var(--bg-card);
}

:deep(.el-table tr:hover > td.el-table__cell) {
  background: var(--table-tr-hover);
}

:deep(.history-detail-dialog .el-dialog__header) {
  margin-right: 0;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line-soft);
}

/* ── Responsive ────────────── */
@media (max-width: 1320px) {
  .cards-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .status-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 960px) {
  .rt-page {
    padding: var(--space-16);
  }
  .rt-title {
    font-size: 20px;
  }
  .rt-hero {
    flex-direction: column;
  }
  .control-grid {
    grid-template-columns: 1fr;
  }
  .cards-grid {
    grid-template-columns: 1fr;
  }
  .compact-select {
    width: min(320px, 100%);
  }
  .sample-selector {
    flex-direction: column;
    align-items: stretch;
  }
  .sample-dropdown {
    width: 100%;
  }
}
</style>

<style>
html.dark .rt-page {
  /* Dark theme variables */
  --bg-page: #1f2c46;
  --bg-card: #0f1d38;
  --text-main: #e6edfb;
  --text-sub: #9baccc;
  --line-soft: rgba(108, 141, 198, 0.26);
  --primary: #4d87ff;
  --primary-dark: #2f6edf;
  --primary-light: rgba(77, 135, 255, 0.16);
  --primary-border: rgba(108, 141, 198, 0.36);
  --hero-from: #091830;
  --hero-to: #10264b;
  --hero-end: #17396b;
  
  --bg-chip: #132a4d;
  --border-chip: rgba(108, 141, 198, 0.26);
  --hero-title: #f3f7ff;
  --hero-subtitle: rgba(214, 227, 255, 0.8);
  --hero-glow: rgba(77, 135, 255, 0.2);
  --btn-ghost-bg: rgba(77, 135, 255, 0.16);
  --btn-ghost-border: rgba(108, 141, 198, 0.26);

  --metric-card-bg: linear-gradient(180deg, #0f213f 0%, #112a4f 100%);
  --metric-item-bg: #132a4d;
  --metric-item-strong-bg: rgba(77, 135, 255, 0.18);
  
  --token-bg: #122542;
  --token-border: rgba(108, 141, 198, 0.26);

  --select-wrapper-bg: #0b1933;
  --table-th-bg: #112546;
  --table-th-text: #d5e3fd;
  --table-tr-hover: #14294d;

  --hero-text: #dde8ff;
  --hero-tag-text: #bfd4ff;
  --hero-tag-border: rgba(112, 155, 255, 0.45);
  --hero-tag-bg: rgba(77, 135, 255, 0.18);
  
  --hero-tag-muted-text: rgba(204, 222, 255, 0.78);
  --hero-tag-muted-border: rgba(150, 182, 232, 0.36);
  --hero-tag-muted-bg: rgba(96, 130, 190, 0.2);
}
</style>
