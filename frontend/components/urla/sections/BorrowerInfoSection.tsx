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
            value={data.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            placeholder="John"
            className={errors.firstName ? 'border-red-500' : ''}
          />
          {errors.firstName && (
            <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Middle Name</label>
          <Input
            value={data.middleName || ''}
            onChange={(e) => updateField('middleName', e.target.value)}
            placeholder="Michael"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Last Name *</label>
          <Input
            value={data.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            placeholder="Doe"
            className={errors.lastName ? 'border-red-500' : ''}
          />
          {errors.lastName && (
            <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
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
          value={data.dateOfBirth}
          onChange={(e) => updateField('dateOfBirth', e.target.value)}
          className={errors.dateOfBirth ? 'border-red-500' : ''}
        />
        {errors.dateOfBirth && (
          <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Marital Status *</label>
        <select
          value={data.maritalStatus}
          onChange={(e) => updateField('maritalStatus', e.target.value)}
          className={`w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ${
            errors.maritalStatus ? 'border-red-500' : ''
          }`}
        >
          <option value="">Select...</option>
          <option value="Single">Single</option>
          <option value="Married">Married</option>
          <option value="Separated">Separated</option>
          <option value="Divorced">Divorced</option>
          <option value="Widowed">Widowed</option>
        </select>
        {errors.maritalStatus && (
          <p className="text-xs text-red-500 mt-1">{errors.maritalStatus}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Number of Dependents</label>
        <Input
          type="number"
          min="0"
          value={data.dependentsCount || 0}
          onChange={(e) => updateField('dependentsCount', parseInt(e.target.value) || 0)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Citizenship Status *</label>
        <select
          value={data.citizenshipStatus}
          onChange={(e) => updateField('citizenshipStatus', e.target.value)}
          className={`w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ${
            errors.citizenshipStatus ? 'border-red-500' : ''
          }`}
        >
          <option value="">Select...</option>
          <option value="US Citizen">US Citizen</option>
          <option value="Permanent Resident">Permanent Resident</option>
          <option value="Non-Permanent Resident">Non-Permanent Resident</option>
        </select>
        {errors.citizenshipStatus && (
          <p className="text-xs text-red-500 mt-1">{errors.citizenshipStatus}</p>
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
          maxLength={14}
        />
      </div>
    </div>
  )
}
