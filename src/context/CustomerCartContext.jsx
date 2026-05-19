import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  addItemToGuestCart,
  clearGuestCart,
  ensureGuestSession,
  getCartItemCount,
  getGuestCart,
  removeGuestCartItem,
  setCartItemCount,
  updateGuestCartItem,
} from '../services/customer'

/**
 * Customer-side cart state.
 *
 * Goals:
 *  - Optimistic +/- updates so the UI never waits on the server.
 *  - One source of truth across MenuCategories, MenuItems, ItemDetails, Cart,
 *    FloatingCartBar and CartDrawer — no more localStorage polling.
 *  - Drawer open/close state lives here so any "Add to Cart" can pulse the bar
 *    or auto-open the cart preview without prop drilling.
 *
 * The server cart is the source of truth; we patch it after each user
 * interaction and reconcile the response back into local state. While a
 * server request is in flight we keep the optimistic view so taps feel
 * instant on slow networks.
 */

const CartContext = createContext(null)

const mapServerCart = (cart) => {
  const items = Array.isArray(cart?.items) ? cart.items : []
  return items.map((item) => ({
    lineId: item._id ? String(item._id) : null,
    menuItemId: item.menuItem?._id || item.menuItem,
    name: item.menuItem?.name || item.name || 'Item',
    image: item.menuItem?.image || item.image || '',
    price: Number(item.price || 0),
    quantity: Number(item.quantity || 0),
    note: item.notes || '',
    cookingInstructions: item.cookingInstructions || '',
    customizations: Array.isArray(item.customizations) ? item.customizations : [],
    addOns: Array.isArray(item.addOns) ? item.addOns : [],
  }))
}

const sumItems = (items) => items.reduce((acc, item) => acc + (item.quantity || 0), 0)
const sumTotal = (items) =>
  items.reduce((acc, item) => acc + Number(item.price || 0) * Number(item.quantity || 0), 0)

