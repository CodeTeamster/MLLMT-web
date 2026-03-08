
<template>
  <div>
    <div class="gva-form-box">
      <el-form :model="formData" ref="elFormRef" label-position="right" :rules="rule" label-width="80px">
        <el-form-item label="算法名:" prop="algorithmName">
    <el-input v-model="formData.algorithmName" :clearable="true" placeholder="请输入算法名" />
</el-form-item>
        <el-form-item label="创建人昵称:" prop="creatorName">
    <el-input v-model="formData.creatorName" :clearable="true" placeholder="请输入创建人昵称" />
</el-form-item>
        <el-form-item label="创建人ID:" prop="creatorId">
    <el-input v-model.number="formData.creatorId" :clearable="true" placeholder="请输入创建人ID" />
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
  createBizAlgorithm,
  updateBizAlgorithm,
  findBizAlgorithm
} from '@/api/biz/biz_algorithm'

defineOptions({
    name: 'BizAlgorithmForm'
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
            algorithmName: '',
            creatorName: '',
            creatorId: undefined,
        })
// 验证规则
const rule = reactive({
               algorithmName : [{
                   required: true,
                   message: '',
                   trigger: ['input','blur'],
               }],
               creatorName : [{
                   required: true,
                   message: '',
                   trigger: ['input','blur'],
               }],
               creatorId : [{
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
      const res = await findBizAlgorithm({ ID: route.query.id })
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
               res = await createBizAlgorithm(formData.value)
               break
             case 'update':
               res = await updateBizAlgorithm(formData.value)
               break
             default:
               res = await createBizAlgorithm(formData.value)
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
