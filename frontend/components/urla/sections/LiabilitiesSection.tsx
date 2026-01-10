'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LiabilityInfo } from '@/types/urla'
import { Plus, Trash2 } from 'lucide-react'

interface LiabilitiesSectionProps {
  data: LiabilityInfo[]
  onChange: (data: LiabilityInfo[]) => void
  errors: Record<string, string>
}

export function LiabilitiesSection({ data, onChange, errors }: LiabilitiesSectionProps) {
  const [liabilities, setLiabilities] = useState<LiabilityInfo[]>(
    data.length > 0 ? data : []
  )

  function createEmptyLiability(): LiabilityInfo {
    return {
      liability_type: '',
      creditor_name: '',
      monthly_payment: 0,
      outstanding_balance: 0,
    }
  }

  const updateLiability = (index: number, field: keyof LiabilityInfo, value: any) => {
    const updated = [...liabilities]
    updated[index] = { ...updated[index], [field]: value }
    setLiabilities(updated)
    onChange(updated)
  }

  const addLiability = () => {
    const updated = [...liabilities, createEmptyLiability()]
    setLiabilities(updated)
    onChange(updated)
  }

  const removeLiability = (index: number) => {
    const updated = liabilities.filter((_, i) => i !== index)
    setLiabilities(updated)
    onChange(updated)
  }

  const totalMonthlyPayments = liabilities.reduce(
    (sum, liability) => sum + (liability.monthly_payment || 0),
    0
  )
  const totalOutstanding = liabilities.reduce(
    (sum, liability) => sum + (liability.outstanding_balance || 0),
    0
  )

  return (
    <div className="space-y-4">
      {liabilities.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-8">
          No liabilities added yet. Click &quot;Add Liability&quot; to get started.
        </p>
      )}

      {liabilities.map((liability, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Liability {index + 1}</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeLiability(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Liability Type *</label>
            <select
              value={liability.liability_type}
              onChange={(e) => updateLiability(index, 'liability_type', e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select...</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Auto Loan">Auto Loan</option>
              <option value="Student Loan">Student Loan</option>
              <option value="Mortgage">Mortgage</option>
              <option value="Personal Loan">Personal Loan</option>
              <option value="Alimony">Alimony</option>
              <option value="Child Support">Child Support</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Creditor Name *</label>
            <Input
              value={liability.creditor_name}
              onChange={(e) => updateLiability(index, 'creditor_name', e.target.value)}
              placeholder="Bank of America"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Monthly Payment *</label>
            <Input
              type="number"
              value={liability.monthly_payment || ''}
              onChange={(e) => updateLiability(index, 'monthly_payment', parseFloat(e.target.value) || 0)}
              placeholder="500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Outstanding Balance *</label>
            <Input
              type="number"
              value={liability.outstanding_balance || ''}
              onChange={(e) => updateLiability(index, 'outstanding_balance', parseFloat(e.target.value) || 0)}
              placeholder="10000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Remaining Payments</label>
            <Input
              type="number"
              value={liability.remaining_payments || ''}
              onChange={(e) => updateLiability(index, 'remaining_payments', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="24"
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addLiability}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Liability
      </Button>

      {liabilities.length > 0 && (
        <div className="pt-4 border-t space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Monthly Payments</span>
            <span className="text-lg font-semibold">${totalMonthlyPayments.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Outstanding Balance</span>
            <span className="text-lg font-semibold">${totalOutstanding.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  )
}
