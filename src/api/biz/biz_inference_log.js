import service from '@/utils/request'
// @Tags BizInferenceLog
// @Summary 创建推理详细记录
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data body model.BizInferenceLog true "创建推理详细记录"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"创建成功"}"
// @Router /inferenceLog/createBizInferenceLog [post]
export const createBizInferenceLog = (data) => {
  return service({
    url: '/inferenceLog/createBizInferenceLog',
    method: 'post',
    data
  })
}

// @Tags BizInferenceLog
// @Summary 删除推理详细记录
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data body model.BizInferenceLog true "删除推理详细记录"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /inferenceLog/deleteBizInferenceLog [delete]
export const deleteBizInferenceLog = (params) => {
  return service({
    url: '/inferenceLog/deleteBizInferenceLog',
    method: 'delete',
    params
  })
}

// @Tags BizInferenceLog
// @Summary 批量删除推理详细记录
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data body request.IdsReq true "批量删除推理详细记录"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /inferenceLog/deleteBizInferenceLog [delete]
export const deleteBizInferenceLogByIds = (params) => {
  return service({
    url: '/inferenceLog/deleteBizInferenceLogByIds',
    method: 'delete',
    params
  })
}

// @Tags BizInferenceLog
// @Summary 更新推理详细记录
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data body model.BizInferenceLog true "更新推理详细记录"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"更新成功"}"
// @Router /inferenceLog/updateBizInferenceLog [put]
export const updateBizInferenceLog = (data) => {
  return service({
    url: '/inferenceLog/updateBizInferenceLog',
    method: 'put',
    data
  })
}

// @Tags BizInferenceLog
// @Summary 用id查询推理详细记录
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data query model.BizInferenceLog true "用id查询推理详细记录"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"查询成功"}"
// @Router /inferenceLog/findBizInferenceLog [get]
export const findBizInferenceLog = (params) => {
  return service({
    url: '/inferenceLog/findBizInferenceLog',
    method: 'get',
    params
  })
}

// @Tags BizInferenceLog
// @Summary 分页获取推理详细记录列表
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data query request.PageInfo true "分页获取推理详细记录列表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /inferenceLog/getBizInferenceLogList [get]
export const getBizInferenceLogList = (params) => {
  return service({
    url: '/inferenceLog/getBizInferenceLogList',
    method: 'get',
    params
  })
}

// @Tags BizInferenceLog
// @Summary 不需要鉴权的推理详细记录接口
// @Accept application/json
// @Produce application/json
// @Param data query bizReq.BizInferenceLogSearch true "分页获取推理详细记录列表"
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /inferenceLog/getBizInferenceLogPublic [get]
export const getBizInferenceLogPublic = () => {
  return service({
    url: '/inferenceLog/getBizInferenceLogPublic',
    method: 'get',
  })
}
