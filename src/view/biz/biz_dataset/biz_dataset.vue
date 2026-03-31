<template>
  <div class="dataset-page">
    <div class="dataset-hero">
      <div>
        <p class="dataset-hero-eyebrow">Dataset Workspace</p>
        <h2 class="dataset-hero-title">数据集管理</h2>
        <p class="dataset-hero-desc">统一管理数据集资产、可见范围与样本内容，支撑多模态推理全流程。</p>
      </div>
      <div class="dataset-hero-metrics">
        <span>资产治理</span>
        <span>权限管控</span>
        <span>样本联动</span>
      </div>
    </div>
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
          <el-button class="dataset-btn-primary" type="primary" icon="search" @click="onSubmit">查询</el-button>
          <el-button icon="refresh" @click="onReset">重置</el-button>
          <!-- <el-button link type="primary" icon="arrow-down" @click="showAllQuery = true"
            v-if="!showAllQuery">展开</el-button>
          <el-button link type="primary" icon="arrow-up" @click="showAllQuery = false" v-else>收起</el-button> -->
        </el-form-item>
      </el-form>
    </div>
    <div class="gva-table-box">
      <div class="gva-btn-list">
        <el-button class="dataset-btn-primary" v-auth="btnAuth.add" type="primary" icon="plus" @click="openDialog()">新增</el-button>
        <el-button class="dataset-btn-danger" v-auth="btnAuth.batchDelete" icon="delete" style="margin-left: 10px;"
          :disabled="!multipleSelection.length" @click="onDelete">删除</el-button>

      </div>
      <el-table ref="multipleTable" class="dataset-table" style="width: 100%" tooltip-effect="dark" :data="tableData" row-key="ID"
        @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />

        <el-table-column sortable align="left" label="日期" prop="CreatedAt" width="300">
          <template #default="scope">{{ formatDate(scope.row.CreatedAt) }}</template>
        </el-table-column>

        <el-table-column align="left" label="数据集名称" prop="datasetName" width="280" />

        <el-table-column align="left" label="权限" prop="scope" width="200">
          <template #default="scope">{{ formatScope(scope.row.scope) }}</template>
        </el-table-column>

        <!-- <el-table-column align="left" label="创建人id" prop="creatorId" width="120" /> -->

        <el-table-column align="left" label="操作" fixed="right" :min-width="appStore.operateMinWith">
          <template #default="scope">
            <el-button v-auth="btnAuth.info" type="primary" link class="table-button"
              @click="getDetails(scope.row)"><el-icon style="margin-right: 5px">
                <MessageBox />
              </el-icon>样本管理</el-button>
            <el-button v-auth="btnAuth.edit" type="primary" link icon="edit" class="table-button"
              @click="updateBizDatasetFunc(scope.row)">编辑</el-button>
            <el-button v-auth="btnAuth.delete" type="primary" link icon="delete"
              @click="deleteRow(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="gva-pagination">
        <el-pagination layout="total, sizes, prev, pager, next, jumper" :current-page="page" :page-size="pageSize"
          :page-sizes="[10, 30, 50, 100]" :total="total" @current-change="handleCurrentChange"
          @size-change="handleSizeChange" />
      </div>
    </div>
    <el-drawer class="dataset-drawer" destroy-on-close :size="appStore.drawerSize" v-model="dialogFormVisible" :show-close="false"
      :before-close="closeDialog">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="text-lg">{{ type === 'create' ? '新增' : '编辑' }}</span>
          <div>
            <el-button :loading="btnLoading" type="primary" @click="enterDialog">确 定</el-button>
            <el-button @click="closeDialog">取 消</el-button>
          </div>
        </div>
      </template>

      <el-form class="dataset-form" :model="formData" label-position="top" ref="elFormRef" :rules="rule" label-width="80px">
        <el-form-item label="数据集名称:" prop="datasetName">
          <el-input v-model="formData.datasetName" :clearable="true" placeholder="请输入数据集名称" />
        </el-form-item>
        <el-form-item label="权限:" prop="scope">
          <el-select v-model.number="formData.scope" placeholder="请选择权限" :clearable="true">
            <el-option :label="'仅自己可见'" :value="0" />
            <el-option :label="'所有人可见'" :value="1" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-drawer>

    <el-drawer class="dataset-drawer" destroy-on-close :size="appStore.drawerSize" v-model="detailShow" :show-close="true"
      :before-close="closeDetailShow" title="样本管理">
      <BizSample :dataset-id="detailForm.ID" />
    </el-drawer>

  </div>
</template>

<script setup>
import {
  createBizDataset,
  deleteBizDataset,
  deleteBizDatasetByIds,
  updateBizDataset,
  findBizDataset,
  getBizDatasetList
} from '@/api/biz/biz_dataset'

// 全量引入格式化工具 请按需保留
import { getDictFunc, formatDate, formatBoolean, filterDict, filterDataSource, returnArrImg, onDownloadFile } from '@/utils/format'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ref, reactive } from 'vue'
// 引入按钮权限标识
import { useBtnAuth } from '@/utils/btnAuth'
import { useAppStore } from "@/pinia"
import BizSample from '@/view/biz/biz_sample/biz_sample.vue'




defineOptions({
  name: 'BizDataset'
})
// 按钮权限实例化
const btnAuth = useBtnAuth()

// 提交按钮loading
const btnLoading = ref(false)
const appStore = useAppStore()

// 控制更多查询条件显示/隐藏状态
const showAllQuery = ref(false)

// 自动化生成的字典（可能为空）以及字段
const formData = ref({
  datasetName: '',
  scope: undefined,
  creatorId: undefined,
})