export const CustomerCartProvider = ({ children }) => {
  const [items, setItems] = useState([])
  const [guestId, setGuestId] = useState('')
  const [activeToken, setActiveToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDrawerOpen, setDrawerOpen] = useState(false)
  const [lastAddedAt, setLastAddedAt] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)

  const guestRef = useRef('')
  const tokenRef = useRef('')
  const hydrateRequestRef = useRef(0)
  const pendingAddKeysRef = useRef(new Set())

  useEffect(() => {
    guestRef.current = guestId
  }, [guestId])

  useEffect(() => {
    tokenRef.current = activeToken
  }, [activeToken])

  // Persist count locally so the very first paint after reload already shows
  // the bubble while we re-validate against the server.
  useEffect(() => {
    setCartItemCount(sumItems(items))
  }, [items])

  useEffect(() => {
    // Do not seed placeholder cart rows from localStorage. The badge and cart
    // drawer should only reflect real hydrated cart items, otherwise simply
    // opening an item page can show a stale cart count.
    if (getCartItemCount() > 0 && items.length === 0) setCartItemCount(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hydrate = useCallback(async (qrToken) => {
    if (!qrToken) return null
    const requestId = hydrateRequestRef.current + 1
    hydrateRequestRef.current = requestId
    try {
      setIsLoading(true)
      const session = await ensureGuestSession(qrToken)
      if (hydrateRequestRef.current !== requestId) return null
      const nextGuestId = session?.guestId || ''
      setGuestId(nextGuestId)
      setActiveToken(qrToken)
      if (nextGuestId) {
        const cart = await getGuestCart({ guestId: nextGuestId, qrToken })
        if (hydrateRequestRef.current !== requestId) return null
        const next = mapServerCart(cart)
        setItems(next)
        return next
      }
      if (session?.cart) {
        const next = mapServerCart(session.cart)
        if (hydrateRequestRef.current !== requestId) return null
        setItems(next)
        return next
      }
      return []
    } catch (err) {
      console.error('Cart hydrate failed', err)
      return null
    } finally {
      if (hydrateRequestRef.current === requestId) {
        setIsLoading(false)
      }
    }
  }, [])

  const refresh = useCallback(async () => {
    const qrToken = tokenRef.current
    const gid = guestRef.current
    if (!qrToken || !gid) return null
    try {
      const cart = await getGuestCart({ guestId: gid, qrToken })
      const next = mapServerCart(cart)
      setItems(next)
      return next
    } catch (err) {
      console.error('Cart refresh failed', err)
      return null
    }
  }, [])

  /**
   * Optimistically add an item. When customizations are present we always add a
   * new line; otherwise we merge by menuItemId so a tap on "+" on the list view
   * simply increments the existing line.
   */
  const addItem = useCallback(
    async (item, options = {}) => {
      const {
        quantity = 1,
        cookingInstructions = '',
        customizations = [],
        addOns = [],
        openDrawer = false,
      } = options

      const qrToken = tokenRef.current
      if (!qrToken) {
        return null
      }

      const addKey = JSON.stringify({
        m: String(item?._id || ''),
        c: customizations || [],
        k: String(cookingInstructions || ''),
        a: addOns || [],
      })
      if (pendingAddKeysRef.current.has(addKey)) return null
      pendingAddKeysRef.current.add(addKey)

      const optimisticId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const hasCustomization =
        (customizations && customizations.length > 0) ||
        (addOns && addOns.length > 0) ||
        Boolean(cookingInstructions)

      setItems((prev) => {
        if (!hasCustomization) {
          const existingIdx = prev.findIndex(
            (i) => i && i.menuItemId === item._id && !i.customizations?.length && !i.cookingInstructions,
          )
          if (existingIdx >= 0) {
            const next = [...prev]
            next[existingIdx] = {
              ...next[existingIdx],
              quantity: next[existingIdx].quantity + quantity,
            }
            return next
          }
        }
        return [
          ...prev.filter(Boolean),
          {
            lineId: optimisticId,
            menuItemId: item._id,
            name: item.name,
            image: item.image,
            price: Number(item.price || 0),
            quantity,
            cookingInstructions,
            customizations,
            addOns,
            note: '',
          },
        ]
      })
      setLastAddedAt(Date.now())
      if (openDrawer) setDrawerOpen(true)
      setPendingCount((c) => c + 1)

      try {
        const gid = guestRef.current || (await ensureGuestSession(qrToken)).guestId
        if (gid !== guestRef.current) setGuestId(gid)

        const cart = await addItemToGuestCart({
          guestId: gid,
          qrToken,
          menuItemId: item._id,
          quantity,
          cookingInstructions,
          customizations,
          addOns,
        })
        const next = mapServerCart(cart)
        setItems(next)
        return next
      } catch (err) {
        console.error('Add to cart failed', err)
        // Roll back optimistic state.
        await refresh()
        throw err
      } finally {
        pendingAddKeysRef.current.delete(addKey)
        setPendingCount((c) => Math.max(0, c - 1))
      }
    },
    [refresh],
  )

  /**
   * Increment a line. menuItemId required, lineId optional (needed when there
   * are multiple lines of the same menu item with different customizations).
   */
  const increment = useCallback(
    async (menuItemId, lineId) => {
      const qrToken = tokenRef.current
      const gid = guestRef.current
      if (!qrToken || !gid) return null

      let current = null
      setItems((prev) => {
        const idx = prev.findIndex((i) =>
          i && i.menuItemId === menuItemId && (lineId ? i.lineId === lineId : true),
        )
        if (idx < 0) return prev
        current = prev[idx]
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 }
        return next
      })
      if (!current) return null
      setPendingCount((c) => c + 1)

      try {
        const cart = await updateGuestCartItem({
          guestId: gid,
          qrToken,
          menuItemId,
          lineId: current.lineId && !String(current.lineId).startsWith('tmp-') ? current.lineId : undefined,
          quantity: current.quantity + 1,
        })
        const next = mapServerCart(cart)
        setItems(next)
        return next
      } catch (err) {
        console.error('Increment failed', err)
        await refresh()
        return null
      } finally {
        setPendingCount((c) => Math.max(0, c - 1))
      }
    },
    [refresh],
  )

  const decrement = useCallback(
    async (menuItemId, lineId) => {
      const qrToken = tokenRef.current
      const gid = guestRef.current
      if (!qrToken || !gid) return null

      let current = null
      setItems((prev) => {
        const idx = prev.findIndex((i) =>
          i && i.menuItemId === menuItemId && (lineId ? i.lineId === lineId : true),
        )
        if (idx < 0) return prev
        current = prev[idx]
        const nextQty = (prev[idx].quantity || 0) - 1
        if (nextQty <= 0) return prev.filter((_, i) => i !== idx)
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: nextQty }
        return next
      })
      if (!current) return null
      setPendingCount((c) => c + 1)

      try {
        if (current.quantity - 1 <= 0) {
          const cart = await removeGuestCartItem({
            guestId: gid,
            qrToken,
            menuItemId,
            lineId:
              current.lineId && !String(current.lineId).startsWith('tmp-')
                ? current.lineId
                : undefined,
          })
          setItems(mapServerCart(cart))
        } else {
          const cart = await updateGuestCartItem({
            guestId: gid,
            qrToken,
            menuItemId,
            lineId:
              current.lineId && !String(current.lineId).startsWith('tmp-')
                ? current.lineId
                : undefined,
            quantity: current.quantity - 1,
          })
          setItems(mapServerCart(cart))
        }
      } catch (err) {
        console.error('Decrement failed', err)
        await refresh()
      } finally {
        setPendingCount((c) => Math.max(0, c - 1))
      }
    },
    [refresh],
  )

  const removeLine = useCallback(
    async (menuItemId, lineId) => {
      const qrToken = tokenRef.current
      const gid = guestRef.current
      if (!qrToken || !gid) return null

      setItems((prev) =>
        prev.filter(
          (i) => !(i && i.menuItemId === menuItemId && (lineId ? i.lineId === lineId : true)),
        ),
      )
      setPendingCount((c) => c + 1)
      try {
        const cart = await removeGuestCartItem({
          guestId: gid,
          qrToken,
          menuItemId,
          lineId: lineId && !String(lineId).startsWith('tmp-') ? lineId : undefined,
        })
        setItems(mapServerCart(cart))
      } catch (err) {
        console.error('Remove failed', err)
        await refresh()
      } finally {
        setPendingCount((c) => Math.max(0, c - 1))
      }
    },
    [refresh],
  )

  const clear = useCallback(async () => {
    const qrToken = tokenRef.current
    const gid = guestRef.current
    if (!qrToken || !gid) return
    setItems([])
    try {
      await clearGuestCart({ guestId: gid, qrToken })
    } catch (err) {
      console.error('Clear cart failed', err)
      await refresh()
    }
  }, [refresh])

  // Counts derived from the live list.
  const totals = useMemo(() => {
    const safeItems = items.filter(Boolean)
    return {
      count: sumItems(safeItems),
      subtotal: sumTotal(safeItems),
    }
  }, [items])

  const openDrawer = useCallback(() => setDrawerOpen(true), [])
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  // Pulse helper: cards/buttons can subscribe to this to "wiggle" when an item
  // was just added (e.g. floating bar shakes, item card flashes).
  const consumePulse = useCallback(() => {
    if (!lastAddedAt) return false
    if (Date.now() - lastAddedAt < 1500) return true
    return false
  }, [lastAddedAt])

  const quantityFor = useCallback(
    (menuItemId) =>
      items
        .filter((i) => i && i.menuItemId === menuItemId && !i.customizations?.length && !i.cookingInstructions)
        .reduce((acc, i) => acc + (i.quantity || 0), 0),
    [items],
  )

  const value = useMemo(
    () => ({
      items: items.filter(Boolean),
      guestId,
      activeToken,
      isLoading,
      hasPending: pendingCount > 0,
      totals,
      isDrawerOpen,
      lastAddedAt,
      openDrawer,
      closeDrawer,
      hydrate,
      refresh,
      addItem,
      increment,
      decrement,
      removeLine,
      clear,
      consumePulse,
      quantityFor,
    }),
    [
      items,
      guestId,
      activeToken,
      isLoading,
      pendingCount,
      totals,
      isDrawerOpen,
      lastAddedAt,
      openDrawer,
      closeDrawer,
      hydrate,
      refresh,
      addItem,
      increment,
      decrement,
      removeLine,
      clear,
      consumePulse,
      quantityFor,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCustomerCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCustomerCart must be used inside <CustomerCartProvider>')
  }
  return ctx
}

export default CartContext
