'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BorrowerInfoSection } from './sections/BorrowerInfoSection'
import { PropertyInfoSection } from './sections/PropertyInfoSection'
import { EmploymentSection } from './sections/EmploymentSection'
import { IncomeSection } from './sections/IncomeSection'
import { AssetsSection } from './sections/AssetsSection'
import { LiabilitiesSection } from './sections/LiabilitiesSection'
import { URLAFormData } from '@/types/urla'
import { urlaApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

const FORM_SECTIONS = [
  { id: 'borrower', title: 'Borrower Information', icon: '👤' },
  { id: 'property', title: 'Property Information', icon: '🏠' },
  { id: 'employment', title: 'Employment', icon: '💼' },
  { id: 'income', title: 'Income Details', icon: '💰' },
  { id: 'assets', title: 'Assets', icon: '💵' },
  { id: 'liabilities', title: 'Debts & Liabilities', icon: '📋' },
]

interface FormWizardProps {
  applicationId?: number
  initialData?: Partial<URLAFormData>
}

export function FormWizard({ applicationId, initialData }: FormWizardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<URLAFormData>({
    borrower: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      ssn: '',
      dateOfBirth: '',
      maritalStatus: '',
      dependentsCount: 0,
      citizenshipStatus: '',
      email: user?.email || '',
    },
    ...initialData,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Auto-save on form data changes (debounced)
  useEffect(() => {
    if (!applicationId) return

    const timer = setTimeout(() => {
      handleAutoSave()
    }, 2000) // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer)
  }, [formData, applicationId])

  const handleAutoSave = async () => {
    if (!applicationId || isSaving) return

    setIsSaving(true)
    try {
      await urlaApi.saveApplication(applicationId, formData)
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const updateFormData = (section: string, data: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: data,
      currentSection: section,
    }))
    setErrors({})
  }

  const validateCurrentSection = (): boolean => {
    const section = FORM_SECTIONS[currentStep].id
    const newErrors: Record<string, string> = {}

    switch (section) {
      case 'borrower':
        if (!formData.borrower.firstName) newErrors.firstName = 'First name is required'
        if (!formData.borrower.lastName) newErrors.lastName = 'Last name is required'
        if (!formData.borrower.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required'
        if (!formData.borrower.ssn) newErrors.ssn = 'SSN is required'
        if (!formData.borrower.maritalStatus) newErrors.maritalStatus = 'Marital status is required'
        if (!formData.borrower.citizenshipStatus) newErrors.citizenshipStatus = 'Citizenship status is required'
        break
      case 'property':
        if (!formData.property?.streetAddress) newErrors.streetAddress = 'Street address is required'
        if (!formData.property?.city) newErrors.city = 'City is required'
        if (!formData.property?.state) newErrors.state = 'State is required'
        if (!formData.property?.zipCode) newErrors.zipCode = 'ZIP code is required'
        break
      // Add more validation as needed
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateCurrentSection()) {
      if (currentStep < FORM_SECTIONS.length - 1) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!validateCurrentSection()) return

    try {
      if (applicationId) {
        await urlaApi.updateApplicationStatus(applicationId, 'submitted')
        router.push('/applications')
      }
    } catch (error) {
      console.error('Submission failed:', error)
    }
  }

  const progress = ((currentStep + 1) / FORM_SECTIONS.length) * 100

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-semibold">Mortgage Application</h1>
            {isSaving && (
              <span className="text-xs text-gray-500">Saving...</span>
            )}
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Step {currentStep + 1} of {FORM_SECTIONS.length}
          </p>
        </div>
      </div>

      {/* Section Navigation (Mobile - Horizontal Scroll) */}
      <div className="bg-white border-b overflow-x-auto">
        <div className="flex space-x-1 px-4 py-2 min-w-max">
          {FORM_SECTIONS.map((section, index) => (
            <button
              key={section.id}
              onClick={() => setCurrentStep(index)}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                index === currentStep
                  ? 'bg-blue-50 text-blue-700'
                  : index < currentStep
                  ? 'bg-gray-100 text-gray-700'
                  : 'text-gray-400'
              }`}
            >
              <span className="mr-1">{section.icon}</span>
              <span className="hidden sm:inline">{section.title}</span>
              <span className="sm:hidden">{index + 1}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {FORM_SECTIONS[currentStep].icon} {FORM_SECTIONS[currentStep].title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentStep === 0 && (
              <BorrowerInfoSection
                data={formData.borrower}
                onChange={(data) => updateFormData('borrower', data)}
                errors={errors}
              />
            )}
            {currentStep === 1 && (
              <PropertyInfoSection
                data={formData.property}
                onChange={(data) => updateFormData('property', data)}
                errors={errors}
              />
            )}
            {currentStep === 2 && (
              <EmploymentSection
                data={formData.employment || []}
                onChange={(data) => updateFormData('employment', data)}
                errors={errors}
              />
            )}
            {currentStep === 3 && (
              <IncomeSection
                data={formData.income}
                onChange={(data) => updateFormData('income', data)}
                errors={errors}
              />
            )}
            {currentStep === 4 && (
              <AssetsSection
                data={formData.assets || []}
                onChange={(data) => updateFormData('assets', data)}
                errors={errors}
              />
            )}
            {currentStep === 5 && (
              <LiabilitiesSection
                data={formData.liabilities || []}
                onChange={(data) => updateFormData('liabilities', data)}
                errors={errors}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6 gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex-1"
          >
            Previous
          </Button>
          {currentStep < FORM_SECTIONS.length - 1 ? (
            <Button onClick={handleNext} className="flex-1">
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="flex-1">
              Submit Application
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
