'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Form1003Layout, FormSection } from '@/components/urla/Form1003Layout'
import { BorrowerBasicInfoForm, BorrowerBasicInfoFormData } from '@/components/urla/BorrowerBasicInfoForm'
import { parsePhoneNumber } from '@/components/ui/PhoneInput'
import { urlaApi } from '@/lib/api'

interface BorrowerEditFormProps {
  applicationId?: string
  onSave: () => void
  onCancel: () => void
}

export function BorrowerEditForm({
  applicationId,
  onSave,
  onCancel,
}: BorrowerEditFormProps) {
  const [formData, setFormData] = useState<BorrowerBasicInfoFormData>({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    email: '',
    confirmEmail: '',
    phone: '',
    phoneType: '',
    maritalStatus: '',
    isVeteran: false,
    currentAddress: '',
    sameAsMailing: true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const sections: FormSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      current: true,
    },
    {
      id: 'getting-to-know-you',
      title: 'Loan & Property',
      locked: true,
    },
    {
      id: 'assets',
      title: 'Assets',
      locked: true,
    },
    {
      id: 'real-estate',
      title: 'Real Estate',
      locked: true,
    },
    {
      id: 'declarations',
      title: 'Declarations',
      locked: true,
    },
    {
      id: 'demographic-info',
      title: 'Demographic Info',
      locked: true,
    },
    {
      id: 'additional-questions',
      title: 'Additional Questions',
      locked: true,
    },
  ]

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load from sessionStorage first
        const borrowerDataStr = sessionStorage.getItem('borrowerData')
        if (borrowerDataStr) {
          const borrowerData = JSON.parse(borrowerDataStr)
          setFormData(prev => ({
            ...prev,
            firstName: borrowerData.firstName || prev.firstName,
            middleName: borrowerData.middleName || prev.middleName,
            lastName: borrowerData.lastName || prev.lastName,
            suffix: borrowerData.suffix || prev.suffix,
            email: borrowerData.email || prev.email,
            confirmEmail: borrowerData.email || prev.confirmEmail,
            phone: borrowerData.phone || prev.phone,
            phoneType: borrowerData.phoneType || prev.phoneType,
          }))
        }

        // If authenticated and have applicationId, load from API
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        if (applicationId && token) {
          try {
            const appResponse = await urlaApi.getApplication(applicationId)
            const appData = appResponse.data

            if (appData?.borrower) {
              const borrower = appData.borrower as any
              setFormData(prev => ({
                ...prev,
                firstName: borrower.firstName || prev.firstName,
                middleName: borrower.middleName || prev.middleName,
                lastName: borrower.lastName || prev.lastName,
                suffix: borrower.suffix || prev.suffix,
                email: borrower.email || prev.email,
                confirmEmail: borrower.email || prev.confirmEmail,
                phone: borrower.phone || prev.phone,
                phoneType: borrower.phoneType || prev.phoneType,
                maritalStatus: borrower.maritalStatus || prev.maritalStatus,
                isVeteran: borrower.militaryServiceStatus || borrower.isVeteran || prev.isVeteran,
                currentAddress: borrower.currentResidence?.fullAddress || prev.currentAddress,
              }))
            }
          } catch (error: any) {
            if (error.response?.status !== 401) {
              console.error('Failed to load borrower data:', error)
            }
          }
        }
      } catch (error) {
        console.error('Failed to load borrower data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [applicationId])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First Name is required'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last Name is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email Address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }
    if (formData.phoneType && !formData.phoneType.trim()) {
      newErrors.phoneType = 'Phone type is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Save to sessionStorage
      const borrowerData = {
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        suffix: formData.suffix,
        email: formData.email,
        phone: formData.phone,
        phoneType: formData.phoneType,
      }
      sessionStorage.setItem('borrowerData', JSON.stringify(borrowerData))

      // If authenticated and have applicationId, save to API
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (applicationId && token) {
        try {
          const response = await urlaApi.saveApplication(applicationId, {
            borrower: {
              firstName: formData.firstName,
              middleName: formData.middleName,
              lastName: formData.lastName,
              suffix: formData.suffix,
              email: formData.email,
              phone: parsePhoneNumber(formData.phone),
              phoneType: formData.phoneType,
              maritalStatus: formData.maritalStatus,
            },
          })
          console.log('Borrower data saved successfully:', response)
        } catch (error: any) {
          console.error('Failed to update borrower:', error)
          if (error.response?.status !== 401) {
            const errorMessage = error.response?.data?.error || error.message || 'Failed to save borrower information. Please try again.'
            setErrors({ submit: errorMessage })
            setIsSubmitting(false)
            return
          }
          // If 401, user is not authenticated - still save to sessionStorage and continue
        }
      }

      // Only call onSave if save was successful or if not authenticated (sessionStorage only)
      onSave()
    } catch (error) {
      console.error('Failed to save borrower information:', error)
      setErrors({ submit: 'Failed to save borrower information. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Form1003Layout
        sections={sections}
        currentSectionId="getting-started"
        title="Edit Borrower Information"
        onBack={onCancel}
      >
        <div className="text-center text-gray-500 py-12">Loading...</div>
      </Form1003Layout>
    )
  }

  return (
    <Form1003Layout
      sections={sections}
      currentSectionId="getting-started"
      title="Edit Borrower Information"
      onBack={onCancel}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {errors.submit}
          </div>
        )}

        <div className="bg-[#e6e6e6] rounded-lg p-3 md:p-4 text-left text-sm md:text-base text-[#334D5C] relative mb-2.5 md:mb-4 max-w-full inline-block">
          <div className="whitespace-pre-line">
            Update your personal information. All fields marked with * are required.
          </div>
          <div className="hidden lg:block absolute -left-2 bottom-0 w-0 h-0 border-l-[11px] border-l-transparent border-b-[11px] border-b-[#e6e6e6] border-r-[8px] border-r-[#e6e6e6]"></div>
        </div>

        <BorrowerBasicInfoForm
          formData={formData}
          errors={errors}
          onInputChange={handleInputChange}
          showMiddleName={true}
          showSuffix={true}
          showConfirmEmail={false}
          showPhoneType={true}
          showMaritalStatus={false}
          showVeteran={false}
          showAddress={false}
          showSameAsMailing={false}
          phoneRequired={true}
          useLegalLabel={false}
        />

        {/* Additional URLA 1003 Section 1 fields can be added here */}
        {/* Examples: Date of Birth, SSN, Citizenship Status, etc. */}

        <div className="pt-4 flex justify-center space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="px-8"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-amber-600 hover:bg-amber-700 text-white px-8"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Form1003Layout>
  )
}
