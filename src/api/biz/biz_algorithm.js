import service from '@/utils/request'
// @Tags BizAlgorithm
// @Summary 创建推理加速算法
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data body model.BizAlgorithm true "创建推理加速算法"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"创建成功"}"
// @Router /algorithm/createBizAlgorithm [post]
export const createBizAlgorithm = (data) => {
  return service({
    url: '/algorithm/createBizAlgorithm',
    method: 'post',
    data
  })
}

// @Tags BizAlgorithm
// @Summary 删除推理加速算法
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data body model.BizAlgorithm true "删除推理加速算法"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /algorithm/deleteBizAlgorithm [delete]
export const deleteBizAlgorithm = (params) => {
  return service({
    url: '/algorithm/deleteBizAlgorithm',
    method: 'delete',
    params
  })
}

// @Tags BizAlgorithm
// @Summary 批量删除推理加速算法
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data body request.IdsReq true "批量删除推理加速算法"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /algorithm/deleteBizAlgorithm [delete]
export const deleteBizAlgorithmByIds = (params) => {
  return service({
    url: '/algorithm/deleteBizAlgorithmByIds',
    method: 'delete',
    params
  })
}

// @Tags BizAlgorithm
// @Summary 更新推理加速算法
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data body model.BizAlgorithm true "更新推理加速算法"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"更新成功"}"
// @Router /algorithm/updateBizAlgorithm [put]
export const updateBizAlgorithm = (data) => {
  return service({
    url: '/algorithm/updateBizAlgorithm',
    method: 'put',
    data
  })
}

// @Tags BizAlgorithm
// @Summary 用id查询推理加速算法
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data query model.BizAlgorithm true "用id查询推理加速算法"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"查询成功"}"
// @Router /algorithm/findBizAlgorithm [get]
export const findBizAlgorithm = (params) => {
  return service({
    url: '/algorithm/findBizAlgorithm',
    method: 'get',
    params
  })
}

// @Tags BizAlgorithm
// @Summary 分页获取推理加速算法列表
// @Security ApiKeyAuth
// @Accept application/json
// @Produce application/json
// @Param data query request.PageInfo true "分页获取推理加速算法列表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /algorithm/getBizAlgorithmList [get]
export const getBizAlgorithmList = (params) => {
  return service({
    url: '/algorithm/getBizAlgorithmList',
    method: 'get',
    params
  })
}

// @Tags BizAlgorithm
// @Summary 不需要鉴权的推理加速算法接口
// @Accept application/json
// @Produce application/json
// @Param data query bizReq.BizAlgorithmSearch true "分页获取推理加速算法列表"
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /algorithm/getBizAlgorithmPublic [get]
export const getBizAlgorithmPublic = () => {
  return service({
    url: '/algorithm/getBizAlgorithmPublic',
    method: 'get',
  })
}
