import service from '@/utils/request'
// @Tags BizInferenceTask
// @Summary 创建推理任务记录
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data body model.BizInferenceTask true "创建推理任务记录"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"创建成功"}"
// @Router /inferenceTask/createBizInferenceTask [post]
export const createBizInferenceTask = (data) => {
  return service({
    url: '/inferenceTask/createBizInferenceTask',
    method: 'post',
    data
  })
}

// @Tags BizInferenceTask
// @Summary 删除推理任务记录
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data body model.BizInferenceTask true "删除推理任务记录"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /inferenceTask/deleteBizInferenceTask [delete]
export const deleteBizInferenceTask = (params) => {
  return service({
    url: '/inferenceTask/deleteBizInferenceTask',
    method: 'delete',
    params
  })
}

// @Tags BizInferenceTask
// @Summary 批量删除推理任务记录
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data body request.IdsReq true "批量删除推理任务记录"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /inferenceTask/deleteBizInferenceTask [delete]
export const deleteBizInferenceTaskByIds = (params) => {
  return service({
    url: '/inferenceTask/deleteBizInferenceTaskByIds',
    method: 'delete',
    params
  })
}

// @Tags BizInferenceTask
// @Summary 更新推理任务记录
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data body model.BizInferenceTask true "更新推理任务记录"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"更新成功"}"
// @Router /inferenceTask/updateBizInferenceTask [put]
export const updateBizInferenceTask = (data) => {
  return service({
    url: '/inferenceTask/updateBizInferenceTask',
    method: 'put',
    data
  })
}

// @Tags BizInferenceTask
// @Summary 用id查询推理任务记录
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data query model.BizInferenceTask true "用id查询推理任务记录"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"查询成功"}"
// @Router /inferenceTask/findBizInferenceTask [get]
export const findBizInferenceTask = (params) => {
  return service({
    url: '/inferenceTask/findBizInferenceTask',
    method: 'get',
    params
  })
}

// @Tags BizInferenceTask
// @Summary 分页获取推理任务记录列表
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data query request.PageInfo true "分页获取推理任务记录列表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /inferenceTask/getBizInferenceTaskList [get]
export const getBizInferenceTaskList = (params) => {
  return service({
    url: '/inferenceTask/getBizInferenceTaskList',
    method: 'get',
    params
  })
}

// @Tags BizInferenceTask
// @Summary 分页获取推理性能榜单
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data query request.PageInfo true "分页获取推理性能榜单"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /inferenceTask/getBizInferenceRank [get]
export const getBizInferenceRank = (params) => {
  return service({
    url: '/inferenceTask/getBizInferenceRank',
    method: 'get',
    params
  })
}

// @Tags BizInferenceTask
// @Summary 不需要鉴权的推理任务记录接口
// @Accept application/json
// @Produce application/json
// @Param data query bizReq.BizInferenceTaskSearch true "分页获取推理任务记录列表"
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /inferenceTask/getBizInferenceTaskPublic [get]
export const getBizInferenceTaskPublic = () => {
  return service({
    url: '/inferenceTask/getBizInferenceTaskPublic',
    method: 'get',
  })
}
