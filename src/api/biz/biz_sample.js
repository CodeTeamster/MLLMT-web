import service from '@/utils/request'
// @Tags BizSample
// @Summary 创建数据集样本管理
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data body model.BizSample true "创建数据集样本管理"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"创建成功"}"
// @Router /sample/createBizSample [post]
export const createBizSample = (data) => {
  return service({
    url: '/sample/createBizSample',
    method: 'post',
    data
  })
}

// @Tags BizSample
// @Summary 删除数据集样本管理
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data body model.BizSample true "删除数据集样本管理"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /sample/deleteBizSample [delete]
export const deleteBizSample = (params) => {
  return service({
    url: '/sample/deleteBizSample',
    method: 'delete',
    params
  })
}

// @Tags BizSample
// @Summary 批量删除数据集样本管理
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data body request.IdsReq true "批量删除数据集样本管理"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /sample/deleteBizSample [delete]
export const deleteBizSampleByIds = (params) => {
  return service({
    url: '/sample/deleteBizSampleByIds',
    method: 'delete',
    params
  })
}

// @Tags BizSample
// @Summary 更新数据集样本管理
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data body model.BizSample true "更新数据集样本管理"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"更新成功"}"
// @Router /sample/updateBizSample [put]
export const updateBizSample = (data) => {
  return service({
    url: '/sample/updateBizSample',
    method: 'put',
    data
  })
}

// @Tags BizSample
// @Summary 用id查询数据集样本管理
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data query model.BizSample true "用id查询数据集样本管理"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"查询成功"}"
// @Router /sample/findBizSample [get]
export const findBizSample = (params) => {
  return service({
    url: '/sample/findBizSample',
    method: 'get',
    params
  })
}

// @Tags BizSample
// @Summary 分页获取数据集样本管理列表
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data query request.PageInfo true "分页获取数据集样本管理列表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /sample/getBizSampleList [get]
export const getBizSampleList = (params) => {
  return service({
    url: '/sample/getBizSampleList',
    method: 'get',
    params
  })
}

// @Tags BizSample
// @Summary 不需要鉴权的数据集样本管理接口
// @Accept application/json
// @Produce application/json
// @Param data query bizReq.BizSampleSearch true "分页获取数据集样本管理列表"
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /sample/getBizSamplePublic [get]
export const getBizSamplePublic = () => {
  return service({
    url: '/sample/getBizSamplePublic',
    method: 'get',
  })
}
