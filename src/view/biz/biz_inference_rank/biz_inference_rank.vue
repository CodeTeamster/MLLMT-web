<template>
  <div class="rank-page" v-loading="rankLoading">
    <div class="rank-hero">
      <div>
        <p class="rank-hero-eyebrow">Leaderboard</p>
        <h2 class="rank-hero-title">推理排行榜</h2>
        <p class="rank-hero-desc">按不同指标维度对比模型推理性能，发现最优方案。</p>
      </div>
      <div class="rank-hero-metrics">
        <span>性能排名</span>
        <span>多维对比</span>
        <span>实时更新</span>
      </div>
    </div>

    <div class="rank-panel">
      <div class="filter-row">
        <div class="filter-item">
          <label>数据集:</label>
          <el-select
            v-model="rankCase"
            class="filter-select"
            placeholder="请选择数据集"
          >
            <el-option
              v-for="item in caseOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>

        <div class="filter-item">
          <label>榜单:</label>
          <el-select
            v-model="rankMetric"
            class="filter-select"
            placeholder="请选择榜单类型"
          >
            <el-option
              v-for="item in rankMetricOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>

        <div class="action-row">
          <el-button type="primary" class="query-btn" @click="handleSearch">查询</el-button>
          <el-button class="reset-btn" @click="handleReset">重置</el-button>
        </div>
      </div>

      <div class="table-shell">
        <el-table :data="rankRows" stripe>
          <el-table-column prop="rank" label="排名" width="64" align="center" />
          <el-table-column prop="modelName" label="模型" min-width="210" show-overflow-tooltip />
          <el-table-column prop="algorithmName" label="算法" min-width="120" />
          <el-table-column prop="throughput" label="吞吐量 (tokens/sec)" min-width="170" />
          <el-table-column prop="latency" label="延迟 (ms)" min-width="120" />
          <el-table-column prop="gpuMemory" label="显存占用 (GB)" min-width="130" />
          <el-table-column prop="operatorName" label="执行人" min-width="90" />
          <el-table-column prop="executionTime" label="日期" min-width="170" sortable />
        </el-table>
      </div>

      <div class="pager-row">
        <el-pagination
          v-model:current-page="rankPage"
          v-model:page-size="rankPageSize"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="rankTotal"
          @current-change="fetchRankData"
          @size-change="handleSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getBizInferenceRank } from '@/api/biz/biz_inference_task'
import { getBizModelList } from '@/api/biz/biz_model'

defineOptions({
  name: 'BizInferenceRank'
})

const caseOptions = ref([
  { label: '动物识别', value: 'animal-recognition' },
  { label: '交通场景理解', value: 'traffic-understanding' },
  { label: '图表解读', value: 'chart-reading' }
])

const rankMetricOptions = [
  { label: '吞吐量', value: 'throughput' },
  { label: '单token延迟', value: 'latency' },
  { label: '显存占用', value: 'gpuMemory' },
  { label: '执行时间', value: 'executionTime' }
]

const mockRankRows = [
  {
    rank: 1,
    modelName: 'Qwen3-VL-8B-Instruct',
    algorithmName: 'bnb-4bit',
    throughput: '340 token/s',
    latency: '0.0005',
    gpuMemory: '5.34',
    executionTime: '2025-12-28 16:05:03',
    operatorName: 'YRC'
  },
  {
    rank: 2,
    modelName: 'InternVL3_5-8B',
    algorithmName: 'bnb-4bit',
    throughput: '335 token/s',
    latency: '0.0007',
    gpuMemory: '5.21',
    executionTime: '2026-01-22 15:04:03',
    operatorName: 'WXF'
  }
]

const defaultCase = caseOptions.value[0].value
const defaultMetric = rankMetricOptions[0].value

const rankCase = ref(defaultCase)
const rankMetric = ref(defaultMetric)
const rankPage = ref(1)
const rankPageSize = ref(10)
const rankTotal = ref(0)
const rankRows = ref([])
const rankLoading = ref(false)

const readField = (item, keys, fallback = '--') => {
  for (const key of keys) {
    if (item?.[key] !== undefined && item?.[key] !== null && item?.[key] !== '') {
      return item[key]
    }
  }
  return fallback
}

const mapRankRow = (item, index) => ({
  rank: Number(readField(item, ['rank', 'ranking'], index + 1)),
  modelName: readField(item, ['modelName', 'model', 'model_name']),
  algorithmName: readField(item, ['algorithmName', 'algorithm', 'accelerationAlgorithm', 'algorithm_name']),
  throughput: readField(item, ['throughput', 'averageThroughput'], '--'),
  latency: readField(item, ['latency', 'averageLatency'], '--'),
  gpuMemory: readField(item, ['gpuMemory', 'averageGpuMemory'], '--'),
  executionTime: readField(item, ['executionTime', 'createdAt', 'created_at']),
  operatorName: readField(item, ['operatorName', 'operator', 'operator_name'], '--')
})

const resolvePagePayload = (data) => {
  const list = data?.list || data?.records || data?.items || data?.rows || []
  const total = Number(data?.total || data?.count || data?.all || list.length || 0)
  return {
    list: Array.isArray(list) ? list : [],
    total
  }
}

