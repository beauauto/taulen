'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

interface AddressModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (address: AddressData) => void
  initialAddress?: string
}

export interface AddressData {
  street: string
  city: string
  state: string
  zipCode: string
}

export function AddressModal({ isOpen, onClose, onSave, initialAddress }: AddressModalProps) {
  const [addressData, setAddressData] = useState<AddressData>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Parse initial address if provided (format: "Street, City, State Zip")
  useEffect(() => {
    if (initialAddress && isOpen) {
      const parts = initialAddress.split(',').map(p => p.trim())
      if (parts.length >= 3) {
        const street = parts[0]
        const city = parts[1]
        const stateZip = parts[2].split(' ')
        const state = stateZip[0] || ''
        const zipCode = stateZip.slice(1).join(' ') || ''
        
        setAddressData({
          street,
          city,
          state,
          zipCode,
        })
      } else {
        // If format doesn't match, try to extract what we can
        setAddressData({
          street: initialAddress,
          city: '',
          state: '',
          zipCode: '',
        })
      }
    } else if (isOpen && !initialAddress) {
      // Reset when opening with no initial address
      setAddressData({
        street: '',
        city: '',
        state: '',
        zipCode: '',
      })
    }
  }, [isOpen, initialAddress])

  const handleInputChange = (field: keyof AddressData, value: string) => {
    setAddressData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSave = () => {
    const newErrors: Record<string, string> = {}
    
    if (!addressData.street.trim()) {
      newErrors.street = 'Street address is required'
    }
    if (!addressData.city.trim()) {
      newErrors.city = 'City is required'
    }
    if (!addressData.state.trim()) {
      newErrors.state = 'State is required'
    }
    if (!addressData.zipCode.trim()) {
      newErrors.zipCode = 'Zip code is required'
    } else if (!/^\d{5}(-\d{4})?$/.test(addressData.zipCode.trim())) {
      newErrors.zipCode = 'Please enter a valid zip code (e.g., 12345 or 12345-6789)'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Format address as "Street, City, State Zip"
    const formattedAddress = `${addressData.street.trim()}, ${addressData.city.trim()}, ${addressData.state.trim()} ${addressData.zipCode.trim()}`
    
    onSave({
      ...addressData,
      street: addressData.street.trim(),
      city: addressData.city.trim(),
      state: addressData.state.trim(),
      zipCode: addressData.zipCode.trim(),
    })
    
    onClose()
  }

  const handleCancel = () => {
    setErrors({})
    onClose()
  }

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ pointerEvents: 'auto' }}>
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
        style={{ pointerEvents: 'auto' }}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto z-[10000]"
        style={{ pointerEvents: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Confirm Current Address</h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Street Address */}
          <div>
            <label htmlFor="modal-street" className="block text-sm font-medium text-gray-700 mb-2">
              Street Address <span className="text-red-500">*</span>
            </label>
            <Input
              id="modal-street"
              type="text"
              value={addressData.street}
              onChange={(e) => handleInputChange('street', e.target.value)}
              placeholder="123 Main Street"
              className={errors.street ? 'border-red-500' : ''}
              autoComplete="street-address"
            />
            {errors.street && (
              <p className="mt-1 text-sm text-red-600">{errors.street}</p>
            )}
          </div>

          {/* City */}
          <div>
            <label htmlFor="modal-city" className="block text-sm font-medium text-gray-700 mb-2">
              City <span className="text-red-500">*</span>
            </label>
            <Input
              id="modal-city"
              type="text"
              value={addressData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="New York"
              className={errors.city ? 'border-red-500' : ''}
              autoComplete="address-level2"
            />
            {errors.city && (
              <p className="mt-1 text-sm text-red-600">{errors.city}</p>
            )}
          </div>

          {/* State and Zip Code */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="modal-state" className="block text-sm font-medium text-gray-700 mb-2">
                State <span className="text-red-500">*</span>
              </label>
              <Input
                id="modal-state"
                type="text"
                value={addressData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="NY"
                maxLength={2}
                className={errors.state ? 'border-red-500' : ''}
                autoComplete="address-level1"
              />
              {errors.state && (
                <p className="mt-1 text-sm text-red-600">{errors.state}</p>
              )}
            </div>

            <div>
              <label htmlFor="modal-zip" className="block text-sm font-medium text-gray-700 mb-2">
                Zip Code <span className="text-red-500">*</span>
              </label>
              <Input
                id="modal-zip"
                type="text"
                value={addressData.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                placeholder="10001"
                maxLength={10}
                className={errors.zipCode ? 'border-red-500' : ''}
                autoComplete="postal-code"
              />
              {errors.zipCode && (
                <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Save Address
          </Button>
        </div>
      </div>
    </div>
  )

  // Use portal to render modal at document body level to avoid layout issues
  // This prevents the modal from affecting the layout of other pages
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body)
  }
  
  return null
}
