
<template>
  <div>
    <div class="gva-form-box">
      <el-form :model="formData" ref="elFormRef" label-position="right" :rules="rule" label-width="80px">
        <el-form-item label="模型名称:" prop="modelName">
    <el-input v-model="formData.modelName" :clearable="true" placeholder="请输入模型名称" />
</el-form-item>
        <el-form-item label="模型Id:" prop="modelId">
    <el-input v-model.number="formData.modelId" :clearable="true" placeholder="请输入模型Id" />
</el-form-item>
        <el-form-item label="算法名称:" prop="algorithmName">
    <el-input v-model="formData.algorithmName" :clearable="true" placeholder="请输入算法名称" />
</el-form-item>
        <el-form-item label="算法Id:" prop="algorithmId">
    <el-input v-model.number="formData.algorithmId" :clearable="true" placeholder="请输入算法Id" />
</el-form-item>
        <el-form-item label="模型类型:" prop="modelType">
    <el-input v-model.number="formData.modelType" :clearable="true" placeholder="请输入模型类型" />
</el-form-item>
        <el-form-item label="数据集名称:" prop="datasetName">
    <el-input v-model="formData.datasetName" :clearable="true" placeholder="请输入数据集名称" />
</el-form-item>
        <el-form-item label="数据集Id:" prop="datasetId">
    <el-input v-model.number="formData.datasetId" :clearable="true" placeholder="请输入数据集Id" />
</el-form-item>
        <el-form-item label="任务唯一编号:" prop="taskHash">
    <el-input v-model="formData.taskHash" :clearable="true" placeholder="请输入任务唯一编号" />
</el-form-item>
        <el-form-item label="平均吞吐量:" prop="averageThroughput">
    <el-input-number v-model="formData.averageThroughput" style="width:100%" :precision="2" :clearable="true" />
</el-form-item>
        <el-form-item label="平均生成延迟:" prop="averageLatency">
    <el-input-number v-model="formData.averageLatency" style="width:100%" :precision="2" :clearable="true" />
</el-form-item>
        <el-form-item label="平均GPU显存占用:" prop="averageGpuMemory">
    <el-input-number v-model="formData.averageGpuMemory" style="width:100%" :precision="2" :clearable="true" />
</el-form-item>
        <el-form-item label="执行人用户名:" prop="operatorName">
    <el-input v-model="formData.operatorName" :clearable="true" placeholder="请输入执行人用户名" />
</el-form-item>
        <el-form-item label="执行人Id:" prop="operatorId">
    <el-input v-model.number="formData.operatorId" :clearable="true" placeholder="请输入执行人Id" />
</el-form-item>
        <el-form-item>
          <el-button :loading="btnLoading" type="primary" @click="save">保存</el-button>
          <el-button type="primary" @click="back">返回</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import {
  createBizInferenceTask,
  updateBizInferenceTask,
  findBizInferenceTask
} from '@/api/biz/biz_inference_task'

defineOptions({
    name: 'BizInferenceTaskForm'
})

// 自动获取字典
import { getDictFunc } from '@/utils/format'
import { useRoute, useRouter } from "vue-router"
import { ElMessage } from 'element-plus'
import { ref, reactive } from 'vue'


const route = useRoute()
const router = useRouter()

// 提交按钮loading
const btnLoading = ref(false)

const type = ref('')
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
               modelName : [{
                   required: true,
                   message: '',
                   trigger: ['input','blur'],
               }],
               modelId : [{
                   required: true,
                   message: '',
                   trigger: ['input','blur'],
               }],
               algorithmName : [{
                   required: true,
                   message: '',
                   trigger: ['input','blur'],
               }],
               algorithmId : [{
                   required: true,
                   message: '',
                   trigger: ['input','blur'],
               }],
               modelType : [{
                   required: true,
                   message: '',
                   trigger: ['input','blur'],
               }],
               datasetName : [{
                   required: true,
                   message: '',
                   trigger: ['input','blur'],
               }],
               datasetId : [{
                   required: true,
                   message: '',
                   trigger: ['input','blur'],
               }],
               taskHash : [{
                   required: true,
                   message: '',
                   trigger: ['input','blur'],
               }],
               averageThroughput : [{
                   required: true,
                   message: '',
                   trigger: ['input','blur'],
               }],
               averageLatency : [{
                   required: true,
                   message: '',
                   trigger: ['input','blur'],
               }],
               averageGpuMemory : [{
                   required: true,
                   message: '',
                   trigger: ['input','blur'],
               }],
               operatorName : [{
                   required: true,
                   message: '',
                   trigger: ['input','blur'],
               }],
               operatorId : [{
                   required: true,
                   message: '',
                   trigger: ['input','blur'],
               }],
})

const elFormRef = ref()

// 初始化方法
const init = async () => {
 // 建议通过url传参获取目标数据ID 调用 find方法进行查询数据操作 从而决定本页面是create还是update 以下为id作为url参数示例
    if (route.query.id) {
      const res = await findBizInferenceTask({ ID: route.query.id })
      if (res.code === 0) {
        formData.value = res.data
        type.value = 'update'
      }
    } else {
      type.value = 'create'
    }
}

init()
// 保存按钮
const save = async() => {
      btnLoading.value = true
      elFormRef.value?.validate( async (valid) => {
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
           }
       })
}

// 返回按钮
const back = () => {
    router.go(-1)
}

</script>

<style>
</style>
