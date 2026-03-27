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
              @change="refreshRealtimeData"
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
            <label>测试用例</label>
            <el-select
              v-model="selectedCase"
              placeholder="请选择测试用例"
              class="control-select"
              @change="refreshRealtimeData"
            >
              <el-option
                v-for="item in caseOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
        </div>

        <div class="algo-row">
          <label>加速算法</label>
          <el-checkbox-group v-model="selectedAlgorithms" @change="refreshRealtimeData">
            <el-checkbox
              v-for="item in accelerationOptions"
              :key="item.value"
              :value="item.value"
              :label="item.label"
            />
          </el-checkbox-group>
        </div>
      </section>

      <section v-if="isRealtimeOnly" class="rt-section status-section">
        <div class="section-head">
          <h3>运行状态</h3>
          <div class="status-actions">
            <span class="progress-text">进度 {{ displayTask.progress.current }}/{{ displayTask.progress.total }}</span>
            <el-button class="fold-btn" text @click="isExpanded = !isExpanded">
              <span class="fold-icon" :class="{ collapsed: !isExpanded }">▼</span>
            </el-button>
          </div>
        </div>

        <div class="status-grid">
          <div class="meta-chip">序号 {{ displayTask.serial }}</div>
          <div class="meta-chip prompt-chip">提示词 {{ displayTask.prompt }}</div>
          <div class="meta-chip image-chip">
            <span>样本图片</span>
            <img class="case-image" :src="displayTask.image" alt="测试图片" />
          </div>
        </div>
      </section>

      <section v-if="isRealtimeOnly && isExpanded" class="rt-section" v-loading="loading">
        <div class="section-head">
          <h3>结果展示</h3>
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
                <span class="metric-value">{{ card.throughput }} <em>token/s</em></span>
              </div>
              <div class="metric-item">
                <span class="metric-label">首 token 延迟</span>
                <span class="metric-value">{{ card.latency }} <em>s</em></span>
              </div>
              <div class="metric-item">
                <span class="metric-label">GPU 显存</span>
                <span class="metric-value">{{ card.gpuMemory }} <em>G</em></span>
              </div>
            </div>

            <div class="token-stream">
              <div
                v-for="(token, idx) in card.tokens"
                :key="`${card.key}-${idx}`"
                class="token-item"
              >
                <span class="token-text">{{ token }}</span>
                <span class="token-latency">{{ card.tokenLatency[idx] }}s</span>
              </div>
            </div>

            <div class="avg-block">
              <div><b>Average Throughput:</b> {{ card.avgThroughput }} token/s</div>
              <div><b>Average Latency:</b> {{ card.avgLatency }} s</div>
              <div><b>Average GPU memory:</b> {{ card.avgGpuMemory }} G</div>
            </div>
          </article>
        </div>
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
import { computed, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute } from 'vue-router'
import {
  deleteBizInferenceTask,
  getBizInferenceRank,
  getBizInferenceTaskList,
  getRealtimeVisualization
} from '@/api/biz/biz_inference_task'

const route = useRoute()
const currentMenuTitle = computed(() => String(route.meta?.title || ''))

const isHistoryOnly = computed(() => currentMenuTitle.value.includes('推理任务记录'))
const isRankOnly = computed(() => currentMenuTitle.value.includes('推理排行榜'))
const isRealtimeOnly = computed(() => !isHistoryOnly.value && !isRankOnly.value)

const defaultModelOptions = [
  { label: 'Qwen2.5-VL-7B-Instruct', value: 'qwen2.5-vl-7b-instruct' },
  { label: 'Qwen2.5-VL-3B-Instruct', value: 'qwen2.5-vl-3b-instruct' },
  { label: 'LLaVA-1.6-7B', value: 'llava-1.6-7b' }
]

const defaultCaseOptions = [
  { label: '动物识别', value: 'animal-recognition' },
  { label: '交通场景理解', value: 'traffic-understanding' },
  { label: '图表解读', value: 'chart-reading' }
]

