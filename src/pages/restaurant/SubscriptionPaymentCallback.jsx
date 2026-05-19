import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FiAlertTriangle, FiCheckCircle, FiClock } from 'react-icons/fi'
import api from '../../services/api'
import Button from '../../components/common/Button'
import { useAuth } from '../../hooks/useAuth'
import { getTenantSegments, restaurantPortalBase } from '../../utils/tenantPaths'

const copy = {
  processing: {
    icon: FiClock,
    title: 'Verifying payment',
    message: 'Please wait while we confirm the transaction with the payment gateway.',
    tone: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  success: {
    icon: FiCheckCircle,
    title: 'Payment submitted',
    message: 'Your payment is verified by the gateway and is now pending platform approval.',
    tone: 'text-green-700 bg-green-50 border-green-200',
  },
  failed: {
    icon: FiAlertTriangle,
    title: 'Payment not completed',
    message: 'We could not verify this payment. You can return to subscriptions and try again.',
    tone: 'text-red-700 bg-red-50 border-red-200',
  },
}

const SubscriptionPaymentCallback = ({ gateway, failed = false }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [state, setState] = useState(failed ? 'failed' : 'processing')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let isMounted = true
    const verify = async () => {
      const params = new URLSearchParams(location.search)
      // skipErrorToast — the global axios interceptor would otherwise show
      // a toast and redirect on 401 (e.g. after gateway redirect when the
      // browser tab session is gone). The callback page handles UX itself.
      const requestOptions = { skipErrorToast: true }

      try {
        if (gateway === 'esewa') {
          if (params.get('data')) {
            await api.post(
              '/restaurant/subscription/pay/esewa/verify',
              { data: params.get('data') },
              requestOptions,
            )
          } else if (failed && params.get('transaction_uuid') && params.get('cancel_token')) {
            await api.post(
              '/restaurant/subscription/pay/esewa/cancel',
              {
                transaction_uuid: params.get('transaction_uuid'),
                cancel_token: params.get('cancel_token'),
              },
              requestOptions,
            )
            if (!isMounted) return
            const { slug, restaurantId } = getTenantSegments(user)
            if (slug && restaurantId) {
              navigate(`${restaurantPortalBase(slug, restaurantId)}/subscription`, { replace: true })
            } else {
              navigate('/login?role=restaurant', { replace: true })
            }
            return
          } else if (failed) {
            throw new Error('The gateway returned a failed or cancelled payment.')
          } else {
            throw new Error('Missing eSewa verification data.')
          }
        } else if (gateway === 'khalti') {
          const pidx = params.get('pidx')
          if (!pidx) {
            throw new Error('Missing Khalti pidx in callback URL.')
          }
          await api.post(
            '/restaurant/subscription/pay/khalti/verify',
            {
              pidx,
              purchase_order_id: params.get('purchase_order_id'),
              status: params.get('status'),
              transaction_id: params.get('transaction_id'),
              amount: params.get('amount'),
              total_amount: params.get('total_amount'),
            },
            requestOptions,
          )
        } else {
          throw new Error('Unknown payment gateway.')
        }
        if (isMounted) setState('success')
      } catch (error) {
        if (!isMounted) return
        setState('failed')
        setMessage(
          error.response?.data?.message ||
            error.message ||
            'Payment verification failed.',
        )
      }
    }

    verify()
    return () => {
      isMounted = false
    }
  }, [failed, gateway, location.search, navigate, user])

  const view = copy[state]
  const Icon = view.icon

  return (
    <div className="min-h-screen bg-surface-50 px-4 py-10">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
        <div className="w-full rounded-3xl border border-surface-200 bg-white p-6 text-center shadow-xl">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border ${view.tone}`}>
            <Icon className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-2xl font-black text-gray-950">{view.title}</h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">{message || view.message}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link to="/login?role=restaurant">
              <Button variant="secondary">Restaurant login</Button>
            </Link>
            <Link to="/">
              <Button>Go home</Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            If you are still signed in, open your restaurant subscription page to see the latest status.
          </p>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionPaymentCallback
