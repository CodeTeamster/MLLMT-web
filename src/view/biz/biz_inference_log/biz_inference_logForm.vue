
<template>
  <div>
    <div class="gva-form-box">
      <el-form :model="formData" ref="elFormRef" label-position="right" :rules="rule" label-width="80px">
        <el-form-item label="任务编号:" prop="taskHash">
    <el-input v-model="formData.taskHash" :clearable="true" placeholder="请输入任务编号" />
</el-form-item>
        <el-form-item label="数据集Id:" prop="datasetId">
    <el-input v-model.number="formData.datasetId" :clearable="true" placeholder="请输入数据集Id" />
</el-form-item>
        <el-form-item label="样本Id:" prop="sampleId">
    <el-input v-model.number="formData.sampleId" :clearable="true" placeholder="请输入样本Id" />
</el-form-item>
        <el-form-item label="算法名称:" prop="algorithmName">
    <el-input v-model.number="formData.algorithmName" :clearable="true" placeholder="请输入算法名称" />
</el-form-item>
        <el-form-item label="算法Id:" prop="algorithmId">
    <el-input v-model.number="formData.algorithmId" :clearable="true" placeholder="请输入算法Id" />
</el-form-item>
        <el-form-item label="吞吐量:" prop="throughput">
    <el-input-number v-model="formData.throughput" style="width:100%" :precision="2" :clearable="true" />
</el-form-item>
        <el-form-item label="单token推理延迟:" prop="latency">
    <el-input-number v-model="formData.latency" style="width:100%" :precision="2" :clearable="true" />
</el-form-item>
        <el-form-item label="GPU显存占用:" prop="gpuMemory">
    <el-input-number v-model="formData.gpuMemory" style="width:100%" :precision="2" :clearable="true" />
</el-form-item>
        <el-form-item label="任务内执行顺序:" prop="taskInnerSeq">
    <el-input v-model.number="formData.taskInnerSeq" :clearable="true" placeholder="请输入任务内执行顺序" />
</el-form-item>
        <el-form-item label="json形式推理结果:" prop="jsonLog">
    // 此字段为json结构，可以前端自行控制展示和数据绑定模式 需绑定json的key为 formData.jsonLog 后端会按照json的类型进行存取
    {{ formData.jsonLog }}
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
  createBizInferenceLog,
  updateBizInferenceLog,
  findBizInferenceLog
} from '@/api/biz/biz_inference_log'

defineOptions({
    name: 'BizInferenceLogForm'
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
            taskHash: '',
            datasetId: undefined,
            sampleId: undefined,
            algorithmName: undefined,
            algorithmId: undefined,
            throughput: 0,
            latency: 0,
            gpuMemory: 0,
            taskInnerSeq: undefined,
            jsonLog: {},
        })
// 验证规则
const rule = reactive({
               taskHash : [{
                   required: true,
                   message: '',
                   trigger: ['input','blur'],
               }],
               datasetId : [{
                   required: true,
                   message: '',
                   trigger: ['input','blur'],
               }],
               sampleId : [{
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
               throughput : [{
                   required: true,
                   message: '',
                   trigger: ['input','blur'],
               }],
               latency : [{
                   required: true,
                   message: '',
                   trigger: ['input','blur'],
               }],
               gpuMemory : [{
                   required: true,
                   message: '',
                   trigger: ['input','blur'],
               }],
               taskInnerSeq : [{
                   required: true,
                   message: '',
                   trigger: ['input','blur'],
               }],
               jsonLog : [{
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
      const res = await findBizInferenceLog({ ID: route.query.id })
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
               res = await createBizInferenceLog(formData.value)
               break
             case 'update':
               res = await updateBizInferenceLog(formData.value)
               break
             default:
               res = await createBizInferenceLog(formData.value)
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