const defaultAccelerationOptions = [
  { label: 'unquantized', value: 'unquantized' },
  { label: 'bnb-4bit', value: 'bnb-4bit' },
  { label: 'bnb-8bit', value: 'bnb-8bit' }
]

const rankMetricOptions = [
  { label: '吞吐量', value: 'throughput' },
  { label: '单token延迟', value: 'latency' },
  { label: '显存占用', value: 'gpuMemory' },
  { label: '执行时间', value: 'executionTime' }
]

const mockCaseDataMap = {
  'animal-recognition': {
    serial: 10,
    prompt: '描述下图片中的场景',
    image: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=180&h=96&q=80',
    progress: { current: 10, total: 181 },
    algorithms: {
      unquantized: {
        title: 'Unquantized',
        throughput: 132,
        latency: 0.0031,
        gpuMemory: 15.36,
        tokens: ['这', '幅', '图', '片', '...'],
        tokenLatency: [0.0028, 0.0018, 0.0041, 0.0042, '---'],
        avgThroughput: 141,
        avgLatency: 0.0028,
        avgGpuMemory: 15.35
      },
      'bnb-4bit': {
        title: 'Bnb-4bit',
        throughput: 280,
        latency: 0.0004,
        gpuMemory: 4.32,
        tokens: ['这', '幅', '图', '片', '...'],
        tokenLatency: [0.0001, 0.0002, 0.0005, 0.0005, '---'],
        avgThroughput: 301,
        avgLatency: 0.0005,
        avgGpuMemory: 4.32
      },
      'bnb-8bit': {
        title: 'Bnb-8bit',
        throughput: 199,
        latency: 0.0012,
        gpuMemory: 8.54,
        tokens: ['这', '幅', '图', '片', '...'],
        tokenLatency: [0.0005, 0.0008, 0.0013, 0.0013, '---'],
        avgThroughput: 200,
        avgLatency: 0.0011,
        avgGpuMemory: 8.54
      }
    }
  },
  'traffic-understanding': {
    serial: 11,
    prompt: '请判断当前路口的交通状态并给出建议',
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=180&h=96&q=80',
    progress: { current: 32, total: 181 },
    algorithms: {
      unquantized: {
        title: 'Unquantized',
        throughput: 126,
        latency: 0.0034,
        gpuMemory: 15.4,
        tokens: ['路', '口', '车', '流', '...'],
        tokenLatency: [0.003, 0.002, 0.0038, 0.0041, '---'],
        avgThroughput: 138,
        avgLatency: 0.003,
        avgGpuMemory: 15.39
      },
      'bnb-4bit': {
        title: 'Bnb-4bit',
        throughput: 271,
        latency: 0.0005,
        gpuMemory: 4.33,
        tokens: ['路', '口', '车', '流', '...'],
        tokenLatency: [0.0002, 0.0002, 0.0006, 0.0006, '---'],
        avgThroughput: 294,
        avgLatency: 0.0005,
        avgGpuMemory: 4.32
      },
      'bnb-8bit': {
        title: 'Bnb-8bit',
        throughput: 191,
        latency: 0.0013,
        gpuMemory: 8.57,
        tokens: ['路', '口', '车', '流', '...'],
        tokenLatency: [0.0007, 0.001, 0.0015, 0.0014, '---'],
        avgThroughput: 194,
        avgLatency: 0.0012,
        avgGpuMemory: 8.56
      }
    }
  },
  'chart-reading': {
    serial: 12,
    prompt: '请总结图表中的核心趋势',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=180&h=96&q=80',
    progress: { current: 67, total: 181 },
    algorithms: {
      unquantized: {
        title: 'Unquantized',
        throughput: 118,
        latency: 0.0038,
        gpuMemory: 15.41,
        tokens: ['从', '图', '中', '可', '...'],
        tokenLatency: [0.0032, 0.0027, 0.0039, 0.0043, '---'],
        avgThroughput: 129,
        avgLatency: 0.0033,
        avgGpuMemory: 15.4
      },
      'bnb-4bit': {
        title: 'Bnb-4bit',
        throughput: 258,
        latency: 0.0006,
        gpuMemory: 4.35,
        tokens: ['从', '图', '中', '可', '...'],
        tokenLatency: [0.0003, 0.0003, 0.0007, 0.0006, '---'],
        avgThroughput: 278,
        avgLatency: 0.0006,
        avgGpuMemory: 4.34
      },
      'bnb-8bit': {
        title: 'Bnb-8bit',
        throughput: 184,
        latency: 0.0014,
        gpuMemory: 8.61,
        tokens: ['从', '图', '中', '可', '...'],
        tokenLatency: [0.0008, 0.0011, 0.0016, 0.0015, '---'],
        avgThroughput: 188,
        avgLatency: 0.0013,
        avgGpuMemory: 8.59
      }
    }
  }
}

