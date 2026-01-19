'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'

export interface PhoneInputProps {
  id?: string
  name?: string
  value: string
  onChange: (value: string) => void
  onPhoneTypeChange?: (value: string) => void
  phoneType?: string
  label?: string
  required?: boolean
  error?: string
  showPhoneType?: boolean
  className?: string
  autoComplete?: string
}

/**
 * Shared PhoneInput component that formats phone numbers consistently
 * Formats as (XXX) XXX-XXXX when showPhoneType is false
 * Allows unformatted input when showPhoneType is true (for forms that need phone type)
 */
export function PhoneInput({
  id = 'phone',
  name = 'phone',
  value,
  onChange,
  onPhoneTypeChange,
  phoneType = '',
  label = 'Phone number',
  required = true,
  error,
  showPhoneType = false,
  className = '',
  autoComplete = 'tel',
}: PhoneInputProps) {
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!showPhoneType) {
      // Format phone number as user types: (XXX) XXX-XXXX
      const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10)
      const formatted = digitsOnly.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
      onChange(formatted || digitsOnly)
    } else {
      // No formatting when phone type is shown (user can enter any format)
      onChange(e.target.value)
    }
  }

  return (
    <div className={showPhoneType ? "grid grid-cols-1 md:grid-cols-3 gap-4" : ""}>
      <div className={showPhoneType ? "md:col-span-2" : ""}>
        <Label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
          {!required && <span className="text-gray-400">(Optional)</span>}
        </Label>
        <Input
          id={id}
          name={name}
          type="tel"
          required={required}
          value={value}
          onChange={handlePhoneChange}
          className={`mt-1 ${error ? 'border-red-500' : ''} ${className}`}
          maxLength={showPhoneType ? undefined : 14}
          autoComplete={autoComplete}
        />
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
      {showPhoneType && onPhoneTypeChange && (
        <div>
          <Label htmlFor={`${id}Type`} className="text-sm font-medium text-gray-700">
            Phone type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={phoneType}
            onValueChange={onPhoneTypeChange}
            required
            className={`mt-1 ${error ? 'border-red-500' : ''}`}
          >
            <option value=""> </option>
            <option value="HOME">Home</option>
            <option value="MOBILE">Mobile</option>
            <option value="WORK">Work</option>
            <option value="OTHER">Other</option>
          </Select>
        </div>
      )}
    </div>
  )
}

/**
 * Utility function to parse phone number (remove formatting)
 * Use this when saving phone numbers to the backend
 */
export function parsePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '')
}

/**
 * Utility function to format phone number
 * Use this when displaying phone numbers
 */
export function formatPhoneNumber(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '').slice(0, 10)
  if (digitsOnly.length === 10) {
    return digitsOnly.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
  }
  return phone
}
