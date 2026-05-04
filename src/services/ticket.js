import api from './api'

// Restaurant Ticket APIs
export const createTicket = (data) =>
  api.post('/restaurant/tickets', data)

export const getRestaurantTickets = (params) =>
  api.get('/restaurant/tickets', { params })

export const getRestaurantTicketDetail = (id) =>
  api.get(`/restaurant/tickets/${id}`)

export const addRestaurantReply = (id, message) =>
  api.post(`/restaurant/tickets/${id}/reply`, { message })

// Admin Ticket APIs
export const getAllTickets = (params) =>
  api.get('/platform/tickets', { params })

export const getAdminTicketDetail = (id) =>
  api.get(`/platform/tickets/${id}`)

export const addAdminReply = (id, message) =>
  api.post(`/platform/tickets/${id}/reply`, { message })

export const updateTicketStatus = (id, status) =>
  api.patch(`/platform/tickets/${id}/status`, { status })

export const assignTicket = (id) =>
  api.patch(`/platform/tickets/${id}/assign`)

export const getTicketStats = () =>
  api.get('/platform/tickets/stats')

export default {
  createTicket,
  getRestaurantTickets,
  getRestaurantTicketDetail,
  addRestaurantReply,
  getAllTickets,
  getAdminTicketDetail,
  addAdminReply,
  updateTicketStatus,
  assignTicket,
  getTicketStats
}
