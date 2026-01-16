'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { AddressModal, AddressData } from '@/components/urla/AddressModal'
import { MapPin } from 'lucide-react'

export interface BorrowerBasicInfoFormData {
  firstName: string
  middleName: string
  lastName: string
  suffix: string
  email: string
  confirmEmail: string
  phone: string
  phoneType: string
  maritalStatus: string
  isVeteran: boolean
  currentAddress: string
  sameAsMailing: boolean
}

export interface BorrowerBasicInfoFormProps {
  formData: BorrowerBasicInfoFormData
  errors: Record<string, string>
  onInputChange: (field: string, value: string | boolean) => void
  showMiddleName?: boolean
  showSuffix?: boolean
  showConfirmEmail?: boolean
  showPhoneType?: boolean
  showMaritalStatus?: boolean
  showVeteran?: boolean
  showAddress?: boolean
  showSameAsMailing?: boolean
  phoneRequired?: boolean
  addressRequired?: boolean
  useLegalLabel?: boolean
}

export function BorrowerBasicInfoForm({
  formData,
  errors,
  onInputChange,
  showMiddleName = true,
  showSuffix = true,
  showConfirmEmail = true,
  showPhoneType = true,
  showMaritalStatus = true,
  showVeteran = true,
  showAddress = true,
  showSameAsMailing = true,
  phoneRequired = true,
  addressRequired = true,
  useLegalLabel = true,
}: BorrowerBasicInfoFormProps) {
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)

  const handleAddressSave = (addressData: AddressData) => {
    const formattedAddress = `${addressData.street}, ${addressData.city}, ${addressData.state} ${addressData.zipCode}`
    onInputChange('currentAddress', formattedAddress)
    setIsAddressModalOpen(false)
  }

  const handleAddressFieldClick = () => {
    setIsAddressModalOpen(true)
  }

  return (
    <>
      <div className="space-y-4">
        <div>
          <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
            {useLegalLabel ? 'Legal ' : ''}First Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            required
            value={formData.firstName}
            onChange={(e) => onInputChange('firstName', e.target.value)}
            className={`mt-1 ${errors.firstName ? 'border-red-500' : ''}`}
            autoComplete="given-name"
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
          )}
        </div>

        {showMiddleName && (
          <div>
            <Label htmlFor="middleName" className="text-sm font-medium text-gray-700">
              Middle Name
              <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Optional</span>
            </Label>
            <Input
              id="middleName"
              name="middleName"
              type="text"
              value={formData.middleName}
              onChange={(e) => onInputChange('middleName', e.target.value)}
              className="mt-1"
              autoComplete="additional-name"
            />
          </div>
        )}

        <div>
          <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
            {useLegalLabel ? 'Legal ' : ''}Last Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="lastName"
            name="lastName"
            type="text"
            required
            value={formData.lastName}
            onChange={(e) => onInputChange('lastName', e.target.value)}
            className={`mt-1 ${errors.lastName ? 'border-red-500' : ''}`}
            autoComplete="family-name"
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
          )}
        </div>

        {showSuffix && (
          <div>
            <Label htmlFor="suffix" className="text-sm font-medium text-gray-700">
              Suffix
              <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Optional</span>
            </Label>
            <Input
              id="suffix"
              name="suffix"
              type="text"
              maxLength={4}
              value={formData.suffix}
              onChange={(e) => onInputChange('suffix', e.target.value)}
              className="mt-1"
              autoComplete="honorific-suffix"
              placeholder="Jr., Sr., III, IV, etc."
            />
            <p className="mt-1 text-xs text-gray-500">
              <strong>Examples:</strong> Jr., Sr., III, IV, etc.
            </p>
          </div>
        )}

        <div>
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
            className={`mt-1 ${errors.email ? 'border-red-500' : ''}`}
            autoComplete="email"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        {showConfirmEmail && (
          <div>
            <Label htmlFor="confirmEmail" className="text-sm font-medium text-gray-700">
              Confirm Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="confirmEmail"
              name="confirmEmail"
              type="email"
              required
              value={formData.confirmEmail}
              onChange={(e) => onInputChange('confirmEmail', e.target.value)}
              className={`mt-1 ${errors.confirmEmail ? 'border-red-500' : ''}`}
              autoComplete="email"
            />
            {errors.confirmEmail && (
              <p className="mt-1 text-sm text-red-500">{errors.confirmEmail}</p>
            )}
          </div>
        )}

        <div className={showPhoneType ? "grid grid-cols-1 md:grid-cols-3 gap-4" : ""}>
          <div className={showPhoneType ? "md:col-span-2" : ""}>
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
              Phone number {phoneRequired && <span className="text-red-500">*</span>}
              {!phoneRequired && <span className="text-gray-400">(Optional)</span>}
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              required={phoneRequired}
              value={formData.phone}
              onChange={(e) => {
                // Format phone number as user types (for sign up form style)
                if (!showPhoneType) {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                  const formatted = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
                  onInputChange('phone', formatted || value)
                } else {
                  onInputChange('phone', e.target.value)
                }
              }}
              className={`mt-1 ${errors.phone ? 'border-red-500' : ''}`}
              placeholder={showPhoneType ? "(___ ) ___-____" : "(555) 123-4567"}
              maxLength={showPhoneType ? undefined : 14}
              autoComplete="tel"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
            )}
          </div>
          {showPhoneType && (
            <div>
              <Label htmlFor="phoneType" className="text-sm font-medium text-gray-700">
                Phone type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.phoneType}
                onValueChange={(value) => onInputChange('phoneType', value)}
                required
                className={`mt-1 ${errors.phoneType ? 'border-red-500' : ''}`}
              >
                <option value=""> </option>
                <option value="HOME">Home</option>
                <option value="MOBILE">Mobile</option>
                <option value="WORK">Work</option>
                <option value="OTHER">Other</option>
              </Select>
              {errors.phoneType && (
                <p className="mt-1 text-sm text-red-500">{errors.phoneType}</p>
              )}
            </div>
          )}
        </div>

        {showMaritalStatus && (
          <div>
            <Label htmlFor="maritalStatus" className="text-sm font-medium text-gray-700">
              Marital Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.maritalStatus}
              onValueChange={(value) => onInputChange('maritalStatus', value)}
              required
              className={`mt-1 ${errors.maritalStatus ? 'border-red-500' : ''}`}
            >
              <option value="">- Select an option -</option>
              <option value="MARRIED">Married</option>
              <option value="SEPARATED">Separated</option>
              <option value="UNMARRIED">Unmarried</option>
            </Select>
            {errors.maritalStatus && (
              <p className="mt-1 text-sm text-red-500">{errors.maritalStatus}</p>
            )}
          </div>
        )}

        {showVeteran && (
          <div className="flex items-center space-x-3 py-2">
            <Switch
              id="isVeteran"
              checked={formData.isVeteran}
              onCheckedChange={(checked) => onInputChange('isVeteran', checked)}
            />
            <Label htmlFor="isVeteran" className="text-sm font-medium text-gray-700 cursor-pointer">
              Are you currently an active military personnel, a veteran, or a surviving spouse?
            </Label>
          </div>
        )}

        {showAddress && (
          <div>
            <Label htmlFor="currentAddress" className="text-sm font-medium text-gray-700">
              Current Address {addressRequired && <span className="text-red-500">*</span>}
            </Label>
            <div className="relative mt-1">
              <Input
                id="currentAddress"
                name="currentAddress"
                type="text"
                required={addressRequired}
                value={formData.currentAddress}
                onClick={handleAddressFieldClick}
                placeholder="Click to enter address"
                readOnly
                className={`${errors.currentAddress ? 'border-red-500' : ''} cursor-pointer pr-10`}
                autoComplete="street-address"
              />
              <button
                type="button"
                onClick={handleAddressFieldClick}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
                aria-label="Edit address"
              >
                <MapPin className="w-5 h-5" />
              </button>
            </div>
            {errors.currentAddress && (
              <p className="mt-1 text-sm text-red-500">{errors.currentAddress}</p>
            )}
            {addressRequired && (
              <p className="mt-1 text-xs text-gray-500">
                Click the field or icon to enter your address
              </p>
            )}
          </div>
        )}

        {showSameAsMailing && (
          <div className="flex items-center space-x-3 py-2">
            <Switch
              id="sameAsMailing"
              checked={formData.sameAsMailing}
              onCheckedChange={(checked) => onInputChange('sameAsMailing', checked)}
            />
            <Label htmlFor="sameAsMailing" className="text-sm font-medium text-gray-700 cursor-pointer">
              Same as mailing address
            </Label>
          </div>
        )}
      </div>

      {showAddress && (
        <AddressModal
          isOpen={isAddressModalOpen}
          onClose={() => setIsAddressModalOpen(false)}
          onSave={handleAddressSave}
          initialAddress={formData.currentAddress}
        />
      )}
    </>
  )
}