const fetchModelRankFallback = async () => {
  const res = await getBizModelList({
    page: rankPage.value,
    pageSize: rankPageSize.value
  })

  if (res?.code !== 0 || !res?.data) {
    return false
  }

  const { list, total } = resolvePagePayload(res.data)
  if (!list.length) {
    return false
  }

  const offset = (rankPage.value - 1) * rankPageSize.value
  rankRows.value = list.map((item, index) =>
    mapRankRow(
      {
        rank: offset + index + 1,
        modelName: readField(item, ['modelName', 'model', 'model_name']),
        algorithmName: readField(item, ['algorithmName', 'algorithm', 'algorithm_name']),
        operatorName: readField(item, ['creatorName', 'operatorName', 'operator', 'operator_name'], '--'),
        executionTime: readField(item, ['createdAt', 'CreatedAt', 'executionTime', 'created_at'], '--')
      },
      index
    )
  )
  rankTotal.value = total
  return true
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
      const { list, total } = resolvePagePayload(res.data)
      if (list.length) {
        rankRows.value = list.map((item, index) => mapRankRow(item, index))
        rankTotal.value = total
        return
      }

      const loadedFromModel = await fetchModelRankFallback()
      if (loadedFromModel) {
        return
      }
    }

    const loadedFromModel = await fetchModelRankFallback()
    if (loadedFromModel) {
      return
    }

    rankRows.value = mockRankRows
    rankTotal.value = mockRankRows.length
  } catch (e) {
    const loadedFromModel = await fetchModelRankFallback()
    if (loadedFromModel) {
      return
    }

    rankRows.value = mockRankRows
    rankTotal.value = mockRankRows.length
  } finally {
    rankLoading.value = false
  }
}

const handleSearch = () => {
  rankPage.value = 1
  fetchRankData()
}

const handleReset = () => {
  rankCase.value = defaultCase
  rankMetric.value = defaultMetric
  rankPage.value = 1
  rankPageSize.value = 10
  fetchRankData()
}

const handleSizeChange = () => {
  rankPage.value = 1
  fetchRankData()
}

onMounted(() => {
  fetchRankData()
})
</script>

<style scoped>
.rank-page {
  --page-bg: #1f2c46;
  --panel-bg: #0f1d38;
  --line-soft: rgba(108, 141, 198, 0.26);
  --text-main: #e6edfb;
  --text-sub: #9baccc;
  --accent: #4d87ff;
  --accent-border: rgba(108, 141, 198, 0.24);
  min-height: calc(100vh - 120px);
  padding: 16px;
  background: var(--page-bg);
}

/* ── Hero ───────────────────── */
.rank-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px;
  margin-bottom: 16px;
  border: 1px solid var(--accent-border);
  border-radius: 14px;
  background: linear-gradient(135deg, #091830 0%, #10264b 60%, #17396b 100%);
  box-shadow: 0 8px 28px rgba(3, 8, 20, 0.5);
  color: #dde8ff;
  position: relative;
  overflow: hidden;
}

.rank-hero::before {
  content: '';
  position: absolute;
  top: -40%;
  right: -8%;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: rgba(77, 135, 255, 0.2);
  filter: blur(50px);
  pointer-events: none;
}

.rank-hero-eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 1.4px;
  color: rgba(188, 212, 255, 0.9);
  text-transform: uppercase;
}

.rank-hero-title {
  margin: 6px 0 0;
  font-size: 24px;
  color: #f3f7ff;
  font-weight: 700;
  line-height: 1.2;
}

.rank-hero-desc {
  margin: 8px 0 0;
  color: rgba(214, 227, 255, 0.8);
  font-size: 13px;
}

.rank-hero-metrics {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.rank-hero-metrics span {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(112, 155, 255, 0.45);
  color: #bfd4ff;
  font-size: 12px;
  font-weight: 600;
  background: rgba(77, 135, 255, 0.18);
  backdrop-filter: blur(4px);
}

/* ── Panel ──────────────────── */
.rank-panel {
  border: 1px solid var(--line-soft);
  border-radius: 14px;
  background: var(--panel-bg);
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(3, 8, 20, 0.42);
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--line-soft);
  background: var(--panel-bg);
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-item label {
  color: var(--text-main);
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.filter-select {
  width: 180px;
}

.action-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.query-btn,
.reset-btn {
  min-width: 80px;
  height: 34px;
  border-radius: 10px;
}

.table-shell {
  padding: 12px 12px 8px;
}

.pager-row {
  display: flex;
  justify-content: flex-end;
  padding: 0 12px 12px;
}

:deep(.el-select__wrapper) {
  min-height: 34px;
  border-radius: 10px;
  background: #0b1933;
  box-shadow: inset 0 0 0 1px var(--line-soft);
}

:deep(.el-table) {
  border: 1px solid var(--line-soft);
  background: var(--panel-bg);
  border-radius: 12px;
}

:deep(.el-table .el-table__inner-wrapper::before) {
  display: none;
}

:deep(.el-table th.el-table__cell) {
  background: #112546;
  color: #d5e3fd;
  font-weight: 600;
}

:deep(.el-table td.el-table__cell) {
  color: var(--text-main);
  background: var(--panel-bg);
}

:deep(.el-table tr:hover > td.el-table__cell) {
  background: #14294d;
}

@media (max-width: 980px) {
  .filter-row {
    flex-wrap: wrap;
    align-items: flex-end;
  }

  .action-row {
    margin-left: auto;
  }

  .rank-hero {
    flex-direction: column;
  }

  .rank-hero-metrics {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .rank-page {
    padding: 10px;
  }

  .filter-item {
    width: 100%;
  }

  .filter-select {
    width: 100%;
  }

  .action-row {
    width: 100%;
    margin-left: 0;
  }

  .query-btn,
  .reset-btn {
    flex: 1;
  }
}
</style>
