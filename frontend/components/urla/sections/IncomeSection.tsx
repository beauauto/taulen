'use client'

import { Input } from '@/components/ui/input'
import { IncomeInfo } from '@/types/urla'

interface IncomeSectionProps {
  data?: IncomeInfo
  onChange: (data: IncomeInfo) => void
  errors: Record<string, string>
}

export function IncomeSection({ data, onChange, errors }: IncomeSectionProps) {
  const formData = data || {
    base_income: 0,
    overtime: 0,
    bonuses: 0,
    commissions: 0,
    other_income: 0,
  }

  const updateField = (field: keyof IncomeInfo, value: any) => {
    onChange({ ...formData, [field]: value })
  }

  const totalIncome =
    (formData.base_income || 0) +
    (formData.overtime || 0) +
    (formData.bonuses || 0) +
    (formData.commissions || 0) +
    (formData.other_income || 0)

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Base Monthly Income *</label>
        <Input
          type="number"
          value={formData.base_income || ''}
          onChange={(e) => updateField('base_income', parseFloat(e.target.value) || 0)}
          placeholder="5000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Overtime Income</label>
        <Input
          type="number"
          value={formData.overtime || ''}
          onChange={(e) => updateField('overtime', parseFloat(e.target.value) || 0)}
          placeholder="500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Bonuses</label>
        <Input
          type="number"
          value={formData.bonuses || ''}
          onChange={(e) => updateField('bonuses', parseFloat(e.target.value) || 0)}
          placeholder="1000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Commissions</label>
        <Input
          type="number"
          value={formData.commissions || ''}
          onChange={(e) => updateField('commissions', parseFloat(e.target.value) || 0)}
          placeholder="2000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Other Income</label>
        <Input
          type="number"
          value={formData.other_income || ''}
          onChange={(e) => updateField('other_income', parseFloat(e.target.value) || 0)}
          placeholder="500"
        />
      </div>

      {formData.other_income && formData.other_income > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">Other Income Description</label>
          <Input
            value={formData.other_income_description || ''}
            onChange={(e) => updateField('other_income_description', e.target.value)}
            placeholder="Describe source of other income"
          />
        </div>
      )}

      <div className="pt-4 border-t">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Total Monthly Income</span>
          <span className="text-lg font-semibold">${totalIncome.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}