const mockRankRows = [
  {
    rank: 1,
    modelName: 'Qwen3-VL-8B-Instruct',
    algorithmName: 'bnb-4bit',
    throughput: '340 token/s',
    latency: '0.0005 s',
    gpuMemory: '5.34 G',
    executionTime: '2025-12-28 16:05:03',
    operatorName: 'YRC'
  },
  {
    rank: 2,
    modelName: 'InternVL3_5-8B',
    algorithmName: 'bnb-4bit',
    throughput: '335 token/s',
    latency: '0.0007 s',
    gpuMemory: '5.21 G',
    executionTime: '2026-01-22 15:04:03',
    operatorName: 'WXF'
  }
]

const mockHistoryRows = [
  {
    id: 'm-1',
    taskHash: '89h8912d',
    modelName: 'Qwen3-VL-8B-Instruct',
    testCase: '动物识别',
    algorithms: ['unquantized', 'bnb-4bit', 'bnb-8bit'],
    executionTime: '2025-12-28 16:05:03',
    operatorName: 'YRC'
  },
  {
    id: 'm-2',
    taskHash: 'e9a79f34x',
    modelName: 'InternVL3_5-8B',
    testCase: '动物识别',
    algorithms: ['unquantized', 'bnb-4bit'],
    executionTime: '2026-01-22 15:04:03',
    operatorName: 'WXF'
  }
]

const modelOptions = ref(defaultModelOptions)
const caseOptions = ref(defaultCaseOptions)
const accelerationOptions = ref(defaultAccelerationOptions)
const realtimeCaseDataMap = ref(mockCaseDataMap)

const selectedModel = ref(defaultModelOptions[0].value)
const selectedCase = ref(defaultCaseOptions[0].value)
const selectedAlgorithms = ref(defaultAccelerationOptions.map((item) => item.value))
const loading = ref(false)
const isExpanded = ref(true)

const rankCase = ref(defaultCaseOptions[0].value)
const rankMetric = ref(rankMetricOptions[0].value)
const rankPage = ref(1)
const rankPageSize = ref(10)
const rankTotal = ref(0)
const rankRows = ref([])
const rankLoading = ref(false)

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

const selectedModelLabel = computed(() => {
  const hit = modelOptions.value.find((item) => item.value === selectedModel.value)
  return hit?.label || '--'
})

const displayTask = computed(() => {
  const dataMap = realtimeCaseDataMap.value || {}
  const fallbackKey = Object.keys(dataMap)[0] || 'animal-recognition'
  return dataMap[selectedCase.value] || dataMap[fallbackKey] || {
    serial: '--',
    prompt: '--',
    image: '',
    progress: { current: 0, total: 0 },
    algorithms: {}
  }
})

