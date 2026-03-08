import service from '@/utils/request'
// @Tags BizModel
// @Summary 创建模型管理
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data body model.BizModel true "创建模型管理"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"创建成功"}"
// @Router /model/createBizModel [post]
export const createBizModel = (data) => {
  return service({
    url: '/model/createBizModel',
    method: 'post',
    data
  })
}

// @Tags BizModel
// @Summary 删除模型管理
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data body model.BizModel true "删除模型管理"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /model/deleteBizModel [delete]
export const deleteBizModel = (params) => {
  return service({
    url: '/model/deleteBizModel',
    method: 'delete',
    params
  })
}

// @Tags BizModel
// @Summary 批量删除模型管理
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data body request.IdsReq true "批量删除模型管理"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /model/deleteBizModel [delete]
export const deleteBizModelByIds = (params) => {
  return service({
    url: '/model/deleteBizModelByIds',
    method: 'delete',
    params
  })
}

// @Tags BizModel
// @Summary 更新模型管理
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data body model.BizModel true "更新模型管理"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"更新成功"}"
// @Router /model/updateBizModel [put]
export const updateBizModel = (data) => {
  return service({
    url: '/model/updateBizModel',
    method: 'put',
    data
  })
}

// @Tags BizModel
// @Summary 用id查询模型管理
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data query model.BizModel true "用id查询模型管理"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"查询成功"}"
// @Router /model/findBizModel [get]
export const findBizModel = (params) => {
  return service({
    url: '/model/findBizModel',
    method: 'get',
    params
  })
}

// @Tags BizModel
// @Summary 分页获取模型管理列表
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data query request.PageInfo true "分页获取模型管理列表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /model/getBizModelList [get]
export const getBizModelList = (params) => {
  return service({
    url: '/model/getBizModelList',
    method: 'get',
    params
  })
}

// @Tags BizModel
// @Summary 不需要鉴权的模型管理接口
// @Accept application/json
// @Produce application/json
// @Param data query bizReq.BizModelSearch true "分页获取模型管理列表"
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /model/getBizModelPublic [get]
export const getBizModelPublic = () => {
  return service({
    url: '/model/getBizModelPublic',
    method: 'get',
  })
}
