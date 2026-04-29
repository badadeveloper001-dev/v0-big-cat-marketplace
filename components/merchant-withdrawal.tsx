'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { formatNaira } from '@/lib/currency-utils'

interface WithdrawalRecord {
  id: string
  amount: number
  fee: number
  net: number
  timestamp: string
  bankAccount: string
  status: 'completed' | 'pending'
}

interface MerchantWithdrawalProps {
  merchantId: string
  walletBalance: number
  onBack: () => void
  onSuccess?: () => void
}

const WITHDRAWAL_FEE_PERCENT = 2.5
const MIN_WITHDRAWAL = 1000

export function MerchantWithdrawal({ merchantId, walletBalance, onBack, onSuccess }: MerchantWithdrawalProps) {
  const [step, setStep] = useState<'account' | 'amount' | 'confirm'>('account')
  const [bankAccount, setBankAccount] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountName, setAccountName] = useState('')
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalRecord[]>([])

  const getStorageKey = () => `merchant_withdrawal_history_${merchantId}`
  const getBankAccountKey = () => `merchant_bank_account_${merchantId}`

  useEffect(() => {
    // Load saved bank account and withdrawal history
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(getBankAccountKey())
      if (saved) {
        const parsed = JSON.parse(saved)
        setBankAccount(parsed.accountNumber || '')
        setBankName(parsed.bankName || '')
        setAccountName(parsed.accountName || '')
      }

      const history = localStorage.getItem(getStorageKey())
      if (history) {
        setWithdrawalHistory(JSON.parse(history))
      }
    }
  }, [merchantId])

  const amount = Number(withdrawalAmount) || 0
  const fee = Math.round(amount * (WITHDRAWAL_FEE_PERCENT / 100))
  const netAmount = amount - fee

  const canProceed = () => {
    if (step === 'account') {
      return bankAccount.trim() && bankName.trim() && accountName.trim()
    }
    if (step === 'amount') {
      return amount >= MIN_WITHDRAWAL && amount <= walletBalance
    }
    return true
  }

  const handleSaveBankAccount = () => {
    if (!bankAccount.trim() || !bankName.trim() || !accountName.trim()) {
      setError('Please fill in all bank details')
      return
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(getBankAccountKey(), JSON.stringify({ accountNumber: bankAccount, bankName, accountName }))
    }
    setError('')
    setStep('amount')
  }

  const handleAmountSubmit = () => {
    setError('')
    if (amount < MIN_WITHDRAWAL) {
      setError(`Minimum withdrawal is ${formatNaira(MIN_WITHDRAWAL)}`)
      return
    }
    if (amount > walletBalance) {
      setError('Insufficient wallet balance')
      return
    }
    setStep('confirm')
  }

  const handleConfirmWithdrawal = async () => {
    setIsSubmitting(true)
    setError('')

    try {
      // Create withdrawal record
      const record: WithdrawalRecord = {
        id: `withdrawal_${Date.now()}`,
        amount,
        fee,
        net: netAmount,
        timestamp: new Date().toISOString(),
        bankAccount: `${bankName} ****${bankAccount.slice(-4)}`,
        status: 'completed',
      }

      // Update withdrawal history
      const newHistory = [record, ...withdrawalHistory]
      if (typeof window !== 'undefined') {
        localStorage.setItem(getStorageKey(), JSON.stringify(newHistory))
      }
      setWithdrawalHistory(newHistory)

      // In a real system, you'd:
      // 1. Deduct from merchant wallet
      // 2. Create transaction record in backend
      // 3. Initiate bank transfer

      setWithdrawalAmount('')
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setStep('account')
        onSuccess?.()
      }, 2000)
    } catch (err) {
      setError('Failed to process withdrawal. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
        <div className="bg-background rounded-2xl p-8 text-center max-w-sm w-full">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="font-bold text-foreground mb-2">Withdrawal Initiated</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {formatNaira(netAmount)} will be transferred to your account within 24 hours.
          </p>
          <p className="text-xs text-muted-foreground">Processing fee: {formatNaira(fee)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center overflow-y-auto">
      <div className="bg-background rounded-2xl p-6 max-w-md w-full my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-foreground">Withdraw Funds</h2>
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Bank Account */}
        {step === 'account' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Account Name</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g., Amaka Obi"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Bank Name</label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
              >
                <option value="">Select a bank…</option>
                <option value="Access Bank">Access Bank</option>
                <option value="GTBank">GTBank</option>
                <option value="First Bank">First Bank</option>
                <option value="UBA">UBA</option>
                <option value="Zenith Bank">Zenith Bank</option>
                <option value="FCMB">FCMB</option>
                <option value="Stanbic IBTC">Stanbic IBTC</option>
                <option value="Standard Chartered">Standard Chartered</option>
                <option value="Ecobank">Ecobank</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Account Number (10 digits)</label>
              <input
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value.slice(0, 10))}
                placeholder="e.g., 1234567890"
                maxLength={10}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
              />
            </div>
            {error && (
              <div className="flex gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <button
              onClick={handleSaveBankAccount}
              disabled={!canProceed()}
              className="w-full bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Amount */}
        {step === 'amount' && (
          <div className="space-y-4">
            <div className="bg-secondary/30 rounded-xl p-3 text-sm">
              <p className="text-muted-foreground mb-1">Available Balance</p>
              <p className="font-bold text-foreground text-lg">{formatNaira(walletBalance)}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Amount to Withdraw</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground font-bold">₦</span>
                <input
                  type="number"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  placeholder={`Minimum: ${MIN_WITHDRAWAL}`}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Minimum: {formatNaira(MIN_WITHDRAWAL)}</p>
            </div>

            {amount > 0 && (
              <div className="bg-secondary/30 rounded-xl p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">{formatNaira(amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Processing Fee (2.5%)</span>
                  <span className="font-medium">{formatNaira(fee)}</span>
                </div>
                <div className="border-t border-border pt-1 mt-1 flex justify-between">
                  <span className="font-semibold text-foreground">You'll Receive</span>
                  <span className="font-bold text-primary">{formatNaira(netAmount)}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('account')}
                className="flex-1 border border-border text-foreground font-semibold py-2.5 rounded-xl hover:bg-secondary transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleAmountSubmit}
                disabled={!canProceed()}
                className="flex-1 bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Review
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="bg-secondary/30 rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">To</span>
                <div className="text-right">
                  <p className="font-semibold text-foreground text-sm">{accountName}</p>
                  <p className="text-xs text-muted-foreground">{bankName}</p>
                  <p className="text-xs text-muted-foreground">****{bankAccount.slice(-4)}</p>
                </div>
              </div>
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-foreground">{formatNaira(amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fee</span>
                <span className="font-semibold">{formatNaira(fee)}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="font-semibold text-foreground">You'll Receive</span>
                <span className="font-bold text-primary text-lg">{formatNaira(netAmount)}</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 space-y-1">
              <p className="font-semibold">Instant Transfer</p>
              <p>Funds will be transferred to your bank account within 24 hours.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('amount')}
                className="flex-1 border border-border text-foreground font-semibold py-2.5 rounded-xl hover:bg-secondary transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleConfirmWithdrawal}
                disabled={isSubmitting}
                className="flex-1 bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Confirm & Withdraw
              </button>
            </div>
          </div>
        )}

        {/* Withdrawal History */}
        {withdrawalHistory.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="font-semibold text-foreground mb-3 text-sm">Recent Withdrawals</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {withdrawalHistory.slice(0, 5).map((record) => (
                <div key={record.id} className="flex justify-between items-start text-xs p-2 rounded-lg bg-secondary/30">
                  <div>
                    <p className="font-medium text-foreground">{formatNaira(record.net)}</p>
                    <p className="text-muted-foreground">{record.bankAccount}</p>
                    <p className="text-muted-foreground">{new Date(record.timestamp).toLocaleDateString()}</p>
                  </div>
                  <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">Completed</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
