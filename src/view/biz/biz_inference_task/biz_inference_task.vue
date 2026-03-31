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
            <label>样本</label>
            <div class="sample-selector">
              <el-select
                v-model="selectedSampleIndex"
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
              样本 {{ currentSample.index }} / {{ sampleOptions.length }}
            </span>
            <el-select
              v-model="selectedSampleIndex"
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
              :disabled="isStreaming || !selectedAlgorithms.length"
              @click="startStreaming"
            >
              <span v-if="isStreaming" class="run-dot" />
              {{ isStreaming ? '推理中…' : '开始推理' }}
            </el-button>
          </div>
        </div>

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
            <img class="case-image" :src="currentSample.image" alt="测试图片" />
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
              <template v-if="streamingData.tokens[card.key] && streamingData.tokens[card.key].length">
                <div
                  v-for="(tok, idx) in streamingData.tokens[card.key]"
                  :key="`${card.key}-t-${idx}`"
                  class="token-item"
                >
                  <span class="token-text">{{ tok.char }}</span>
                  <span class="token-latency">{{ tok.latency }}s</span>
                </div>
                <div v-if="streamingData.active[card.key]" class="token-item cursor-item">
                  <span class="stream-cursor">▌</span>
                </div>
              </template>
              <div v-else class="token-placeholder">等待推理…</div>
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
import { computed, reactive, ref, watch, onBeforeUnmount } from 'vue'
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

/* ───────── 常量 & Mock 数据 ───────── */

const defaultModelOptions = [
  { label: 'Qwen2.5-VL-7B-Instruct', value: 'qwen2.5-vl-7b-instruct' },
  { label: 'Qwen2.5-VL-3B-Instruct', value: 'qwen2.5-vl-3b-instruct' },
  { label: 'LLaVA-1.6-7B', value: 'llava-1.6-7b' }
]

