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
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    property_type: '',
    property_usage: '',
  }

  const updateField = (field: keyof PropertyInfo, value: any) => {
    onChange({ ...formData, [field]: value })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Street Address *</label>
        <Input
          value={formData.street_address}
          onChange={(e) => updateField('street_address', e.target.value)}
          placeholder="123 Main St"
          className={errors.street_address ? 'border-red-500' : ''}
        />
        {errors.street_address && (
          <p className="text-xs text-red-500 mt-1">{errors.street_address}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Unit Number</label>
        <Input
          value={formData.unit_number || ''}
          onChange={(e) => updateField('unit_number', e.target.value)}
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
          value={formData.zip_code}
          onChange={(e) => updateField('zip_code', e.target.value.replace(/\D/g, '').slice(0, 10))}
          placeholder="10001"
          className={errors.zip_code ? 'border-red-500' : ''}
        />
        {errors.zip_code && (
          <p className="text-xs text-red-500 mt-1">{errors.zip_code}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Property Type *</label>
        <select
          value={formData.property_type}
          onChange={(e) => updateField('property_type', e.target.value)}
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
          value={formData.property_usage}
          onChange={(e) => updateField('property_usage', e.target.value)}
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
          value={formData.year_built || ''}
          onChange={(e) => updateField('year_built', e.target.value ? parseInt(e.target.value) : undefined)}
          placeholder="2000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Purchase Price</label>
        <Input
          type="number"
          value={formData.purchase_price || ''}
          onChange={(e) => updateField('purchase_price', e.target.value ? parseFloat(e.target.value) : undefined)}
          placeholder="500000"
        />
      </div>
    </div>
  )
}
