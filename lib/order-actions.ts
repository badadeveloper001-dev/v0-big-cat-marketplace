'use server'

import { createClient } from '@/lib/supabase/server'
import { holdFundsInEscrow, releaseFundsFromEscrow } from '@/lib/escrow-actions'
import { getUserSafetyStatus } from '@/lib/server-trust-safety'
import { registerOrderForLogistics } from '@/lib/logistics-actions'
import { dispatchNotification } from '@/lib/notifications'

function isMissingColumnError(error: any) {
  const message = String(error?.message || '').toLowerCase()
  return message.includes('column') && (
    message.includes('does not exist')
    || message.includes('schema cache')
    || message.includes('could not find')
  )
}

function isMissingResourceError(error: any) {
  const message = String(error?.message || '').toLowerCase()
  return message.includes('does not exist')
    || message.includes('schema cache')
    || message.includes('could not find')
    || message.includes('relation')
    || message.includes('column')
}

function normalizeWorkflowStatus(input: string) {
  const raw = String(input || '').trim().toLowerCase()
  if (raw === 'order_received') return 'order_received'
  if (raw === 'order_packed') return 'order_packed'
  if (raw === 'order_taken_for_delivery') return 'order_taken_for_delivery'
  if (raw === 'order_in_transit') return 'in_transit'
  if (raw === 'order_completed') return 'completed'
  if (raw === 'order_received_and_satisfied') return 'delivered'

  // Backward compatibility with old statuses.
  if (raw === 'processing') return 'order_received'
  if (raw === 'shipped') return 'in_transit'
  return raw
}

function getTrackingId(orderId: string) {
  return `BC-${String(orderId || '').replace(/-/g, '').slice(0, 10).toUpperCase()}`
}

async function recordBuyerWalletRefund(
  supabase: any,
  buyerId: string,
  orderId: string,
  amount: number,
  insuranceAmount: number,
) {
  if (!buyerId || amount <= 0) return

  const payload = {
    buyer_id: buyerId,
    order_id: orderId,
    type: 'wallet_credit',
    amount,
    reason: `Order cancellation refund (insurance non-refundable: ₦${insuranceAmount.toLocaleString('en-NG')})`,
    status: 'completed',
    created_at: new Date().toISOString(),
  }

  const attempts = [
    payload,
    { ...payload, reason: payload.reason },
    { ...payload, buyer_id: buyerId, order_id: orderId, type: 'wallet_credit', amount },
  ]

  for (const attempt of attempts) {
    const result = await (supabase.from('transactions') as any).insert(attempt)
    if (!result.error) return
    if (!isMissingResourceError(result.error)) return
  }
}

