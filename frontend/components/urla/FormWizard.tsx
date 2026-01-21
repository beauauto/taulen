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
import { Form1003Layout, FormSection } from './Form1003Layout'
import { URLAFormData } from '@/types/urla'
import { urlaApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

// Map URLA section identifiers to backend section keys
function mapURLASectionToKey(urlaSection: string): string {
  const mapping: Record<string, string> = {
    'Section1a_PersonalInfo': 'section1a',
    'Section1b_CurrentEmployment': 'section1b',
    'Section1c_AdditionalEmployment': 'section1c',
    'Section1d_PreviousEmployment': 'section1d',
    'Section1e_OtherIncome': 'section1e',
    'Section2a_Assets': 'section2a',
    'Section2b_OtherAssetsCredits': 'section2b',
    'Section2c_Liabilities': 'section2c',
    'Section2d_Expenses': 'section2d',
    'Section3_RealEstateOwned': 'section3',
    'Section4_LoanPropertyInfo': 'section4',
    'Section5_Declarations': 'section5',
    'Section6_Acknowledgments': 'section6',
    'Section7_MilitaryService': 'section7',
    'Section8_Demographics': 'section8',
    'Section9_OriginatorInfo': 'section9',
    'Lender_L1_PropertyLoanInfo': 'lenderL1',
    'Lender_L2_TitleInfo': 'lenderL2',
    'Lender_L3_MortgageLoanInfo': 'lenderL3',
    'Lender_L4_Qualification': 'lenderL4',
    'ContinuationSheet': 'continuation',
    'UnmarriedAddendum': 'unmarriedAddendum',
  }
  return mapping[urlaSection] || urlaSection.toLowerCase()
}

// Map form sections to URLA section identifiers
const FORM_SECTIONS = [
  { id: 'borrower', title: 'Borrower Information', icon: '👤', urlaSection: 'Section1a_PersonalInfo' },
  { id: 'property', title: 'Property Information', icon: '🏠', urlaSection: 'Section4_LoanPropertyInfo' },
  { id: 'employment', title: 'Employment', icon: '💼', urlaSection: 'Section1b_CurrentEmployment' },
  { id: 'income', title: 'Income Details', icon: '💰', urlaSection: 'Section1e_OtherIncome' },
  { id: 'assets', title: 'Assets', icon: '💵', urlaSection: 'Section2a_Assets' },
  { id: 'liabilities', title: 'Debts & Liabilities', icon: '📋', urlaSection: 'Section2c_Liabilities' },
]

interface FormWizardProps {
  applicationId?: string
  initialData?: Partial<URLAFormData>
}

export function FormWizard({ applicationId, initialData }: FormWizardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  
  // Merge initial data with user data and pre-populated data
  const getInitialFormData = (): URLAFormData => {
    const baseData: URLAFormData = {
      borrower: {
        firstName: initialData?.borrower?.firstName || user?.firstName || '',
        lastName: initialData?.borrower?.lastName || user?.lastName || '',
        ssn: initialData?.borrower?.ssn || '',
        dateOfBirth: initialData?.borrower?.dateOfBirth || '',
        maritalStatus: initialData?.borrower?.maritalStatus || '',
        dependentsCount: initialData?.borrower?.dependentsCount || 0,
        citizenshipStatus: initialData?.borrower?.citizenshipStatus || '',
        email: initialData?.borrower?.email || user?.email || '',
        phone: initialData?.borrower?.phone || '',
      },
      property: initialData?.property || undefined,
      employment: initialData?.employment,
      income: initialData?.income,
      assets: initialData?.assets,
      liabilities: initialData?.liabilities,
    }
    return baseData
  }
  
  const [formData, setFormData] = useState<URLAFormData>(getInitialFormData())
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [progressData, setProgressData] = useState<{
    progressPercentage: number
    sections: Record<string, boolean>
    nextIncompleteSection?: string
  } | null>(null)
  const [isLoadingProgress, setIsLoadingProgress] = useState(false)

  // Update form data when user or initialData changes
  useEffect(() => {
    if (user || initialData) {
      setFormData((prev) => ({
        ...prev,
        borrower: {
          ...prev.borrower,
          firstName: initialData?.borrower?.firstName || user?.firstName || prev.borrower.firstName,
          lastName: initialData?.borrower?.lastName || user?.lastName || prev.borrower.lastName,
          email: initialData?.borrower?.email || user?.email || prev.borrower.email,
          dateOfBirth: initialData?.borrower?.dateOfBirth || prev.borrower.dateOfBirth,
          phone: initialData?.borrower?.phone || prev.borrower.phone,
        },
        property: initialData?.property || prev.property,
      }))
    }
  }, [user, initialData])

  // Load application data and progress on mount and when applicationId changes
  useEffect(() => {
    if (!applicationId) return

    const loadApplicationData = async () => {
      setIsLoadingProgress(true)
      try {
        // Load application data from database
        const appResponse = await urlaApi.getApplication(applicationId)
        const appData = appResponse.data
        
        // Load progress
        const progressResponse = await urlaApi.getApplicationProgress(applicationId)
        const progress = progressResponse.data
        
        setProgressData({
          progressPercentage: progress.progressPercentage || 0,
          sections: progress.sections || {},
          nextIncompleteSection: progress.nextIncompleteSection,
        })

        // Load saved form data from application
        if (appData) {
          const borrowerData = appData.borrower as any
          const savedFormData: Partial<URLAFormData> = {
            borrower: {
              firstName: borrowerData?.firstName || '',
              lastName: borrowerData?.lastName || '',
              middleName: borrowerData?.middleName || '',
              suffix: borrowerData?.suffix || '',
              email: borrowerData?.email || '',
              phone: borrowerData?.phone || '',
              ssn: borrowerData?.ssn || '',
              dateOfBirth: borrowerData?.dateOfBirth || '',
              maritalStatus: borrowerData?.maritalStatus || '',
              dependentsCount: borrowerData?.dependentsCount || 0,
              citizenshipStatus: borrowerData?.citizenshipStatus || '',
            },
            property: appData.property ? {
              streetAddress: (appData.property as any).streetAddress || '',
              city: (appData.property as any).city || '',
              state: (appData.property as any).state || '',
              zipCode: (appData.property as any).zipCode || '',
              propertyType: (appData.property as any).propertyType || '',
              propertyUsage: (appData.property as any).propertyUsage || '',
            } : undefined,
            employment: appData.employment as any,
            income: appData.income as any,
            assets: appData.assets as any,
            liabilities: appData.liabilities as any,
          }
          
          // Merge with initial data (initialData takes precedence for pre-application flow)
          setFormData((prev) => ({
            ...prev,
            ...savedFormData,
            borrower: {
              ...savedFormData.borrower!,
              ...initialData?.borrower,
            },
            property: savedFormData.property || initialData?.property || prev.property,
          }))
        }

        // Navigate to next incomplete section if available
        if (progress.nextIncompleteSection) {
          const sectionIndex = FORM_SECTIONS.findIndex(
            (s) => s.urlaSection === progress.nextIncompleteSection
          )
          if (sectionIndex !== -1) {
            setCurrentStep(sectionIndex)
          }
        }
      } catch (error) {
        console.error('Failed to load application data:', error)
      } finally {
        setIsLoadingProgress(false)
      }
    }

    loadApplicationData()
  }, [applicationId])

  // Auto-save on form data changes (debounced)
  useEffect(() => {
    if (!applicationId || isLoadingProgress) return

    const timer = setTimeout(() => {
      handleAutoSave()
    }, 2000) // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer)
  }, [formData, applicationId, isLoadingProgress])

  const handleAutoSave = async () => {
    if (!applicationId || isSaving || isLoadingProgress) return

    setIsSaving(true)
    try {
      // Save form data to database
      await urlaApi.saveApplication(applicationId, formData)
      
      // Also update progress to track current section
      const currentSection = FORM_SECTIONS[currentStep]
      if (currentSection) {
        // Update last_updated_section to track where user is (without marking as complete)
        await urlaApi.updateProgressSection(
          applicationId,
          currentSection.urlaSection,
          false // Not complete, just tracking position
        )
      }
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
//        if (!formData.borrower.maritalStatus) newErrors.maritalStatus = 'Marital status is required'
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

  const handleNext = async () => {
    if (validateCurrentSection()) {
      // Mark current section as complete
      if (applicationId) {
        const currentSection = FORM_SECTIONS[currentStep]
        try {
          await urlaApi.updateProgressSection(
            applicationId,
            currentSection.urlaSection,
            true
          )
          // Update local progress state
          if (progressData) {
            // Map URLA section to backend section key
            const sectionKey = mapURLASectionToKey(currentSection.urlaSection)
            setProgressData({
              ...progressData,
              sections: {
                ...progressData.sections,
                [sectionKey]: true,
              },
            })
          }
        } catch (error) {
          console.error('Failed to update progress:', error)
        }
      }

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

  // Build sections for Form1003Layout based on progress
  const buildSections = (): FormSection[] => {
    return FORM_SECTIONS.map((section, index) => {
      const sectionKey = mapURLASectionToKey(section.urlaSection)
      const isComplete = progressData?.sections[sectionKey] || false
      const isCurrent = index === currentStep
      
      return {
        id: section.id,
        title: section.title,
        completed: isComplete,
        current: isCurrent,
        locked: !isComplete && !isCurrent && index > currentStep,
      }
    })
  }

  const sections = buildSections()
  const currentSection = FORM_SECTIONS[currentStep]
  const progress = progressData?.progressPercentage ?? ((currentStep + 1) / FORM_SECTIONS.length) * 100

  // Show loading state while fetching application data
  if (isLoadingProgress) {
    return (
      <Form1003Layout
        sections={sections}
        currentSectionId={currentSection.id}
        title="Loading..."
        showNavigation={true}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-gray-500 mb-2">Loading application...</div>
            <div className="text-sm text-gray-400">Please wait while we load your saved data</div>
          </div>
        </div>
      </Form1003Layout>
    )
  }

  const handleSectionClick = async (sectionId: string) => {
    const sectionIndex = FORM_SECTIONS.findIndex((s) => s.id === sectionId)
    if (sectionIndex !== -1) {
      // Save current section before navigating
      if (applicationId && currentStep !== sectionIndex) {
        const currentSection = FORM_SECTIONS[currentStep]
        if (currentSection) {
          try {
            // Update last_updated_section to track navigation
            await urlaApi.updateProgressSection(
              applicationId,
              currentSection.urlaSection,
              false // Not marking as complete, just tracking position
            )
          } catch (error) {
            console.error('Failed to update section on navigation:', error)
          }
        }
      }
      setCurrentStep(sectionIndex)
    }
  }

  return (
    <Form1003Layout
      sections={sections}
      currentSectionId={currentSection.id}
      title={currentSection.title}
      showNavigation={true}
      onSectionClick={handleSectionClick}
    >
      <div className="space-y-6">
        {isSaving && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded text-sm">
            Saving...
          </div>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {currentSection.icon} {currentSection.title}
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
            <Button onClick={handleNext} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white">
              Next
            </Button>
          ) : (
            <div className="flex justify-center w-full">
              <Button onClick={handleSubmit} className="max-w-md w-full bg-amber-600 hover:bg-amber-700 text-white">
                Submit Application
              </Button>
            </div>
          )}
        </div>
      </div>
    </Form1003Layout>
  )
}
