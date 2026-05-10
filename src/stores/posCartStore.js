import { create } from 'zustand'

const emptyModifiers = () => ({
  note: '',
  cookingInstructions: '',
  customizations: [],
  addOns: [],
})

export const usePosCartStore = create((set, get) => ({
  mode: 'dine_in',
  tableId: '',
  guestsCount: 1,
  customerName: '',
  customerPhone: '',
  deliveryAddress: '',
  riderName: '',
  riderPhone: '',
  deliveryCharge: 0,
  discountAmount: 0,
  discountPercent: 0,
  serviceChargeAmount: null,
  promoCode: '',
  lines: [],

  setField: (key, value) => set({ [key]: value }),

  setMode: (mode) => set({ mode }),

  addLine: (menuItem) => {
    const id = String(menuItem._id)
    const lines = get().lines
    const i = lines.findIndex((l) => l.menuItemId === id)
    if (i >= 0) {
      const next = [...lines]
      next[i] = { ...next[i], quantity: next[i].quantity + 1 }
      set({ lines: next })
      return
    }
    set({
      lines: [
        ...lines,
        {
          menuItemId: id,
          name: menuItem.name,
          price: menuItem.price,
          taxRate: menuItem.taxRate || 0,
          image: menuItem.image,
          quantity: 1,
          ...emptyModifiers(),
        },
      ],
    })
  },

  updateLine: (menuItemId, patch) => {
    set({
      lines: get().lines.map((l) =>
        l.menuItemId === menuItemId ? { ...l, ...patch } : l,
      ),
    })
  },

  removeLine: (menuItemId) => {
    set({ lines: get().lines.filter((l) => l.menuItemId !== menuItemId) })
  },

  clearCart: () =>
    set({
      lines: [],
      customerName: '',
      customerPhone: '',
      promoCode: '',
      discountAmount: 0,
      discountPercent: 0,
      deliveryCharge: 0,
      serviceChargeAmount: null,
    }),

  cartTotals: () => {
    const { lines, discountAmount, discountPercent, deliveryCharge, mode } = get()
    let subtotal = 0
    let tax = 0
    for (const l of lines) {
      const line = l.price * l.quantity
      subtotal += line
      tax += (line * (l.taxRate || 0)) / 100
    }
    const discFlat = Number(discountAmount) || 0
    const discPct = Number(discountPercent) || 0
    let discount = discFlat
    if (discPct > 0) {
      discount += Math.round(subtotal * (discPct / 100) * 100) / 100
    }
    const dCharge = mode === 'delivery' ? Number(deliveryCharge) || 0 : 0
    const svc = get().serviceChargeAmount
    const service =
      svc != null && svc !== ''
        ? Number(svc)
        : 0
    const grand = Math.max(
      0,
      subtotal + tax + service + dCharge - discount,
    )
    return {
      subtotal,
      tax,
      serviceCharge: service,
      discount,
      deliveryCharge: dCharge,
      grandTotal: grand,
    }
  },
}))