const algorithmCards = computed(() => {
  const allAlgorithms = displayTask.value.algorithms || {}
  return selectedAlgorithms.value
    .map((key) => ({ key, ...allAlgorithms[key] }))
    .filter((item) => item.title)
})

const readField = (item, keys, fallback = '--') => {
  for (const key of keys) {
    if (item?.[key] !== undefined && item?.[key] !== null && item?.[key] !== '') {
      return item[key]
    }
  }
  return fallback
}

const toCaseLabel = (caseValue) => {
  const hit = caseOptions.value.find((item) => item.value === caseValue)
  return hit?.label || caseValue || '--'
}

const normalizeAlgorithmList = (value) => {
  if (Array.isArray(value)) return value
  if (!value) return []
  return String(value)
    .split(/[,|/]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const resolvePagePayload = (data, fallbackList = []) => {
  const list = data?.list || data?.records || data?.items || data?.rows || fallbackList
  const total = Number(data?.total || data?.count || data?.all || list.length || 0)
  return {
    list: Array.isArray(list) ? list : fallbackList,
    total
  }
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
  executionTime: readField(item, ['executionTime', 'createdAt', 'created_at']),
  operatorName: readField(item, ['operatorName', 'operator', 'operator_name'], '--'),
  score: buildRankMetricValue(item)
})

const mapHistoryRow = (item) => ({
  id: readField(item, ['ID', 'id', 'taskId'], ''),
  taskHash: readField(item, ['taskHash', 'taskNo', 'taskCode', 'task_hash'], '--'),
  modelName: readField(item, ['modelName', 'model', 'model_name'], '--'),
  testCase: readField(item, ['testCase', 'datasetName', 'caseName', 'dataset_name'], toCaseLabel(historyCase.value)),
  algorithms: normalizeAlgorithmList(readField(item, ['accelerationAlgorithms', 'algorithmName', 'algorithm', 'algorithm_name'], '')),
  executionTime: readField(item, ['executionTime', 'createdAt', 'created_at'], '--'),
  operatorName: readField(item, ['operatorName', 'operator', 'operator_name'], '--')
})

const ensureCaseSelection = () => {
  const allCaseValues = caseOptions.value.map((item) => item.value)
  if (!allCaseValues.includes(selectedCase.value)) {
    selectedCase.value = allCaseValues[0] || ''
  }
  if (!allCaseValues.includes(rankCase.value)) {
    rankCase.value = allCaseValues[0] || ''
  }
  if (!allCaseValues.includes(historyCase.value)) {
    historyCase.value = allCaseValues[0] || ''
  }
}

const applyRealtimePayload = (payload) => {
  if (Array.isArray(payload.modelOptions) && payload.modelOptions.length) {
    modelOptions.value = payload.modelOptions
  }

  if (Array.isArray(payload.caseOptions) && payload.caseOptions.length) {
    caseOptions.value = payload.caseOptions
  }

  if (Array.isArray(payload.accelerationOptions) && payload.accelerationOptions.length) {
    accelerationOptions.value = payload.accelerationOptions
  }

  if (payload.caseDataMap && Object.keys(payload.caseDataMap).length) {
    realtimeCaseDataMap.value = payload.caseDataMap
  } else {
    realtimeCaseDataMap.value = mockCaseDataMap
  }

  ensureCaseSelection()
}

const fetchRealtimeData = async () => {
  loading.value = true
  try {
    const res = await getRealtimeVisualization({
      model: selectedModel.value,
      caseName: selectedCase.value,
      algorithms: selectedAlgorithms.value.join(',')
    })

    if (res?.code === 0 && res?.data) {
      applyRealtimePayload(res.data)
      return
    }

    applyRealtimePayload({})
  } catch (e) {
    applyRealtimePayload({})
  } finally {
    loading.value = false
  }
}

const fetchRankData = async () => {
  rankLoading.value = true
  try {
    const res = await getBizInferenceRank({
      page: rankPage.value,
      pageSize: rankPageSize.value,
      caseName: rankCase.value,
      rankBy: rankMetric.value
    })

    if (res?.code === 0 && res?.data) {
      const { list, total } = resolvePagePayload(res.data, mockRankRows)
      rankRows.value = list.map((item, index) => mapRankRow(item, index))
      rankTotal.value = total
      return
    }

    rankRows.value = mockRankRows
    rankTotal.value = mockRankRows.length
  } catch (e) {
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
      const { list, total } = resolvePagePayload(res.data, mockHistoryRows)
      historyRows.value = list.map((item) => mapHistoryRow(item))
      historyTotal.value = total
      return
    }

    historyRows.value = mockHistoryRows
    historyTotal.value = mockHistoryRows.length
  } catch (e) {
    historyRows.value = mockHistoryRows
    historyTotal.value = mockHistoryRows.length
  } finally {
    historyLoading.value = false
  }
}

