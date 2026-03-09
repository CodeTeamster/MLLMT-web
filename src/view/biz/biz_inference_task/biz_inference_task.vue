<template>
  <div>
    <div class="gva-search-box">
      <el-form ref="elSearchFormRef" :inline="true" :model="searchInfo" class="demo-form-inline"
        @keyup.enter="onSubmit">
        <el-form-item label="创建日期" prop="createdAtRange">
          <template #label>
            <span>
              创建日期
              <el-tooltip content="搜索范围是开始日期（包含）至结束日期（不包含）">
                <el-icon>
                  <QuestionFilled />
                </el-icon>
              </el-tooltip>
            </span>
          </template>

          <el-date-picker v-model="searchInfo.createdAtRange" class="!w-380px" type="datetimerange" range-separator="至"
            start-placeholder="开始时间" end-placeholder="结束时间" />
        </el-form-item>


        <template v-if="showAllQuery">
          <!-- 将需要控制显示状态的查询条件添加到此范围内 -->
        </template>

        <el-form-item>
          <el-button type="primary" icon="search" @click="onSubmit">查询</el-button>
          <el-button icon="refresh" @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="gva-table-box">
      <div class="gva-btn-list">
        <!-- <el-button type="primary" icon="plus" @click="openDialog()">新增</el-button> -->
        <el-button icon="delete" style="margin-left: 10px;" :disabled="!multipleSelection.length"
          @click="onDelete">删除</el-button>

      </div>
      <el-table ref="multipleTable" style="width: 100%" tooltip-effect="dark" :data="tableData" row-key="taskHash"
        @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />

        <el-table-column align="left" label="任务编号" prop="taskHash" width="120" show-overflow-tooltip />

        <el-table-column align="left" label="模型" prop="modelName" width="200" />

        <el-table-column align="left" label="算法" prop="algorithmName" width="150">
          <template #default="scope">
            <div>
              <!-- 将 algorithmName 按逗号分隔，并逐行显示 -->
              <div v-for="(name, index) in scope.row.algorithmName.split(',')" :key="index">
                {{ name }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column align="left" label="数据集" prop="datasetName" width="120" />

        <el-table-column align="left" label="执行人" prop="operatorName" width="90" />

        <el-table-column sortable align="left" label="日期" prop="CreatedAt" width="180">
          <template #default="scope">{{ formatDate(scope.row.CreatedAt) }}</template>
        </el-table-column>

        <el-table-column align="left" label="操作" fixed="right" :min-width="appStore.operateMinWith">
          <template #default="scope">
            <el-button type="primary" link class="table-button" icon="View" @click="getDetails(scope.row)">详情</el-button>
            <el-button type="primary" link icon="delete" @click="deleteRow(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="gva-pagination">
        <el-pagination layout="total, sizes, prev, pager, next, jumper" :current-page="page" :page-size="pageSize"
          :page-sizes="[10, 30, 50, 100]" :total="total" @current-change="handleCurrentChange"
          @size-change="handleSizeChange" />
      </div>
    </div>

    <!-- TODO: 将详情内容替换为具体每条样本的推理记录 -->
    <el-drawer destroy-on-close :size="appStore.drawerSize" v-model="detailShow" :show-close="true"
      :before-close="closeDetailShow" title="详情">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="模型名称">
          {{ detailForm.modelName }}
        </el-descriptions-item>
        <el-descriptions-item label="模型Id">
          {{ detailForm.modelId }}
        </el-descriptions-item>
        <el-descriptions-item label="算法名称">
          {{ detailForm.algorithmName }}
        </el-descriptions-item>
        <el-descriptions-item label="算法Id">
          {{ detailForm.algorithmId }}
        </el-descriptions-item>
        <el-descriptions-item label="模型类型">
          {{ detailForm.modelType }}
        </el-descriptions-item>
        <el-descriptions-item label="数据集名称">
          {{ detailForm.datasetName }}
        </el-descriptions-item>
        <el-descriptions-item label="数据集Id">
          {{ detailForm.datasetId }}
        </el-descriptions-item>
        <el-descriptions-item label="任务唯一编号">
          {{ detailForm.taskHash }}
        </el-descriptions-item>
        <el-descriptions-item label="平均吞吐量">
          {{ detailForm.averageThroughput }}
        </el-descriptions-item>
        <el-descriptions-item label="平均生成延迟">
          {{ detailForm.averageLatency }}
        </el-descriptions-item>
        <el-descriptions-item label="平均GPU显存占用">
          {{ detailForm.averageGpuMemory }}
        </el-descriptions-item>
        <el-descriptions-item label="执行人用户名">
          {{ detailForm.operatorName }}
        </el-descriptions-item>
        <el-descriptions-item label="执行人Id">
          {{ detailForm.operatorId }}
        </el-descriptions-item>
      </el-descriptions>
    </el-drawer>

  </div>
</template>

<script setup>
import {
  createBizInferenceTask,
  deleteBizInferenceTask,
  deleteBizInferenceTaskByIds,
  updateBizInferenceTask,
  findBizInferenceTask,
  getBizInferenceTaskList
} from '@/api/biz/biz_inference_task'

// 全量引入格式化工具 请按需保留
import { getDictFunc, formatDate, formatBoolean, filterDict, filterDataSource, returnArrImg, onDownloadFile } from '@/utils/format'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ref, reactive } from 'vue'
import { useAppStore } from "@/pinia"




