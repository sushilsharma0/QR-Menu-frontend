import api from './api'

export async function fetchPosMeta() {
  const { data } = await api.get('/restaurant/pos/meta')
  return data.data
}

export async function fetchPosShift() {
  const { data } = await api.get('/restaurant/pos/shift')
  return data.data
}

export async function openPosShift(body) {
  const { data } = await api.post('/restaurant/pos/shift/open', body)
  return data.data
}

export async function closePosShift(body) {
  const { data } = await api.post('/restaurant/pos/shift/close', body)
  return data.data
}

export async function createPosOrder(payload) {
  const { data } = await api.post('/restaurant/pos/order', payload)
  return data.data
}

export async function fetchPosOrders(params) {
  const { data } = await api.get('/restaurant/pos/orders', { params })
  return data.data
}

export async function postPosPayment(payload) {
  const { data } = await api.post('/restaurant/pos/payment', payload)
  return data.data
}

export async function postPosRefund(payload) {
  const { data } = await api.post('/restaurant/pos/refund', payload)
  return data.data
}

export async function fetchPosReports() {
  const { data } = await api.get('/restaurant/pos/reports')
  return data.data
}

export async function savePosCartDraft(payload) {
  await api.post('/restaurant/pos/cart', { payload })
}

export async function loadPosCartDraft() {
  const { data } = await api.get('/restaurant/pos/cart')
  return data.data?.payload ?? null
}

export async function patchCustomerOrderStatus(orderId, body) {
  const { data } = await api.patch(`/restaurant/pos/order/${orderId}/status`, body)
  return data.data
}