const defaultAccelerationOptions = [
  { label: 'unquantized', value: 'unquantized' },
  { label: 'bnb-4bit', value: 'bnb-4bit' },
  { label: 'bnb-8bit', value: 'bnb-8bit' }
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

const mockSamples = [
  {
    index: 1,
    label: '动物识别',
    prompt: '描述下图片中的场景',
    image: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=180&h=96&q=80',
    totalSamples: 181,
    algorithms: {
      unquantized: {
        title: 'Unquantized',
        throughput: 132, latency: 0.0031, gpuMemory: 15.36,
        fullText: '这幅图片展示了一只雄壮的非洲雄狮站在广阔的稀树草原上。它的鬃毛在夕阳的余晖下呈现出绚丽的金棕色光泽，体态健硕而充满力量感。远处可以看到几棵标志性的金合欢树剪影，天空被晚霞染成了温暖的橙红色调，整个画面传递出非洲原野的壮美与宁静。',
        avgThroughput: 141, avgLatency: 0.0028, avgGpuMemory: 15.35
      },
      'bnb-4bit': {
        title: 'Bnb-4bit',
        throughput: 280, latency: 0.0004, gpuMemory: 4.32,
        fullText: '图片中是一只非洲雄狮站在草原上，鬃毛呈金棕色，体态健壮。背景有合欢树和橙色天空，展现出非洲草原的壮丽景象。狮子的目光炯炯有神，似乎正注视着远方的猎物，整体画面充满自然力量。',
        avgThroughput: 301, avgLatency: 0.0005, avgGpuMemory: 4.32
      },
      'bnb-8bit': {
        title: 'Bnb-8bit',
        throughput: 199, latency: 0.0012, gpuMemory: 8.54,
        fullText: '这幅图展示了一只雄伟的非洲雄狮矗立在辽阔的草原上。金色的鬃毛在阳光下闪耀，背景是典型的非洲稀树草原风光。天空呈现暖色调，远处隐约可见散布的灌木丛，构成一幅宁静而壮美的画面。',
        avgThroughput: 200, avgLatency: 0.0011, avgGpuMemory: 8.54
      }
    }
  },
  {
    index: 2,
    label: '交通场景理解',
    prompt: '请判断当前路口的交通状态并给出建议',
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=180&h=96&q=80',
    totalSamples: 181,
    algorithms: {
      unquantized: {
        title: 'Unquantized',
        throughput: 126, latency: 0.0034, gpuMemory: 15.4,
        fullText: '当前路口呈现较为拥堵的交通状态。多条车道上车辆密集排列，部分车辆处于缓行状态。交通信号灯显示为红灯，行人正在斑马线上通行。建议驾驶员保持耐心，遵守交通规则，注意行人安全，避免频繁变道，等待信号灯变化后有序通行。',
        avgThroughput: 138, avgLatency: 0.003, avgGpuMemory: 15.39
      },
      'bnb-4bit': {
        title: 'Bnb-4bit',
        throughput: 271, latency: 0.0005, gpuMemory: 4.33,
        fullText: '路口交通较拥堵，车辆密集排列，信号灯为红灯。行人在斑马线上通行。建议驾驶员遵守交通信号，保持安全距离，等待绿灯后有序通行，注意观察行人和非机动车。',
        avgThroughput: 294, avgLatency: 0.0005, avgGpuMemory: 4.32
      },
      'bnb-8bit': {
        title: 'Bnb-8bit',
        throughput: 191, latency: 0.0013, gpuMemory: 8.57,
        fullText: '当前路口交通较为拥堵，多车道车辆排列密集。红灯亮起时行人正在通行。建议驾驶员保持安全距离，遵守交通规则，等待信号灯变化后有序通过路口，同时关注周围行人及非机动车的动态。',
        avgThroughput: 194, avgLatency: 0.0012, avgGpuMemory: 8.56
      }
    }
  },
  {
    index: 3,
    label: '图表解读',
    prompt: '请总结图表中的核心趋势',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=180&h=96&q=80',
    totalSamples: 181,
    algorithms: {
      unquantized: {
        title: 'Unquantized',
        throughput: 118, latency: 0.0038, gpuMemory: 15.41,
        fullText: '从图表的数据可以看出以下核心趋势：第一，整体指标呈现稳步上升的态势，特别是在第三季度出现了显著加速增长；第二，各产品线之间的差距在逐步缩小，说明资源分配策略正在发挥作用；第三，与去年同期相比，增长率提高了约百分之十五，预计未来将保持此增长势头。',
        avgThroughput: 129, avgLatency: 0.0033, avgGpuMemory: 15.4
      },
      'bnb-4bit': {
        title: 'Bnb-4bit',
        throughput: 258, latency: 0.0006, gpuMemory: 4.35,
        fullText: '图表核心趋势：整体指标稳步上升，第三季度加速增长。各产品线差距缩小，资源分配策略见效。与去年同期相比增长率提高约百分之十五，未来有望保持增长势头。',
        avgThroughput: 278, avgLatency: 0.0006, avgGpuMemory: 4.34
      },
      'bnb-8bit': {
        title: 'Bnb-8bit',
        throughput: 184, latency: 0.0014, gpuMemory: 8.61,
        fullText: '从图表可以观察到几个核心趋势：指标整体呈上升态势，第三季度增长尤为显著；各产品线之间的差距正在逐步缩小；与去年同期对比，增长率提升约百分之十五，表明当前策略效果良好，未来增长可期。',
        avgThroughput: 188, avgLatency: 0.0013, avgGpuMemory: 8.59
      }
    }
  },
  {
    index: 4,
    label: '医学影像分析',
    prompt: '请分析该医学影像中的异常区域',
    image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=180&h=96&q=80',
    totalSamples: 181,
    algorithms: {
      unquantized: {
        title: 'Unquantized',
        throughput: 121, latency: 0.0036, gpuMemory: 15.38,
        fullText: '该医学影像中可以观察到以下异常区域：在图像的左上象限存在一个边界较为清晰的高密度阴影区域，直径约为两厘米。该区域的信号强度明显高于周围正常组织，提示可能存在占位性病变。建议进一步结合临床症状及病史进行综合分析，并考虑进行增强扫描以明确病变性质。',
        avgThroughput: 134, avgLatency: 0.0031, avgGpuMemory: 15.37
      },
      'bnb-4bit': {
        title: 'Bnb-4bit',
        throughput: 265, latency: 0.0005, gpuMemory: 4.34,
        fullText: '影像左上象限可见一高密度阴影区域，直径约两厘米，边界较清晰，信号强度高于周围组织，提示可能存在占位病变。建议结合临床病史分析，可考虑增强扫描以进一步明确。',
        avgThroughput: 288, avgLatency: 0.0005, avgGpuMemory: 4.33
      },
      'bnb-8bit': {
        title: 'Bnb-8bit',
        throughput: 187, latency: 0.0013, gpuMemory: 8.55,
        fullText: '该影像左上象限可观察到一个边界较清晰的高密度阴影，直径约两厘米，信号强度明显高于周围正常组织。这一表现提示可能存在占位性病变，建议进行增强扫描以进一步确认，并结合患者临床信息综合判断。',
        avgThroughput: 192, avgLatency: 0.0012, avgGpuMemory: 8.54
      }
    }
  },
  {
    index: 5,
    label: '建筑风格识别',
    prompt: '请识别图片中建筑的风格特征',
    image: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=180&h=96&q=80',
    totalSamples: 181,
    algorithms: {
      unquantized: {
        title: 'Unquantized',
        throughput: 125, latency: 0.0033, gpuMemory: 15.39,
        fullText: '图片中展示的建筑属于典型的哥特式建筑风格，具有以下显著特征：高耸的尖顶塔楼直指天空，彩色玻璃花窗镶嵌在精美的石框之中，飞扶壁从建筑侧面向外延伸以分散墙体承受的压力。整体建筑线条纤细垂直，营造出一种庄严肃穆、向上升腾的视觉效果，是中世纪欧洲教堂建筑的经典范例。',
        avgThroughput: 137, avgLatency: 0.0029, avgGpuMemory: 15.38
      },
      'bnb-4bit': {
        title: 'Bnb-4bit',
        throughput: 273, latency: 0.0004, gpuMemory: 4.31,
        fullText: '这是哥特式建筑风格，特征包括高耸尖顶、彩色玻璃花窗和飞扶壁。建筑线条纤细垂直，营造庄严向上的视觉效果，是中世纪欧洲教堂的典型代表。石材雕刻精细，展示了当时高超的建筑工艺。',
        avgThroughput: 296, avgLatency: 0.0005, avgGpuMemory: 4.31
      },
      'bnb-8bit': {
        title: 'Bnb-8bit',
        throughput: 193, latency: 0.0012, gpuMemory: 8.52,
        fullText: '图片中的建筑为典型的哥特式风格，主要特征有尖顶塔楼、彩色玻璃花窗以及飞扶壁结构。建筑整体呈现纤细垂直的线条美感，给人以庄严肃穆的感受。这类建筑是中世纪欧洲教堂建筑的经典代表作品。',
        avgThroughput: 197, avgLatency: 0.0011, avgGpuMemory: 8.52
      }
    }
  }
]

const mockRankRows = [
  { rank: 1, modelName: 'Qwen3-VL-8B-Instruct', algorithmName: 'bnb-4bit', throughput: '340 token/s', latency: '0.0005 s', gpuMemory: '5.34 G', executionTime: '2025-12-28 16:05:03', operatorName: 'YRC' },
  { rank: 2, modelName: 'InternVL3_5-8B', algorithmName: 'bnb-4bit', throughput: '335 token/s', latency: '0.0007 s', gpuMemory: '5.21 G', executionTime: '2026-01-22 15:04:03', operatorName: 'WXF' }
]

const mockHistoryRows = [
  { id: 'm-1', taskHash: '89h8912d', modelName: 'Qwen3-VL-8B-Instruct', testCase: '动物识别', algorithms: ['unquantized', 'bnb-4bit', 'bnb-8bit'], executionTime: '2025-12-28 16:05:03', operatorName: 'YRC' },
  { id: 'm-2', taskHash: 'e9a79f34x', modelName: 'InternVL3_5-8B', testCase: '动物识别', algorithms: ['unquantized', 'bnb-4bit'], executionTime: '2026-01-22 15:04:03', operatorName: 'WXF' }
]

/* ───────── 实时推理 state ───────── */

const modelOptions = ref(defaultModelOptions)
const accelerationOptions = ref(defaultAccelerationOptions)
const caseOptions = ref(defaultCaseOptions)

const selectedModel = ref(defaultModelOptions[0].value)
const selectedAlgorithms = ref(defaultAccelerationOptions.map((i) => i.value))
const loading = ref(false)

const selectedSampleIndex = ref(1)
const sampleIndexInput = ref('')

const sampleOptions = computed(() =>
  mockSamples.map((s) => ({
    label: `#${s.index} ${s.label}`,
    value: s.index
  }))
)

const currentSample = computed(() =>
  mockSamples.find((s) => s.index === selectedSampleIndex.value) || mockSamples[0]
)

const selectedModelLabel = computed(() => {
  const hit = modelOptions.value.find((i) => i.value === selectedModel.value)
  return hit?.label || '--'
})

const algorithmCards = computed(() => {
  const allAlgorithms = currentSample.value.algorithms || {}
  const selected = new Set(selectedAlgorithms.value)
  return accelerationOptions.value
    .filter((opt) => selected.has(opt.value))
    .map((opt) => ({ key: opt.value, ...allAlgorithms[opt.value] }))
    .filter((item) => item.title)
})

/* ───────── 流式输出 ───────── */

const streamingData = reactive({ tokens: {}, active: {} })
const isStreaming = ref(false)
let streamTimerIds = []

const startStreaming = () => {
  stopStreaming()
  isStreaming.value = true

  const allAlgorithms = currentSample.value.algorithms || {}

  selectedAlgorithms.value.forEach((key) => {
    const algo = allAlgorithms[key]
    if (!algo?.fullText) return

    const chars = [...algo.fullText]
    streamingData.tokens[key] = []
    streamingData.active[key] = true
    let idx = 0

    // 根据算法类型生成合理的延迟范围
    const latencyRange = key === 'bnb-4bit'
      ? [0.0001, 0.0007]
      : key === 'bnb-8bit'
        ? [0.0005, 0.0016]
        : [0.002, 0.005]

    const streamNext = () => {
      if (idx < chars.length) {
        const charLatency = +(latencyRange[0] + Math.random() * (latencyRange[1] - latencyRange[0])).toFixed(4)
        streamingData.tokens[key].push({ char: chars[idx], latency: charLatency })
        idx++
        const delay = 35 + Math.random() * 55
        const tid = setTimeout(streamNext, delay)
        streamTimerIds.push(tid)
      } else {
        streamingData.active[key] = false
        const allDone = selectedAlgorithms.value.every((k) => !streamingData.active[k])
        if (allDone) isStreaming.value = false
      }
    }

    const tid = setTimeout(streamNext, 100 + Math.random() * 150)
    streamTimerIds.push(tid)
  })
}

const stopStreaming = () => {
  streamTimerIds.forEach((id) => clearTimeout(id))
  streamTimerIds = []
  selectedAlgorithms.value.forEach((k) => {
    streamingData.active[k] = false
  })
  isStreaming.value = false
}

const resetStreamingState = () => {
  stopStreaming()
  Object.keys(streamingData.tokens).forEach((k) => {
    streamingData.tokens[k] = []
  })
}

/* ───────── 样本选择 ───────── */

const onSampleChange = () => {
  resetStreamingState()
}

const jumpToSample = () => {
  const idx = parseInt(sampleIndexInput.value, 10)
  if (isNaN(idx)) {
    ElMessage.warning('请输入有效的样本序号')
    return
  }
  const exists = mockSamples.find((s) => s.index === idx)
  if (!exists) {
    ElMessage.warning(`样本序号 ${idx} 不存在，可选范围 1 ~ ${mockSamples.length}`)
    return
  }
  selectedSampleIndex.value = idx
  sampleIndexInput.value = ''
  resetStreamingState()
}

const onParamChange = () => {
  resetStreamingState()
  fetchRealtimeData()
}

const onAlgorithmChange = () => {
  // 切换算法不重置推理状态，已有的输出保留
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

/* ───────── API 调用 ───────── */

const applyRealtimePayload = (payload) => {
  if (Array.isArray(payload.modelOptions) && payload.modelOptions.length) {
    modelOptions.value = payload.modelOptions
  }
  if (Array.isArray(payload.accelerationOptions) && payload.accelerationOptions.length) {
    accelerationOptions.value = payload.accelerationOptions
  }
}

const fetchRealtimeData = async () => {
  loading.value = true
  try {
    const res = await getRealtimeVisualization({
      model: selectedModel.value,
      caseName: selectedSampleIndex.value,
      algorithms: selectedAlgorithms.value.join(',')
    })
    if (res?.code === 0 && res?.data) {
      applyRealtimePayload(res.data)
      return
    }
    applyRealtimePayload({})
  } catch (_e) {
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
      const { list, total } = resolvePagePayload(res.data, mockHistoryRows)
      historyRows.value = list.map((item) => mapHistoryRow(item))
      historyTotal.value = total
      return
    }
    historyRows.value = mockHistoryRows
    historyTotal.value = mockHistoryRows.length
  } catch (_e) {
    historyRows.value = mockHistoryRows
    historyTotal.value = mockHistoryRows.length
  } finally {
    historyLoading.value = false
  }
}

const refreshRankData = () => { rankPage.value = 1; fetchRankData() }
const refreshHistoryData = () => { historyPage.value = 1; fetchHistoryData() }

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
    await ElMessageBox.confirm(`确认删除任务 ${row.taskHash} 吗？`, '删除确认', { type: 'warning' })
    const targetId = row.id
    if (!targetId || String(targetId).startsWith('m-')) {
      historyRows.value = historyRows.value.filter((i) => i.taskHash !== row.taskHash)
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
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('删除失败')
  }
}

/* ───────── 生命周期 ───────── */

watch(
  [isHistoryOnly, isRankOnly],
  ([historyOnly, rankOnly]) => {
    if (historyOnly) { fetchHistoryData(); return }
    if (rankOnly) { fetchRankData(); return }
    fetchRealtimeData()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  stopStreaming()
})
</script>

<style scoped>
.rt-page {
  --space-8: 8px;
  --space-12: 12px;
  --space-16: 16px;
  --space-24: 24px;
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
  color: #dde8ff;
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
  background: rgba(77, 135, 255, 0.2);
  filter: blur(50px);
  pointer-events: none;
}

.rt-title {
  margin: 0;
  font-size: 24px;
  line-height: 1.3;
  color: #f3f7ff;
  font-weight: 700;
}

.rt-subtitle {
  margin: var(--space-8) 0 0;
  color: rgba(214, 227, 255, 0.8);
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
  border: 1px solid rgba(112, 155, 255, 0.45);
  color: #bfd4ff;
  background: rgba(77, 135, 255, 0.18);
  font-size: 12px;
  font-weight: 600;
  backdrop-filter: blur(4px);
}

.tag.muted {
  color: rgba(204, 222, 255, 0.78);
  border-color: rgba(150, 182, 232, 0.36);
  background: rgba(96, 130, 190, 0.2);
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
  color: #b8c8e5;
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
  background: #132a4d;
  color: #d7e4fb;
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
  background: linear-gradient(180deg, #0f213f 0%, #112a4f 100%);
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
  background: #132a4d;
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-12);
}

.metric-item.metric-strong {
  border-color: rgba(77, 135, 255, 0.36);
  background: rgba(77, 135, 255, 0.18);
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
  color: #9eb1d5;
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
  border: 1px solid var(--line-soft);
  border-radius: 10px;
  background: #122542;
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
  color: #9ab0d4;
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
  color: #8ea3c8;
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
  border: 1px solid var(--line-soft);
  color: var(--text-sub);
  background: var(--primary-light);
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
  color: #bfd2f9;
  background: #1a335c;
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
  background: #0b1933;
  box-shadow: inset 0 0 0 1px var(--line-soft);
}

:deep(.el-checkbox__inner) {
  border-radius: 4px;
}

:deep(.el-button.is-text:hover) {
  background: var(--primary-light);
}

:deep(.el-table th.el-table__cell) {
  background: #112546;
  color: #d5e3fd;
  font-size: 12px;
  font-weight: 600;
}

:deep(.el-table td.el-table__cell) {
  color: var(--text-main);
  background: var(--bg-card);
}

:deep(.el-table tr:hover > td.el-table__cell) {
  background: #14294d;
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
