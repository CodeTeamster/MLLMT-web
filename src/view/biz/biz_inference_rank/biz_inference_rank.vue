<template>
  <div>
    <div class="gva-search-box">
      <el-form ref="elSearchFormRef" :inline="true" :model="searchInfo" class="demo-form-inline"
        @keyup.enter="onSubmit">
        <el-form-item label="数据集:" prop="datasetId">
          <el-select
            v-model="searchInfo.datasetId"
            placeholder="请选择数据集"
            :clearable="true"
            @visible-change="onDatasetVisibleChange"
            @change="onDatasetChange"
          >
            <el-option
              v-for="item in datasetOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="榜单:" prop="perfType">
          <el-select
            v-model="searchInfo.perfType"
            placeholder="请选择排序指标"
            :clearable="true"
            @change="onPerfTypeChange"
          >
            <el-option
              v-for="item in perfTypeOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="search" @click="onSubmit">查询</el-button>
          <el-button icon="refresh" @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="gva-table-box">
      <el-table ref="multipleTable" style="width: 100%" tooltip-effect="dark" :data="tableData" row-key="taskHash"
        @selection-change="handleSelectionChange">
        <!-- <el-table-column type="selection" width="55" /> -->

        <el-table-column label="排名" width="60">
          <template #default="scope">
            {{ (page - 1) * pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>

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

        <el-table-column align="left" label="吞吐量 (tokens/sec)" prop="averageThroughput" width="180" />

        <el-table-column align="left" label="延迟 (ms)" prop="averageLatency" width="120" />

        <el-table-column align="left" label="显存占用 (GB)" prop="averageGpuMemory" width="120" />

        <el-table-column align="left" label="执行人" prop="operatorName" width="120" />

        <el-table-column sortable align="left" label="日期" prop="CreatedAt" width="undefined" >
          <template #default="scope">{{ formatDate(scope.row.CreatedAt) }}</template>
        </el-table-column>

      </el-table>
      <div class="gva-pagination">
        <el-pagination layout="total, sizes, prev, pager, next, jumper" :current-page="page" :page-size="pageSize"
          :page-sizes="[10, 30, 50, 100]" :total="total" @current-change="handleCurrentChange"
          @size-change="handleSizeChange" />
      </div>
    </div>

  </div>
</template>

<script setup>
import {
  getBizInferenceRank
} from '@/api/biz/biz_inference_task'

// 全量引入格式化工具 请按需保留
import { getBizDatasetList } from '@/api/biz/biz_dataset'
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

// 数据集下拉选项
const datasetOptions = ref([])
const perfTypeOptions = ref([
  { id: 0, name: '吞吐量' },
  { id: 1, name: '延迟' },
  { id: 2, name: '显存占用' },
])
const loadingDatasets = ref(false)

// 下拉打开时加载数据集列表（只加载一次）
const loadDatasetOptions = async () => {
  if (loadingDatasets.value || datasetOptions.value.length) return
  loadingDatasets.value = true
  try {
    const res = await getBizDatasetList({ page: 1, pageSize: 9999 })
    if (res.code === 0 && res.data) {
      datasetOptions.value = res.data.list.map(item => ({
        id: item.ID ?? item.id,
        name: item.datasetName
      }))
    }
  } catch (e) {
    console.error(e)
  } finally {
    loadingDatasets.value = false
  }
}

// 下拉可见性变更（打开时触发加载）
const onDatasetVisibleChange = (visible) => {
  if (visible) loadDatasetOptions()
}

// 选择数据集后同时填充 datasetId
const onDatasetChange = (val) => {
  const sel = datasetOptions.value.find(i => i.id === val)
  searchInfo.value.datasetId = sel ? sel.id : undefined
}

// 选择排序性能指标后同时填充 perfType
const onPerfTypeChange = (val) => {
  const sel = perfTypeOptions.value.find(i => i.id === val)
  searchInfo.value.perfType = sel ? sel.id : undefined
}

// 重置
const onReset = () => {
  searchInfo.value = {}
}

// 搜索
const onSubmit = () => {
  elSearchFormRef.value?.validate(async (valid) => {
    if (!valid) return
    tableData.value = []
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
  const table = await getBizInferenceRank({ page: page.value, pageSize: pageSize.value, ...searchInfo.value })
  if (table.code === 0) {
    tableData.value = table.data.list
    total.value = table.data.total
    page.value = table.data.page
    pageSize.value = table.data.pageSize
  }
}

// getTableData()

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