defineOptions({
  name: 'BizInferenceTask'
})

// 提交按钮loading
const btnLoading = ref(false)
const appStore = useAppStore()

// 控制更多查询条件显示/隐藏状态
const showAllQuery = ref(false)

// 自动化生成的字典（可能为空）以及字段
const formData = ref({
  modelName: '',
  modelId: undefined,
  algorithmName: '',
  algorithmId: undefined,
  modelType: undefined,
  datasetName: '',
  datasetId: undefined,
  taskHash: '',
  averageThroughput: 0,
  averageLatency: 0,
  averageGpuMemory: 0,
  operatorName: '',
  operatorId: undefined,
})

// 验证规则
const rule = reactive({
  modelName: [{
    required: true,
    message: '',
    trigger: ['input', 'blur'],
  },
  {
    whitespace: true,
    message: '不能只输入空格',
    trigger: ['input', 'blur'],
  }
  ],
  modelId: [{
    required: true,
    message: '',
    trigger: ['input', 'blur'],
  },
  ],
  algorithmName: [{
    required: true,
    message: '',
    trigger: ['input', 'blur'],
  },
  {
    whitespace: true,
    message: '不能只输入空格',
    trigger: ['input', 'blur'],
  }
  ],
  algorithmId: [{
    required: true,
    message: '',
    trigger: ['input', 'blur'],
  },
  ],
  modelType: [{
    required: true,
    message: '',
    trigger: ['input', 'blur'],
  },
  ],
  datasetName: [{
    required: true,
    message: '',
    trigger: ['input', 'blur'],
  },
  {
    whitespace: true,
    message: '不能只输入空格',
    trigger: ['input', 'blur'],
  }
  ],
  datasetId: [{
    required: true,
    message: '',
    trigger: ['input', 'blur'],
  },
  ],
  taskHash: [{
    required: true,
    message: '',
    trigger: ['input', 'blur'],
  },
  {
    whitespace: true,
    message: '不能只输入空格',
    trigger: ['input', 'blur'],
  }
  ],
  averageThroughput: [{
    required: true,
    message: '',
    trigger: ['input', 'blur'],
  },
  ],
  averageLatency: [{
    required: true,
    message: '',
    trigger: ['input', 'blur'],
  },
  ],
  averageGpuMemory: [{
    required: true,
    message: '',
    trigger: ['input', 'blur'],
  },
  ],
  operatorName: [{
    required: true,
    message: '',
    trigger: ['input', 'blur'],
  },
  {
    whitespace: true,
    message: '不能只输入空格',
    trigger: ['input', 'blur'],
  }
  ],
  operatorId: [{
    required: true,
    message: '',
    trigger: ['input', 'blur'],
  },
  ],
})

const elFormRef = ref()
const elSearchFormRef = ref()

// =========== 表格控制部分 ===========
const page = ref(1)
const total = ref(0)
const pageSize = ref(10)
const tableData = ref([])
const searchInfo = ref({})
// 重置
const onReset = () => {
  searchInfo.value = {}
  getTableData()
}

// 搜索
const onSubmit = () => {
  elSearchFormRef.value?.validate(async (valid) => {
    if (!valid) return
    page.value = 1
    getTableData()
  })
}

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val
  getTableData()
}

// 修改页面容量
const handleCurrentChange = (val) => {
  page.value = val
  getTableData()
}

// 查询
const getTableData = async () => {
  const table = await getBizInferenceTaskList({ page: page.value, pageSize: pageSize.value, ...searchInfo.value })
  if (table.code === 0) {
    tableData.value = table.data.list
    total.value = table.data.total
    page.value = table.data.page
    pageSize.value = table.data.pageSize
  }
}

getTableData()

// ============== 表格控制部分结束 ===============

// 获取需要的字典 可能为空 按需保留
const setOptions = async () => {
}

// 获取需要的字典 可能为空 按需保留
setOptions()


// 多选数据
const multipleSelection = ref([])
// 多选
const handleSelectionChange = (val) => {
  multipleSelection.value = val
}

// 删除行
const deleteRow = (row) => {
  ElMessageBox.confirm('确定要删除吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    deleteBizInferenceTaskFunc(row)
  })
}

// 多选删除
const onDelete = async () => {
  ElMessageBox.confirm('确定要删除吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    const IDs = []
    if (multipleSelection.value.length === 0) {
      ElMessage({
        type: 'warning',
        message: '请选择要删除的数据'
      })
      return
    }
    multipleSelection.value &&
      multipleSelection.value.map(item => {
        IDs.push(item.taskHash)
      })
    const res = await deleteBizInferenceTaskByIds({ IDs })
    if (res.code === 0) {
      ElMessage({
        type: 'success',
        message: '删除成功'
      })
      if (tableData.value.length === IDs.length && page.value > 1) {
        page.value--
      }
      getTableData()
    }
  })
}

// 行为控制标记（弹窗内部需要增还是改）
const type = ref('')

// 更新行
const updateBizInferenceTaskFunc = async (row) => {
  const res = await findBizInferenceTask({ ID: row.ID })
  type.value = 'update'
  if (res.code === 0) {
    formData.value = res.data
    dialogFormVisible.value = true
  }
}

// 删除行
const deleteBizInferenceTaskFunc = async (row) => {
  const res = await deleteBizInferenceTask({ ID: row.taskHash })
  if (res.code === 0) {
    ElMessage({
      type: 'success',
      message: '删除成功'
    })
    if (tableData.value.length === 1 && page.value > 1) {
      page.value--
    }
    getTableData()
  }
}

// 弹窗控制标记
const dialogFormVisible = ref(false)

// 打开弹窗
const openDialog = () => {
  type.value = 'create'
  dialogFormVisible.value = true
}

// 关闭弹窗
const closeDialog = () => {
  dialogFormVisible.value = false
  formData.value = {
    modelName: '',
    modelId: undefined,
    algorithmName: '',
    algorithmId: undefined,
    modelType: undefined,
    datasetName: '',
    datasetId: undefined,
    taskHash: '',
    averageThroughput: 0,
    averageLatency: 0,
    averageGpuMemory: 0,
    operatorName: '',
    operatorId: undefined,
  }
}

// 弹窗确定
const enterDialog = async () => {
  btnLoading.value = true
  elFormRef.value?.validate(async (valid) => {
    if (!valid) return btnLoading.value = false
    let res
    switch (type.value) {
      case 'create':
        res = await createBizInferenceTask(formData.value)
        break
      case 'update':
        res = await updateBizInferenceTask(formData.value)
        break
      default:
        res = await createBizInferenceTask(formData.value)
        break
    }
    btnLoading.value = false
    if (res.code === 0) {
      ElMessage({
        type: 'success',
        message: '创建/更改成功'
      })
      closeDialog()
      getTableData()
    }
  })
}

const detailForm = ref({})

// 查看详情控制标记
const detailShow = ref(false)

// 打开详情弹窗
const openDetailShow = () => {
  detailShow.value = true
}

// 打开详情
const getDetails = async (row) => {
  // 打开弹窗
  const res = await findBizInferenceTask({ ID: row.ID })
  if (res.code === 0) {
    detailForm.value = res.data
    openDetailShow()
  }
}

// 关闭详情弹窗
const closeDetailShow = () => {
  detailShow.value = false
  detailForm.value = {}
}
</script>

<style></style>