export async function getBuyerOrders(buyerId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('orders').select('*, order_items(*, products(*))').eq('buyer_id', buyerId).order('created_at', { ascending: false })
    if (error) throw error

    const orderIds = Array.isArray(data) ? data.map((order: any) => String(order.id || '')).filter(Boolean) : []
    let assignmentByOrderId = new Map<string, any>()
    let riderById = new Map<string, any>()

    if (orderIds.length > 0) {
      const assignmentsResult = await (supabase.from('logistics_order_assignments') as any)
        .select('order_id, logistics_status, rider_id, assigned_at, completed_at, updated_at')
        .in('order_id', orderIds)

      console.log(`[getBuyerOrders] Fetched ${orderIds.length} orders, assignments result:`, {
        hasError: !!assignmentsResult.error,
        errorMessage: assignmentsResult.error?.message,
        count: Array.isArray(assignmentsResult.data) ? assignmentsResult.data.length : 0,
        sample: assignmentsResult.data?.[0]
      })

      if (assignmentsResult.error) {
        console.error(`[getBuyerOrders] Assignment query error:`, assignmentsResult.error)
      }

      if (!assignmentsResult.error && Array.isArray(assignmentsResult.data)) {
        assignmentByOrderId = new Map(assignmentsResult.data.map((row: any) => [String(row.order_id || '').trim(), row]))

        const riderIds = assignmentsResult.data
          .map((row: any) => String(row?.rider_id || '').trim())
          .filter(Boolean)

        console.log(`[getBuyerOrders] Found ${riderIds.length} rider IDs to fetch`)

        if (riderIds.length > 0) {
          const ridersResult = await (supabase.from('logistics_riders') as any)
            .select('id, name, phone, region')
            .in('id', riderIds)

          console.log(`[getBuyerOrders] Fetched riders:`, {
            hasError: !!ridersResult.error,
            errorMessage: ridersResult.error?.message,
            count: Array.isArray(ridersResult.data) ? ridersResult.data.length : 0,
            sample: ridersResult.data?.[0]
          })

          if (ridersResult.error) {
            console.error(`[getBuyerOrders] Riders query error:`, ridersResult.error)
          }

          if (!ridersResult.error && Array.isArray(ridersResult.data)) {
            riderById = new Map(ridersResult.data.map((row: any) => [String(row.id || '').trim(), row]))
          }
        }
      }
    }

    const enriched = (data || []).map((order: any) => {
      const assignment = assignmentByOrderId.get(String(order.id || '').trim())
      const rider = assignment?.rider_id ? riderById.get(String(assignment.rider_id || '').trim()) : null
      
      if (assignment && !rider && assignment.rider_id) {
        console.log(`[getBuyerOrders] Order ${order.id}: Found assignment with rider_id ${assignment.rider_id}, but rider not found in riderById map. Keys in map:`, Array.from(riderById.keys()).slice(0, 3))
      }
      
      return {
        ...order,
        tracking_id: getTrackingId(String(order.id || '')),
        logistics_status: String(assignment?.logistics_status || ''),
        rider_id: assignment?.rider_id || null,
        logistics_assigned_at: assignment?.assigned_at || null,
        logistics_completed_at: assignment?.completed_at || null,
        assigned_rider: rider || null,
      }
    })

    console.log(`[getBuyerOrders] Returning ${enriched.length} enriched orders`)
    return { success: true, data: enriched }
  } catch (error: any) {
    console.error(`[getBuyerOrders] Error:`, error)
    return { success: false, error: error.message, data: [] }
  }
}

export async function getMerchantOrders(merchantId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('orders').select('*, order_items(*, products(*)), auth_users!buyer_id(name, email)').eq('merchant_id', merchantId).order('created_at', { ascending: false })
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message, data: [] }
  }
}

type CreateOrderInput = {
  buyerId: string
  items: {
    productId: string
    merchantId: string
    productName?: string
    quantity: number
    unitPrice: number
    weight?: number
  }[]
  deliveryType: 'normal' | 'express' | 'pickup'
  deliveryAddress: string
  paymentMethod?: string
  deliveryFee?: number
}

