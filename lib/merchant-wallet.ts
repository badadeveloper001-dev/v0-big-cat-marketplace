import { createClient } from '@/lib/supabase/server'

const CREDIT_TYPES = ['escrow_release', 'payment', 'wallet_credit']
const DEBIT_TYPES = ['withdrawal', 'wallet_debit']

type WalletTransaction = {
  id: string
  order_id?: string | null
  merchant_id?: string | null
  type?: string | null
  amount?: number | null
  reason?: string | null
  status?: string | null
  created_at?: string | null
}

type WalletOrder = {
  id: string
  merchant_id?: string | null
  status?: string | null
  escrow_status?: string | null
  grand_total?: number | null
  total_amount?: number | null
  product_total?: number | null
  delivery_fee?: number | null
  order_items?: any[] | null
  items?: any[] | null
  created_at?: string | null
}

function toAmount(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeType(value: unknown) {
  return String(value || '').toLowerCase().trim()
}

function isMissingTransactionsTable(error: any) {
  const message = String(error?.message || '').toLowerCase()
  return message.includes("could not find the table 'public.transactions'")
    || message.includes('relation "public.transactions" does not exist')
}

function isCompletedStatus(value: unknown) {
  const status = String(value || '').toLowerCase().trim()
  if (!status) return true
  return status === 'completed' || status === 'success' || status === 'settled'
}

function isSettledOrder(order: WalletOrder) {
  const status = String(order?.status || '').toLowerCase().trim()
  const escrow = String(order?.escrow_status || '').toLowerCase().trim()
  return status === 'delivered' || status === 'completed' || escrow === 'released'
}

function getOrderPayoutAmount(order: WalletOrder) {
  const orderItems = Array.isArray(order.order_items)
    ? order.order_items
    : Array.isArray(order.items)
      ? order.items
      : []

  const itemsTotal = orderItems.reduce((sum: number, item: any) => {
    const quantity = Math.max(1, toAmount(item?.quantity || 1))
    const lineTotal = toAmount(item?.total_price || 0)
    const unitAmount = toAmount(item?.unit_price || item?.price || 0)
    if (lineTotal > 0) return sum + lineTotal
    if (unitAmount > 0) return sum + (unitAmount * quantity)
    return sum
  }, 0)

  const deliveryFee = Math.max(0, toAmount(order.delivery_fee))
  const grandTotal = Math.max(0, toAmount(order.grand_total ?? order.total_amount))
  const productTotal = Math.max(0, toAmount(order.product_total))
  return Math.max(0, itemsTotal || productTotal || (grandTotal - deliveryFee))
}

async function resolveMerchantKeys(supabase: any, merchantIdOrEmail: string) {
  const identifier = String(merchantIdOrEmail || '').trim()
  if (!identifier) return [] as string[]

  const keys = new Set<string>([identifier])

  const { data } = await (supabase.from('auth_users') as any)
    .select('id, email')
    .or(`id.eq.${identifier},email.eq.${identifier}`)
    .limit(1)
    .maybeSingle()

  if (data?.id) keys.add(String(data.id))
  if (data?.email) keys.add(String(data.email))

  return Array.from(keys).filter(Boolean)
}

async function getSettledOrdersForMerchant(supabase: any, merchantKeys: string[]) {
  if (!Array.isArray(merchantKeys) || merchantKeys.length === 0) return [] as WalletOrder[]

  const { data, error } = await (supabase.from('orders') as any)
    .select('id, merchant_id, status, escrow_status, grand_total, total_amount, product_total, delivery_fee, order_items, items, created_at')
    .in('merchant_id', merchantKeys)
    .or('status.in.(delivered,completed),escrow_status.eq.released')
    .order('created_at', { ascending: true })

  if (error || !Array.isArray(data)) return [] as WalletOrder[]
  return (data as WalletOrder[]).filter((order) => isSettledOrder(order))
}

function computeBalanceFromTransactions(rows: WalletTransaction[]) {
  return rows.reduce((sum, tx) => {
    const amount = Math.max(0, toAmount(tx.amount))
    const type = normalizeType(tx.type)

    if (CREDIT_TYPES.includes(type)) return sum + amount
    if (DEBIT_TYPES.includes(type)) return sum - amount
    return sum
  }, 0)
}

async function insertTransactionWithFallback(supabase: any, payload: Record<string, any>) {
  const now = new Date().toISOString()
  const attempts = [
    {
      ...payload,
      created_at: payload.created_at || now,
      status: payload.status || 'completed',
      reason: payload.reason || null,
      order_id: payload.order_id || null,
      buyer_id: payload.buyer_id || null,
    },
    {
      ...payload,
      status: payload.status || 'completed',
      reason: payload.reason || null,
      order_id: payload.order_id || null,
    },
    {
      ...payload,
      status: payload.status || 'completed',
      order_id: payload.order_id || null,
    },
    {
      ...payload,
      order_id: payload.order_id || null,
    },
  ]

  let lastError: any = null
  for (const attempt of attempts) {
    const { data, error } = await (supabase.from('transactions') as any).insert(attempt).select('*').maybeSingle()
    if (!error) return { success: true, data }
    lastError = error
  }

  return { success: false, error: lastError?.message || 'Failed to record transaction' }
}

export async function backfillMerchantWalletFromOrders(merchantId: string) {
  const id = String(merchantId || '').trim()
  if (!id) return

  try {
    const supabase = await createClient()
    const merchantKeys = await resolveMerchantKeys(supabase, id)
    if (merchantKeys.length === 0) return

    const orders = await getSettledOrdersForMerchant(supabase, merchantKeys)
    if (orders.length === 0) return

    // Get already-credited order IDs so we don't double-credit
    const { data: existingTx, error: txError } = await (supabase.from('transactions') as any)
      .select('order_id')
      .in('merchant_id', merchantKeys)
      .in('type', ['escrow_release', 'payment', 'wallet_credit'])
      .not('order_id', 'is', null)

    if (txError && isMissingTransactionsTable(txError)) {
      // No transactions table in this environment; skip backfill writes.
      return
    }

    const creditedOrderIds = new Set<string>(
      txError ? [] : (existingTx || []).map((tx: any) => String(tx.order_id || '')).filter(Boolean)
    )

    // Credit each uncredited delivered order
    for (const order of orders) {
      const orderId = String(order.id || '')
      if (!orderId || creditedOrderIds.has(orderId)) continue

      const amount = getOrderPayoutAmount(order)

      if (amount <= 0) continue

      const txMerchantId = String(order.merchant_id || id).trim() || id

      await creditMerchantWalletFromEscrow({
        supabase,
        orderId,
        merchantId: txMerchantId,
        amount,
        reason: `Backfill: escrow payout for order ${orderId}`,
      })
    }
  } catch {
    // Silently fail — backfill is best-effort
  }
}

export async function getMerchantWalletOverview(merchantId: string, options?: { limit?: number }) {
  const id = String(merchantId || '').trim()
  if (!id) return { success: false, error: 'Merchant id is required', balance: 0, transactions: [] as WalletTransaction[] }

  try {
    const supabase = await createClient()
    const merchantKeys = await resolveMerchantKeys(supabase, id)
    if (merchantKeys.length === 0) {
      return { success: true, balance: 0, transactions: [] as WalletTransaction[], withdrawalHistory: [] as WalletTransaction[] }
    }

    const { data, error } = await (supabase.from('transactions') as any)
      .select('id, order_id, merchant_id, type, amount, reason, status, created_at')
      .in('merchant_id', merchantKeys)
      .order('created_at', { ascending: false })
      .limit(Math.max(1, Math.min(options?.limit || 100, 500)))

    let rows = [] as WalletTransaction[]
    if (error) {
      if (!isMissingTransactionsTable(error)) {
        throw error
      }
    } else {
      rows = (data || []) as WalletTransaction[]
    }

    const completedRows = rows.filter((tx) => isCompletedStatus(tx.status))

    // Derive settled-order credits that are missing from transactions,
    // so merchants still see correct balance even if insert policies failed.
    const settledOrders = await getSettledOrdersForMerchant(supabase, merchantKeys)
    const creditedOrderIds = new Set(
      completedRows
        .filter((tx) => CREDIT_TYPES.includes(normalizeType(tx.type)))
        .map((tx) => String(tx.order_id || '').trim())
        .filter(Boolean)
    )

    const syntheticCredits: WalletTransaction[] = settledOrders
      .filter((order) => !creditedOrderIds.has(String(order.id || '').trim()))
      .map((order) => ({
        id: `derived-${String(order.id || '')}`,
        order_id: String(order.id || ''),
        merchant_id: id,
        type: 'wallet_credit',
        amount: getOrderPayoutAmount(order),
        reason: `Derived payout for settled order ${String(order.id || '')}`,
        status: 'completed',
        created_at: order.created_at || new Date().toISOString(),
      }))
      .filter((tx) => toAmount(tx.amount) > 0)

    const rowsWithDerived = [...rows, ...syntheticCredits]
    const completedRowsWithDerived = rowsWithDerived.filter((tx) => isCompletedStatus(tx.status))
    const balance = computeBalanceFromTransactions(completedRowsWithDerived)

    return {
      success: true,
      balance: Math.max(0, balance),
      transactions: rowsWithDerived,
      withdrawalHistory: rows.filter((tx) => DEBIT_TYPES.includes(normalizeType(tx.type))),
    }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to load wallet', balance: 0, transactions: [] as WalletTransaction[] }
  }
}

export async function creditMerchantWalletFromEscrow(params: {
  supabase: any
  orderId: string
  merchantId: string
  amount: number
  reason?: string
}) {
  const orderId = String(params.orderId || '').trim()
  const merchantId = String(params.merchantId || '').trim()
  const amount = Math.max(0, toAmount(params.amount))

  if (!orderId || !merchantId || amount <= 0) {
    return { success: false, error: 'orderId, merchantId and amount are required' }
  }

  try {
    const { data: existing, error: checkError } = await (params.supabase.from('transactions') as any)
      .select('id, type, amount, status')
      .eq('order_id', orderId)
      .eq('merchant_id', merchantId)
      .in('type', ['escrow_release', 'payment', 'wallet_credit'])
      .maybeSingle()

    if (!checkError && existing && isCompletedStatus(existing.status)) {
      return { success: true, skipped: true, reason: 'Escrow credit already recorded for this order' }
    }

    // Try escrow_release → payment → wallet_credit in order.
    // wallet_credit is guaranteed to be in CREDIT_TYPES and is the safest enum value.
    const attempts = [
      {
        order_id: orderId,
        merchant_id: merchantId,
        type: 'escrow_release',
        amount,
        reason: params.reason || `Escrow released for order ${orderId}`,
        status: 'completed',
        created_at: new Date().toISOString(),
      },
      {
        order_id: orderId,
        merchant_id: merchantId,
        type: 'payment',
        amount,
        reason: params.reason || `Escrow released for order ${orderId}`,
        status: 'completed',
        created_at: new Date().toISOString(),
      },
      {
        order_id: orderId,
        merchant_id: merchantId,
        type: 'wallet_credit',
        amount,
        reason: params.reason || `Escrow released for order ${orderId}`,
        status: 'completed',
        created_at: new Date().toISOString(),
      },
    ]

    let lastError: any = null
    for (const payload of attempts) {
      const inserted = await insertTransactionWithFallback(params.supabase, payload)
      if (inserted.success) {
        return { success: true, credited: amount, type: payload.type }
      }
      lastError = inserted.error
    }

    console.error('[wallet] creditMerchantWalletFromEscrow: all type attempts failed', { orderId, merchantId, amount, lastError })
    return { success: false, error: String(lastError || 'Failed to credit merchant wallet') }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to credit merchant wallet' }
  }
}

export async function createMerchantWithdrawal(params: {
  merchantId: string
  amount: number
  fee?: number
  netAmount?: number
  bankDisplay?: string
}) {
  const merchantId = String(params.merchantId || '').trim()
  const amount = Math.max(0, toAmount(params.amount))
  const fee = Math.max(0, toAmount(params.fee))
  const netAmount = Math.max(0, toAmount(params.netAmount || (amount - fee)))

  if (!merchantId || amount <= 0) {
    return { success: false, error: 'merchantId and amount are required', balance: 0 }
  }

  const overview = await getMerchantWalletOverview(merchantId, { limit: 300 })
  if (!overview.success) {
    return { success: false, error: overview.error || 'Failed to read wallet balance', balance: 0 }
  }

  if (overview.balance < amount) {
    return {
      success: false,
      error: 'Insufficient wallet balance',
      balance: overview.balance,
    }
  }

  const supabase = await createClient()
  const note = params.bankDisplay
    ? `Merchant withdrawal to ${params.bankDisplay}. Gross: ${amount}. Fee: ${fee}. Net: ${netAmount}.`
    : `Merchant withdrawal. Gross: ${amount}. Fee: ${fee}. Net: ${netAmount}.`

  const payloadAttempts = [
    {
      merchant_id: merchantId,
      type: 'withdrawal',
      amount,
      reason: note,
      status: 'completed',
      created_at: new Date().toISOString(),
    },
    {
      merchant_id: merchantId,
      type: 'wallet_debit',
      amount,
      reason: note,
      status: 'completed',
      created_at: new Date().toISOString(),
    },
  ]

  let inserted: any = null
  for (const payload of payloadAttempts) {
    const result = await insertTransactionWithFallback(supabase, payload)
    if (result.success) {
      inserted = { ...result.data, type: payload.type, amount }
      break
    }

    if (isMissingTransactionsTable(result.error)) {
      return {
        success: false,
        error: 'Withdrawals are temporarily unavailable while wallet transaction storage is being configured.',
        balance: overview.balance,
      }
    }
  }

  if (!inserted) {
    return { success: false, error: 'Failed to record withdrawal transaction', balance: overview.balance }
  }

  const nextBalance = Math.max(0, overview.balance - amount)
  return {
    success: true,
    balance: nextBalance,
    transaction: inserted,
  }
}
