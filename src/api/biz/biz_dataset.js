import service from '@/utils/request'
// @Tags BizDataset
// @Summary 创建数据集管理
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data body model.BizDataset true "创建数据集管理"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"创建成功"}"
// @Router /dataset/createBizDataset [post]
export const createBizDataset = (data) => {
  return service({
    url: '/dataset/createBizDataset',
    method: 'post',
    data
  })
}

// @Tags BizDataset
// @Summary 删除数据集管理
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data body model.BizDataset true "删除数据集管理"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /dataset/deleteBizDataset [delete]
export const deleteBizDataset = (params) => {
  return service({
    url: '/dataset/deleteBizDataset',
    method: 'delete',
    params
  })
}

// @Tags BizDataset
// @Summary 批量删除数据集管理
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data body request.IdsReq true "批量删除数据集管理"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /dataset/deleteBizDataset [delete]
export const deleteBizDatasetByIds = (params) => {
  return service({
    url: '/dataset/deleteBizDatasetByIds',
    method: 'delete',
    params
  })
}

// @Tags BizDataset
// @Summary 更新数据集管理
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data body model.BizDataset true "更新数据集管理"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"更新成功"}"
// @Router /dataset/updateBizDataset [put]
export const updateBizDataset = (data) => {
  return service({
    url: '/dataset/updateBizDataset',
    method: 'put',
    data
  })
}

// @Tags BizDataset
// @Summary 用id查询数据集管理
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data query model.BizDataset true "用id查询数据集管理"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"查询成功"}"
// @Router /dataset/findBizDataset [get]
export const findBizDataset = (params) => {
  return service({
    url: '/dataset/findBizDataset',
    method: 'get',
    params
  })
}

// @Tags BizDataset
// @Summary 分页获取数据集管理列表
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data query request.PageInfo true "分页获取数据集管理列表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /dataset/getBizDatasetList [get]
export const getBizDatasetList = (params) => {
  return service({
    url: '/dataset/getBizDatasetList',
    method: 'get',
    params
  })
}

// @Tags BizDataset
// @Summary 不需要鉴权的数据集管理接口
// @Accept application/json
// @Produce application/json
// @Param data query bizReq.BizDatasetSearch true "分页获取数据集管理列表"
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /dataset/getBizDatasetPublic [get]
export const getBizDatasetPublic = () => {
  return service({
    url: '/dataset/getBizDatasetPublic',
    method: 'get',
  })
}