export async function createOrder(
  payloadOrBuyerId: CreateOrderInput | string,
  merchantIdArg?: string,
  itemsArg?: { productId: string; quantity: number; price: number }[],
  totalAmountArg?: number,
  shippingAddressArg?: string,
) {
  try {
    const supabase = await createClient()

    const payload: CreateOrderInput = typeof payloadOrBuyerId === 'string'
      ? {
          buyerId: payloadOrBuyerId,
          items: (itemsArg || []).map((item) => ({
            productId: item.productId,
            merchantId: merchantIdArg || '',
            quantity: item.quantity,
            unitPrice: item.price,
          })),
          deliveryType: 'normal',
          deliveryAddress: shippingAddressArg || '',
          paymentMethod: 'card',
          deliveryFee: Math.max(0, (totalAmountArg || 0) - (itemsArg || []).reduce((sum, item) => sum + (item.price * item.quantity), 0)),
        }
      : payloadOrBuyerId

    if (!payload.buyerId || !payload.items?.length) {
      return { success: false, error: 'Order items are required.' }
    }

    const safetyStatus = await getUserSafetyStatus(payload.buyerId)
    if (safetyStatus.suspended) {
      return {
        success: false,
        error: 'Your account is temporarily suspended for violating platform policies.',
        code: 'POLICY_USER_SUSPENDED',
      }
    }

    const groupedItems = payload.items.reduce<Record<string, CreateOrderInput['items']>>((acc, item) => {
      const key = String(item.merchantId || '').trim() || 'unknown_merchant'
      if (!acc[key]) acc[key] = []
      acc[key].push(item)
      return acc
    }, {})

    const createdOrders: any[] = []

    for (const [merchantId, merchantItems] of Object.entries(groupedItems)) {
      const normalizedMerchantId = String(merchantId || '').trim()
      if (!normalizedMerchantId || normalizedMerchantId === 'unknown_merchant') {
        return { success: false, error: 'One or more cart items are missing merchant information. Please remove the item and add it again.' }
      }

      const productTotal = merchantItems.reduce((sum, item) => sum + (Number(item.unitPrice) * Number(item.quantity)), 0)
      const allocatedDeliveryFee = payload.deliveryType === 'pickup' ? 0 : (createdOrders.length === 0 ? Number(payload.deliveryFee || 0) : 0)
      const INSURANCE_RATE = 0.05 // Return delivery protection insurance: 5%
      const insuranceAmount = Math.round(productTotal * INSURANCE_RATE)
      const grandTotal = productTotal + allocatedDeliveryFee + insuranceAmount
      const orderId = crypto.randomUUID()

      const resolvedPaymentMethod = payload.paymentMethod || 'card'

      const orderInsertAttempts = [
        {
          id: orderId,
          buyer_id: payload.buyerId,
          merchant_id: normalizedMerchantId,
          status: 'paid',
          grand_total: grandTotal,
          product_total: productTotal,
          delivery_fee: allocatedDeliveryFee,
          total_amount: grandTotal,
          delivery_type: payload.deliveryType,
          delivery_address: payload.deliveryAddress,
          shipping_address: payload.deliveryAddress,
          payment_method: resolvedPaymentMethod,
          payment_status: 'completed',
        },
        {
          id: orderId,
          buyer_id: payload.buyerId,
          merchant_id: normalizedMerchantId,
          status: 'paid',
          grand_total: grandTotal,
          product_total: productTotal,
          delivery_fee: allocatedDeliveryFee,
          delivery_type: payload.deliveryType,
          delivery_address: payload.deliveryAddress,
          payment_method: resolvedPaymentMethod,
          payment_status: 'completed',
        },
        {
          id: orderId,
          buyer_id: payload.buyerId,
          merchant_id: normalizedMerchantId,
          status: 'paid',
          total_amount: grandTotal,
          delivery_fee: allocatedDeliveryFee,
          delivery_address: payload.deliveryAddress,
          payment_status: 'completed',
        },
        {
          id: orderId,
          buyer_id: payload.buyerId,
          merchant_id: normalizedMerchantId,
          status: 'paid',
          total_amount: grandTotal,
          delivery_fee: allocatedDeliveryFee,
          delivery_address: payload.deliveryAddress,
          payment_status: 'completed',
        },
        {
          id: orderId,
          buyer_id: payload.buyerId,
          merchant_id: normalizedMerchantId,
          status: 'paid',
          delivery_fee: allocatedDeliveryFee,
          delivery_address: payload.deliveryAddress,
        },
      ]

      let orderResult: any = null
      let lastOrderError: any = null

      for (const attempt of orderInsertAttempts) {
        const result = await (supabase.from('orders') as any).insert(attempt).select().single()
        if (!result.error) {
          orderResult = result
          break
        }

        if (!isMissingColumnError(result.error)) {
          throw result.error
        }

        lastOrderError = result.error
      }

      if (!orderResult?.data) {
        throw lastOrderError || new Error('Failed to create order')
      }

      const richOrderItems = merchantItems.map((item) => ({
        id: crypto.randomUUID(),
        order_id: orderResult.data?.id || orderId,
        product_id: item.productId,
        merchant_id: normalizedMerchantId,
        product_name: item.productName || 'Product',
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: Number(item.unitPrice) * Number(item.quantity),
        weight: item.weight ?? 0.5,
      }))

      let itemsResult = await (supabase.from('order_items') as any).insert(richOrderItems)

      if (itemsResult.error) {
        itemsResult = await (supabase.from('order_items') as any).insert(
          merchantItems.map((item) => ({
            order_id: orderResult.data?.id || orderId,
            product_id: item.productId,
            quantity: item.quantity,
            price: item.unitPrice,
          }))
        )
      }

      if (itemsResult.error) throw itemsResult.error

      await holdFundsInEscrow(
        supabase,
        {
          ...(orderResult.data || {}),
          id: orderResult.data?.id || orderId,
          merchant_id: normalizedMerchantId,
          product_total: productTotal,
          grand_total: grandTotal,
          total_amount: grandTotal,
          delivery_fee: allocatedDeliveryFee,
          payment_method: resolvedPaymentMethod,
          status: orderResult.data?.status || 'pending',
        },
        resolvedPaymentMethod,
      )

      const orderIdRef = String(orderResult.data?.id || orderId)

      await dispatchNotification({
        userId: normalizedMerchantId,
        type: 'order',
        title: 'You have a new order',
        message: `Order ${orderIdRef} was placed and is awaiting processing.`,
        eventKey: `order:new:merchant:${orderIdRef}`,
        emailSubject: 'New order received',
      })

      await dispatchNotification({
        userId: payload.buyerId,
        type: 'order',
        title: 'Your order has been received',
        message: `Order ${orderIdRef} has been received by the merchant.`,
        eventKey: `order:new:buyer:${orderIdRef}`,
        emailSubject: 'Order received',
      })

      await dispatchNotification({
        userId: payload.buyerId,
        type: 'order',
        title: 'Payment confirmation',
        message: `Payment for order ${orderIdRef} has been confirmed.`,
        eventKey: `order:payment-confirmed:${orderIdRef}`,
        metadata: {
          orderId: orderIdRef,
          trackingId: getTrackingId(orderIdRef),
          orderItems: merchantItems.map((item) => ({
            product_name: item.productName,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: Number(item.unitPrice) * Number(item.quantity),
            image_url: item.imageUrl || item.image || '',
            product_id: item.productId,
          })),
          subtotal: productTotal,
          deliveryFee: allocatedDeliveryFee,
          grandTotal: grandTotal,
          action: 'track_package',
          actionPath: `/track/${orderIdRef}`,
        },
        emailSubject: 'Payment confirmation',
      })

      const logisticsRegisteredAt: string | null = null

      try {
        await (supabase.from('order_automation_state') as any).upsert({
          order_id: orderIdRef,
          merchant_id: normalizedMerchantId,
          buyer_id: payload.buyerId,
          buyer_notified_at: new Date().toISOString(),
          merchant_notified_at: new Date().toISOString(),
          payment_notified_at: new Date().toISOString(),
          logistics_registered_at: logisticsRegisteredAt,
        }, { onConflict: 'order_id' })
      } catch (stateError: any) {
        if (!isMissingResourceError(stateError)) {
          throw stateError
        }
      }

      createdOrders.push(orderResult.data)
    }

    return {
      success: true,
      data: {
        id: createdOrders[0]?.id,
        orderId: createdOrders[0]?.id,
        orders: createdOrders,
      },
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateOrderStatus(orderId: string, status: string, actorId?: string) {
  try {
    const supabase = await createClient()
    const normalizedStatus = normalizeWorkflowStatus(status)

    const orderResult = await (supabase.from('orders') as any).select('*').eq('id', orderId).single()
    if (orderResult.error) throw orderResult.error

    const order = (orderResult.data || {}) as any
    const buyerId = String(order.buyer_id || '')
    const merchantId = String(order.merchant_id || '')
    const currentStatus = normalizeWorkflowStatus(String(order.status || ''))

    const actorRole = actorId
      ? (actorId === merchantId ? 'merchant' : actorId === buyerId ? 'buyer' : 'unknown')
      : 'system'

    if (actorRole === 'unknown') {
      return { success: false, error: 'You are not allowed to update this order.' }
    }

    const merchantAllowed = new Set([
      'order_received',
      'order_packed',
      'order_taken_for_delivery',
    ])

    const buyerAllowed = new Set([
      'delivered',
      'order_received_and_satisfied',
      'cancelled',
    ])

    if (actorRole === 'merchant' && !merchantAllowed.has(String(status || '').trim().toLowerCase()) && !merchantAllowed.has(normalizedStatus)) {
      return { success: false, error: 'Merchants can only update: Order Received, Order Packed, and Order Taken for Delivery.' }
    }

    if (actorRole === 'buyer' && !buyerAllowed.has(String(status || '').trim().toLowerCase()) && normalizedStatus !== 'delivered') {
      return { success: false, error: 'Buyers can only confirm: Order Received and Satisfied.' }
    }

    if (actorRole === 'merchant') {
      if (normalizedStatus === 'order_received' && !['paid', 'pending', 'order_received'].includes(currentStatus)) {
        return { success: false, error: 'Order must be paid before merchant can mark it as received.' }
      }
      if (normalizedStatus === 'order_packed' && !['order_received', 'order_packed'].includes(currentStatus)) {
        return { success: false, error: 'Merchant can only pack an order after marking it as received.' }
      }
      if (normalizedStatus === 'order_taken_for_delivery' && !['order_packed', 'order_taken_for_delivery'].includes(currentStatus)) {
        return { success: false, error: 'Merchant can only mark taken for delivery after order is packed.' }
      }
    }

    if (actorRole === 'buyer' && normalizedStatus === 'delivered' && !['completed', 'delivered'].includes(currentStatus)) {
      return { success: false, error: 'Buyer can confirm satisfaction only after logistics marks order as completed.' }
    }

    if (actorRole === 'buyer' && normalizedStatus === 'cancelled') {
      if (['cancelled', 'completed', 'delivered', 'in_transit'].includes(currentStatus)) {
        return { success: false, error: 'This order cannot be cancelled in its current state.' }
      }

      const assignmentResult = await (supabase.from('logistics_order_assignments') as any)
        .select('logistics_status, rider_id')
        .eq('order_id', orderId)
        .maybeSingle()

      if (!assignmentResult.error && assignmentResult.data) {
        const logisticsStatus = String(assignmentResult.data.logistics_status || '').toLowerCase().trim()
        const riderAssigned = !!assignmentResult.data.rider_id
          || ['assigned', 'in_transit', 'return_assigned', 'return_in_transit'].includes(logisticsStatus)

        if (riderAssigned) {
          return {
            success: false,
            error: 'A rider has already been assigned to this order. You can no longer cancel — please use Report Issue if there is a problem.',
          }
        }
      }
    }

    // Check for active disputes if marking as delivered
    if (normalizedStatus === 'delivered') {
      const { data: dispute, error: disputeError } = await (supabase.from('support_issues') as any)
        .select('id, status')
        .eq('order_id', orderId)
        .in('status', ['open', 'in_review'])
        .maybeSingle()

      if (!disputeError && dispute) {
        return {
          success: false,
          error: 'Cannot mark as delivered: This order has an active dispute. Funds are frozen until the dispute is resolved by BigCat admin.',
        }
      }
    }

    const updateAttempts = normalizedStatus === 'delivered'
      ? [
          { status: normalizedStatus, payment_status: 'completed', updated_at: new Date().toISOString() },
          { status: normalizedStatus, payment_status: 'completed' },
          { status: normalizedStatus, updated_at: new Date().toISOString() },
          { status: normalizedStatus },
        ]
      : normalizedStatus === 'cancelled'
        ? [
            { status: normalizedStatus, payment_status: 'refunded', updated_at: new Date().toISOString() },
            { status: normalizedStatus, payment_status: 'refunded' },
            { status: normalizedStatus, updated_at: new Date().toISOString() },
            { status: normalizedStatus },
          ]
      : [
          { status: normalizedStatus, updated_at: new Date().toISOString() },
          { status: normalizedStatus },
        ]

    let data: any = null
    let lastError: any = null

    for (const attempt of updateAttempts) {
      const result = await (supabase.from('orders') as any).update(attempt).eq('id', orderId).select().single()
      if (!result.error) {
        data = result.data
        break
      }
      lastError = result.error
    }

    if (!data && lastError) throw lastError

    const trackingId = getTrackingId(orderId)

    if (normalizedStatus === 'order_received') {
      if (buyerId) {
        await dispatchNotification({
          userId: buyerId,
          type: 'order',
          title: 'Merchant received your order',
          message: `Order ${orderId} has been received by the merchant and is being prepared.`,
          eventKey: `order:received-by-merchant:${orderId}`,
          emailSubject: 'Merchant received your order',
        })
      }
    }

    if (normalizedStatus === 'order_packed') {
      if (String(data?.delivery_type || '').toLowerCase() !== 'pickup') {
        await registerOrderForLogistics({
          order_id: String(data?.id || orderId),
          customer_name: 'Customer',
          customer_phone: '',
          customer_city: '',
          customer_state: '',
          delivery_address: String(data?.delivery_address || ''),
          items: Array.isArray(data?.order_items)
            ? data.order_items.map((item: any) => ({
                product_name: String(item?.product_name || 'Product'),
                quantity: Number(item?.quantity || 1),
              }))
            : [],
          total_amount: Number(data?.grand_total || data?.total_amount || 0),
          delivery_fee: Number(data?.delivery_fee || 0),
          status: 'pending',
        })
      }

      if (buyerId) {
        await dispatchNotification({
          userId: buyerId,
          type: 'order',
          title: 'Order packed by merchant',
          message: `Order ${orderId} is packed and has been sent to logistics for dispatch.`,
          eventKey: `order:packed:${orderId}`,
          emailSubject: 'Your order is packed',
        })
      }
    }

    if (normalizedStatus === 'order_taken_for_delivery') {
      if (buyerId) {
        await dispatchNotification({
          userId: buyerId,
          type: 'order',
          title: 'Order handed to logistics',
          message: `Order ${orderId} has been handed over to logistics. Tracking ID: ${trackingId}.`,
          eventKey: `order:handover:${orderId}`,
          metadata: {
            orderId,
            trackingId,
            action: 'track_package',
            actionPath: `/track/${orderId}`,
          },
          emailSubject: 'Order handed to logistics',
        })
      }
    }

    if (normalizedStatus === 'in_transit') {
      if (buyerId) {
        await dispatchNotification({
          userId: buyerId,
          type: 'order',
          title: 'Delivery update',
          message: `Order ${orderId} is now in transit. Tracking ID: ${trackingId}.`,
          eventKey: `order:delivery-update:${orderId}:${normalizedStatus}`,
          metadata: {
            orderId,
            trackingId,
            action: 'track_package',
            actionPath: `/track/${orderId}`,
          },
          emailSubject: 'Your order is in transit',
        })
      }
    }

    if (normalizedStatus === 'completed') {
      if (buyerId) {
        await dispatchNotification({
          userId: buyerId,
          type: 'order',
          title: 'Order delivered by logistics',
          message: `Order ${orderId} was delivered. Please confirm: Order Received and Satisfied to release merchant payment.`,
          eventKey: `order:logistics-completed:${orderId}`,
          metadata: {
            orderId,
            trackingId,
            action: 'track_package',
            actionPath: `/track/${orderId}`,
          },
          emailSubject: 'Order delivered - confirmation needed',
        })
      }
    }

    if (normalizedStatus === 'cancelled') {
      const productTotal = Math.max(0, Number(data?.product_total ?? order?.product_total ?? 0))
      const deliveryFee = Math.max(0, Number(data?.delivery_fee ?? order?.delivery_fee ?? 0))
      const grandTotal = Math.max(0, Number(data?.grand_total ?? order?.grand_total ?? 0))
      const insuranceAmount = Math.round(productTotal * 0.05)
      const refundAmount = productTotal > 0
        ? productTotal + deliveryFee
        : Math.max(0, grandTotal - insuranceAmount)

      if (buyerId && refundAmount > 0) {
        await recordBuyerWalletRefund(supabase, buyerId, orderId, refundAmount, insuranceAmount)
      }

      if (buyerId) {
        await dispatchNotification({
          userId: buyerId,
          type: 'order',
          title: 'Order cancelled & refund issued',
          message: refundAmount > 0
            ? `Order ${orderId} has been cancelled. ₦${refundAmount.toLocaleString('en-NG')} has been credited to your wallet (insurance charge of ₦${insuranceAmount.toLocaleString('en-NG')} is non-refundable).`
            : `Order ${orderId} has been cancelled.`,
          eventKey: `order:cancelled:buyer:${orderId}`,
          metadata: { orderId, refundAmount },
          emailSubject: 'Order cancelled',
        })
      }
      if (merchantId) {
        await dispatchNotification({
          userId: merchantId,
          type: 'order',
          title: 'Order cancelled',
          message: `Order ${orderId} has been cancelled.`,
          eventKey: `order:cancelled:merchant:${orderId}`,
          emailSubject: 'Order cancelled',
        })
      }

      return { success: true, data, refundAmount }
    }

    if (normalizedStatus === 'delivered') {
      if (buyerId) {
        await dispatchNotification({
          userId: buyerId,
          type: 'order',
          title: 'Order delivered',
          message: `Order ${orderId} has been delivered successfully.`,
          eventKey: `order:delivered:buyer:${orderId}`,
          emailSubject: 'Order delivered',
        })
      }
      if (merchantId) {
        await dispatchNotification({
          userId: merchantId,
          type: 'order',
          title: 'Order marked delivered',
          message: `Order ${orderId} was marked as delivered and settled.`,
          eventKey: `order:delivered:merchant:${orderId}`,
          emailSubject: 'Order delivered',
        })
      }

      const released = await releaseFundsFromEscrow(supabase, orderId, data)
      return {
        success: true,
        data: released?.order || data,
        disbursement: released?.breakdown || null,
      }
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