// 验证规则
const rule = reactive({
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
  scope: [{
    required: true,
    message: '',
    trigger: ['input', 'blur'],
  },
  ],
  creatorId: [{
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
  const table = await getBizDatasetList({ page: page.value, pageSize: pageSize.value, ...searchInfo.value })
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
    deleteBizDatasetFunc(row)
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
        IDs.push(item.ID)
      })
    const res = await deleteBizDatasetByIds({ IDs })
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
const updateBizDatasetFunc = async (row) => {
  const res = await findBizDataset({ ID: row.ID })
  type.value = 'update'
  if (res.code === 0) {
    formData.value = res.data
    dialogFormVisible.value = true
  }
}

// 删除行
const deleteBizDatasetFunc = async (row) => {
  const res = await deleteBizDataset({ ID: row.ID })
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
    datasetName: '',
    scope: undefined,
    creatorId: undefined,
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
        res = await createBizDataset(formData.value)
        break
      case 'update':
        res = await updateBizDataset(formData.value)
        break
      default:
        res = await createBizDataset(formData.value)
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
  const res = await findBizDataset({ ID: row.ID })
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

// 将权限数字映射为字符串
const scopeMap = {
  0: '仅自己可见',
  1: '所有人可见',
}
const formatScope = (val) => {
  if (val === undefined || val === null) return ''
  return scopeMap[val] ?? String(val)
}

</script>

<style scoped lang="scss">
.dataset-page {
  --panel-bg: #0f1d38;
  --panel-border: rgba(108, 141, 198, 0.24);
  --muted-text: #9baccc;
  --strong-text: #e6edfb;
  --accent: #4d87ff;
  --accent-dark: #2f6edf;
  --accent-light: rgba(77, 135, 255, 0.16);
  --line-soft: rgba(108, 141, 198, 0.26);
  --danger: #f87171;
  min-height: 100%;
  padding: 12px;
  background: #1f2c46;
}

.dataset-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px;
  margin-bottom: 12px;
  border: 1px solid var(--panel-border);
  border-radius: 14px;
  background: linear-gradient(135deg, #091830 0%, #10264b 60%, #17396b 100%);
  box-shadow: 0 8px 28px rgba(3, 8, 20, 0.5);
  color: #dde8ff;
  position: relative;
  overflow: hidden;
}

.dataset-hero::before {
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

.dataset-hero-eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 1.4px;
  color: rgba(188, 212, 255, 0.9);
  text-transform: uppercase;
}

.dataset-hero-title {
  margin: 6px 0 0;
  font-size: 24px;
  color: #f3f7ff;
  font-weight: 700;
  line-height: 1.2;
}

.dataset-hero-desc {
  margin: 8px 0 0;
  color: rgba(214, 227, 255, 0.8);
  font-size: 13px;
}

.dataset-hero-metrics {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.dataset-hero-metrics span {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(112, 155, 255, 0.45);
  color: #bfd4ff;
  font-size: 12px;
  font-weight: 600;
  background: rgba(77, 135, 255, 0.18);
  backdrop-filter: blur(4px);
}

:deep(.gva-search-box),
:deep(.gva-table-box) {
  border: 1px solid var(--line-soft);
  border-radius: 14px;
  background: var(--panel-bg);
  box-shadow: 0 8px 24px rgba(3, 8, 20, 0.42);
}

:deep(.gva-search-box) {
  padding: 14px 16px 8px;
  margin-bottom: 12px;
}

:deep(.gva-table-box) {
  padding: 12px 12px 8px;
}

:deep(.el-form-item__label),
:deep(.el-table th.el-table__cell > .cell) {
  color: var(--strong-text);
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-select__wrapper) {
  background: #0b1933;
  box-shadow: inset 0 0 0 1px var(--line-soft);
  border-radius: 10px;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 3px rgba(77, 135, 255, 0.2);
}

:deep(.el-input__inner),
:deep(.el-textarea__inner),
:deep(.el-select__placeholder),
:deep(.el-select__selected-item) {
  color: var(--strong-text);
}

.dataset-btn-primary {
  border: none;
  background: linear-gradient(92deg, var(--accent), var(--accent-dark));
  box-shadow: 0 6px 16px rgba(77, 135, 255, 0.3);
  color: white;
  transition: all 0.2s ease;
}

.dataset-btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(77, 135, 255, 0.42);
}

.dataset-btn-danger {
  border-color: rgba(248, 113, 113, 0.4);
  color: #ffc4c4;
  background: rgba(127, 29, 29, 0.4);
}

:deep(.dataset-table .el-table__header-wrapper th.el-table__cell) {
  background: #112546;
  color: var(--strong-text);
  font-weight: 600;
}

:deep(.dataset-table .el-table__body tr) {
  background: var(--panel-bg);
}

:deep(.dataset-table .el-table__body tr:hover > td.el-table__cell) {
  background: #14294d;
}

:deep(.dataset-table .el-table__cell) {
  border-bottom-color: var(--line-soft);
  color: var(--strong-text);
}

:deep(.gva-pagination) {
  margin-top: 10px;
  padding-bottom: 12px;
}

:deep(.dataset-drawer .el-drawer) {
  background: var(--panel-bg);
}

:deep(.dataset-drawer .el-drawer__header) {
  margin-bottom: 0;
  border-bottom: 1px solid var(--line-soft);
  color: var(--strong-text);
}

:deep(.dataset-drawer .el-drawer__body) {
  color: var(--muted-text);
}

:deep(.dataset-form .el-form-item__label) {
  color: var(--strong-text);
}

@media (max-width: 768px) {
  .dataset-page { padding: 8px; }
  .dataset-hero { flex-direction: column; align-items: flex-start; }
  .dataset-hero-metrics { justify-content: flex-start; }
  :deep(.gva-search-box) { padding: 12px 10px 0; }
  :deep(.gva-table-box) { padding: 10px 8px 0; }
}
</style>