const refreshRealtimeData = () => {
  fetchRealtimeData()
}

const refreshRankData = () => {
  rankPage.value = 1
  fetchRankData()
}

const refreshHistoryData = () => {
  historyPage.value = 1
  fetchHistoryData()
}

const viewHistoryRow = (row) => {
  historyDetail.value = {
    taskHash: row.taskHash,
    modelName: row.modelName,
    testCase: row.testCase,
    algorithms: row.algorithms,
    executionTime: row.executionTime,
    operatorName: row.operatorName
  }
  historyDetailVisible.value = true
}

const deleteHistoryRow = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除任务 ${row.taskHash} 吗？`, '删除确认', {
      type: 'warning'
    })

    const targetId = row.id
    if (!targetId || String(targetId).startsWith('m-')) {
      historyRows.value = historyRows.value.filter((item) => item.taskHash !== row.taskHash)
      historyTotal.value = Math.max(0, historyTotal.value - 1)
      ElMessage.success('已删除（本地记录）')
      return
    }

    const res = await deleteBizInferenceTask({ ID: targetId })
    if (res?.code === 0) {
      ElMessage.success('删除成功')
      fetchHistoryData()
      return
    }

    ElMessage.error(res?.msg || '删除失败')
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

watch(
  [isHistoryOnly, isRankOnly],
  ([historyOnly, rankOnly]) => {
    if (historyOnly) {
      fetchHistoryData()
      return
    }

    if (rankOnly) {
      fetchRankData()
      return
    }

    fetchRealtimeData()
  },
  { immediate: true }
)
</script>

<style scoped>
.rt-page {
  --space-8: 8px;
  --space-12: 12px;
  --space-16: 16px;
  --space-24: 24px;
  --bg-page: #f3f6fb;
  --bg-card: #ffffff;
  --text-main: #111827;
  --text-sub: #5b6475;
  --line-soft: #dbe3ef;
  --primary: #3f6fd9;

  background: var(--bg-page);
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
  box-shadow: 0 6px 18px rgba(28, 42, 70, 0.06);
}

.rt-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-16);
}

.rt-title {
  margin: 0;
  font-size: 24px;
  line-height: 1.3;
  color: var(--text-main);
  font-weight: 700;
}

.rt-subtitle {
  margin: var(--space-8) 0 0;
  color: var(--text-sub);
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
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(63, 111, 217, 0.28);
  color: #2f5ed0;
  background: rgba(63, 111, 217, 0.08);
  font-size: 12px;
  font-weight: 600;
}

.tag.muted {
  color: #536078;
  border-color: var(--line-soft);
  background: #f8faff;
}

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
  color: #344155;
  font-size: 13px;
}

.status-section {
  display: grid;
  gap: var(--space-12);
}

.status-actions {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.progress-text {
  font-size: 13px;
  color: #3f6fd9;
  font-weight: 600;
  background: rgba(63, 111, 217, 0.1);
  border-radius: 999px;
  padding: 6px 10px;
}

.fold-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid var(--line-soft);
  color: #5d6a81;
}

.fold-icon {
  display: inline-block;
  font-size: 12px;
  transition: transform 0.2s ease;
}

.fold-icon.collapsed {
  transform: rotate(-90deg);
}

.status-grid {
  display: grid;
  grid-template-columns: 160px minmax(240px, 1fr) 240px;
  gap: var(--space-12);
}

.meta-chip {
  min-height: 72px;
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  background: #f9fbff;
  color: #2f3b4f;
  display: flex;
  align-items: center;
  padding: 0 var(--space-12);
  font-size: 13px;
}

.prompt-chip {
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
  border: 1px solid #d5def0;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-16);
}

.metric-card {
  border: 1px solid var(--line-soft);
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
  padding: var(--space-16);
  display: flex;
  flex-direction: column;
  min-height: 360px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.metric-card:hover {
  border-color: #bfd0f5;
  box-shadow: 0 10px 24px rgba(43, 84, 173, 0.08);
  transform: translateY(-1px);
}

.card-head {
  font-size: 18px;
  color: #1f2c42;
  font-weight: 700;
  margin-bottom: var(--space-12);
}

.metric-main {
  display: grid;
  gap: var(--space-8);
}

.metric-item {
  border: 1px solid #e6edf8;
  background: #f8fbff;
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-12);
}

.metric-item.metric-strong {
  border-color: #c7d7f8;
  background: #eef4ff;
}

.metric-label {
  color: #51607a;
  font-size: 12px;
}

.metric-value {
  color: #1e2b40;
  font-size: 18px;
  font-weight: 700;
}

.metric-value em {
  font-style: normal;
  font-size: 12px;
  color: #66758d;
  margin-left: 3px;
  font-weight: 500;
}

.token-stream {
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: var(--space-8);
  margin-top: var(--space-16);
  padding-top: var(--space-12);
  border-top: 1px dashed #d8e2f3;
}

.token-item {
  width: 54px;
  min-height: 54px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2eaf8;
  border-radius: 10px;
  background: #fff;
  padding: 6px 4px;
}

.token-text {
  font-size: 14px;
  color: #24334b;
}

.token-latency {
  margin-top: 2px;
  color: #7a879c;
  font-size: 10px;
}

.avg-block {
  margin-top: auto;
  padding-top: var(--space-12);
  border-top: 1px solid #e4ebf7;
  display: grid;
  gap: 4px;
  color: #4c5a74;
  font-size: 12px;
  line-height: 1.5;
}

.avg-block b {
  color: #2a374d;
}

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
  border: 1px solid var(--line-soft);
  color: #3a4b66;
  background: #f8faff;
  border-radius: 10px;
  height: 34px;
  padding: 0 14px;
}

.ghost-btn:hover {
  border-color: #bfd0f5;
  color: #2f5ed0;
  background: #f2f6ff;
}

.table-wrap {
  border: 1px solid #e6edf8;
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
  color: #4d5f7c;
  background: #eef3fb;
}

.rank-badge.top-1 {
  color: #784b00;
  background: #fff4d8;
}

.rank-badge.top-2 {
  color: #41556f;
  background: #eef2f7;
}

.rank-badge.top-3 {
  color: #7a4b2a;
  background: #f9efe7;
}

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

:deep(.el-select__wrapper) {
  border-radius: 10px;
  min-height: 38px;
}

:deep(.el-checkbox__inner) {
  border-radius: 4px;
}

:deep(.el-button.is-text:hover) {
  background: #f2f6ff;
}

:deep(.el-table th.el-table__cell) {
  background: #f6f9ff;
  color: #44516a;
  font-size: 12px;
  font-weight: 600;
}

:deep(.el-table td.el-table__cell) {
  color: #223149;
}

:deep(.history-detail-dialog .el-dialog__header) {
  margin-right: 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebf0fa;
}

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
}
</style>
