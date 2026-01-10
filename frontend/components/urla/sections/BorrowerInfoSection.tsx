'use client'

import { Input } from '@/components/ui/input'
import { BorrowerInfo } from '@/types/urla'

interface BorrowerInfoSectionProps {
  data: BorrowerInfo
  onChange: (data: BorrowerInfo) => void
  errors: Record<string, string>
}

export function BorrowerInfoSection({ data, onChange, errors }: BorrowerInfoSectionProps) {
  const updateField = (field: keyof BorrowerInfo, value: any) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">First Name *</label>
          <Input
            value={data.first_name}
            onChange={(e) => updateField('first_name', e.target.value)}
            placeholder="John"
            className={errors.first_name ? 'border-red-500' : ''}
          />
          {errors.first_name && (
            <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Middle Name</label>
          <Input
            value={data.middle_name || ''}
            onChange={(e) => updateField('middle_name', e.target.value)}
            placeholder="Michael"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Last Name *</label>
          <Input
            value={data.last_name}
            onChange={(e) => updateField('last_name', e.target.value)}
            placeholder="Doe"
            className={errors.last_name ? 'border-red-500' : ''}
          />
          {errors.last_name && (
            <p className="text-xs text-red-500 mt-1">{errors.last_name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Suffix</label>
          <Input
            value={data.suffix || ''}
            onChange={(e) => updateField('suffix', e.target.value)}
            placeholder="Jr., Sr., III"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Social Security Number *</label>
        <Input
          type="text"
          value={data.ssn}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 9)
            const formatted = value.replace(/(\d{3})(\d{2})(\d{4})/, '$1-$2-$3')
            updateField('ssn', formatted)
          }}
          placeholder="123-45-6789"
          maxLength={11}
          className={errors.ssn ? 'border-red-500' : ''}
        />
        {errors.ssn && (
          <p className="text-xs text-red-500 mt-1">{errors.ssn}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Date of Birth *</label>
        <Input
          type="date"
          value={data.date_of_birth}
          onChange={(e) => updateField('date_of_birth', e.target.value)}
          className={errors.date_of_birth ? 'border-red-500' : ''}
        />
        {errors.date_of_birth && (
          <p className="text-xs text-red-500 mt-1">{errors.date_of_birth}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Marital Status *</label>
        <select
          value={data.marital_status}
          onChange={(e) => updateField('marital_status', e.target.value)}
          className={`w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ${
            errors.marital_status ? 'border-red-500' : ''
          }`}
        >
          <option value="">Select...</option>
          <option value="Single">Single</option>
          <option value="Married">Married</option>
          <option value="Separated">Separated</option>
          <option value="Divorced">Divorced</option>
          <option value="Widowed">Widowed</option>
        </select>
        {errors.marital_status && (
          <p className="text-xs text-red-500 mt-1">{errors.marital_status}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Number of Dependents</label>
        <Input
          type="number"
          min="0"
          value={data.dependents_count || 0}
          onChange={(e) => updateField('dependents_count', parseInt(e.target.value) || 0)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Citizenship Status *</label>
        <select
          value={data.citizenship_status}
          onChange={(e) => updateField('citizenship_status', e.target.value)}
          className={`w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ${
            errors.citizenship_status ? 'border-red-500' : ''
          }`}
        >
          <option value="">Select...</option>
          <option value="US Citizen">US Citizen</option>
          <option value="Permanent Resident">Permanent Resident</option>
          <option value="Non-Permanent Resident">Non-Permanent Resident</option>
        </select>
        {errors.citizenship_status && (
          <p className="text-xs text-red-500 mt-1">{errors.citizenship_status}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <Input
          type="email"
          value={data.email || ''}
          onChange={(e) => updateField('email', e.target.value)}
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Phone Number</label>
        <Input
          type="tel"
          value={data.phone || ''}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 10)
            const formatted = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
            updateField('phone', formatted)
          }}
          placeholder="(555) 123-4567"
          maxLength={14}
        />
      </div>
    </div>
  )
}
