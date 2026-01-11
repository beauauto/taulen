'use client'

import { Input } from '@/components/ui/input'
import { PropertyInfo } from '@/types/urla'

interface PropertyInfoSectionProps {
  data?: PropertyInfo
  onChange: (data: PropertyInfo) => void
  errors: Record<string, string>
}

export function PropertyInfoSection({ data, onChange, errors }: PropertyInfoSectionProps) {
  const formData = data || {
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    propertyType: '',
    propertyUsage: '',
  }

  const updateField = (field: keyof PropertyInfo, value: any) => {
    onChange({ ...formData, [field]: value })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Street Address *</label>
        <Input
          value={formData.streetAddress}
          onChange={(e) => updateField('streetAddress', e.target.value)}
          placeholder="123 Main St"
          className={errors.streetAddress ? 'border-red-500' : ''}
        />
        {errors.streetAddress && (
          <p className="text-xs text-red-500 mt-1">{errors.streetAddress}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Unit Number</label>
        <Input
          value={formData.unitNumber || ''}
          onChange={(e) => updateField('unitNumber', e.target.value)}
          placeholder="Apt 4B"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">City *</label>
          <Input
            value={formData.city}
            onChange={(e) => updateField('city', e.target.value)}
            placeholder="New York"
            className={errors.city ? 'border-red-500' : ''}
          />
          {errors.city && (
            <p className="text-xs text-red-500 mt-1">{errors.city}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">State *</label>
          <Input
            value={formData.state}
            onChange={(e) => updateField('state', e.target.value.toUpperCase().slice(0, 2))}
            placeholder="NY"
            maxLength={2}
            className={errors.state ? 'border-red-500' : ''}
          />
          {errors.state && (
            <p className="text-xs text-red-500 mt-1">{errors.state}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">ZIP Code *</label>
        <Input
          value={formData.zipCode}
          onChange={(e) => updateField('zipCode', e.target.value.replace(/\D/g, '').slice(0, 10))}
          placeholder="10001"
          className={errors.zipCode ? 'border-red-500' : ''}
        />
        {errors.zipCode && (
          <p className="text-xs text-red-500 mt-1">{errors.zipCode}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Property Type *</label>
        <select
          value={formData.propertyType}
          onChange={(e) => updateField('propertyType', e.target.value)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select...</option>
          <option value="Single Family">Single Family</option>
          <option value="Condo">Condo</option>
          <option value="Townhouse">Townhouse</option>
          <option value="2-4 Unit">2-4 Unit</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Property Usage *</label>
        <select
          value={formData.propertyUsage}
          onChange={(e) => updateField('propertyUsage', e.target.value)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select...</option>
          <option value="Primary Residence">Primary Residence</option>
          <option value="Secondary Residence">Secondary Residence</option>
          <option value="Investment">Investment Property</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Year Built</label>
        <Input
          type="number"
          value={formData.yearBuilt || ''}
          onChange={(e) => updateField('yearBuilt', e.target.value ? parseInt(e.target.value) : undefined)}
          placeholder="2000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Purchase Price</label>
        <Input
          type="number"
          value={formData.purchasePrice || ''}
          onChange={(e) => updateField('purchasePrice', e.target.value ? parseFloat(e.target.value) : undefined)}
          placeholder="500000"
        />
      </div>
    </div>
  )
}
