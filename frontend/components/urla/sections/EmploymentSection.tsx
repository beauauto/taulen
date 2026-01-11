'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmploymentInfo } from '@/types/urla'
import { Plus, Trash2 } from 'lucide-react'

interface EmploymentSectionProps {
  data: EmploymentInfo[]
  onChange: (data: EmploymentInfo[]) => void
  errors: Record<string, string>
}

export function EmploymentSection({ data, onChange, errors }: EmploymentSectionProps) {
  const [employments, setEmployments] = useState<EmploymentInfo[]>(
    data.length > 0 ? data : [createEmptyEmployment()]
  )

  function createEmptyEmployment(): EmploymentInfo {
    return {
      employerName: '',
      position: '',
      employmentType: '',
      startDate: '',
      monthlyIncome: 0,
    }
  }

  const updateEmployment = (index: number, field: keyof EmploymentInfo, value: any) => {
    const updated = [...employments]
    updated[index] = { ...updated[index], [field]: value }
    setEmployments(updated)
    onChange(updated)
  }

  const addEmployment = () => {
    const updated = [...employments, createEmptyEmployment()]
    setEmployments(updated)
    onChange(updated)
  }

  const removeEmployment = (index: number) => {
    if (employments.length > 1) {
      const updated = employments.filter((_, i) => i !== index)
      setEmployments(updated)
      onChange(updated)
    }
  }

  return (
    <div className="space-y-6">
      {employments.map((employment, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">
              {index === 0 ? 'Current Employment' : `Previous Employment ${index}`}
            </h3>
            {employments.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeEmployment(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Employer Name *</label>
            <Input
              value={employment.employerName}
              onChange={(e) => updateEmployment(index, 'employerName', e.target.value)}
              placeholder="ABC Company"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Position/Title</label>
            <Input
              value={employment.position}
              onChange={(e) => updateEmployment(index, 'position', e.target.value)}
              placeholder="Software Engineer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Employment Type</label>
            <select
              value={employment.employmentType}
              onChange={(e) => updateEmployment(index, 'employmentType', e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select...</option>
              <option value="Salaried">Salaried</option>
              <option value="Hourly">Hourly</option>
              <option value="Self-Employed">Self-Employed</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date *</label>
              <Input
                type="date"
                value={employment.startDate}
                onChange={(e) => updateEmployment(index, 'startDate', e.target.value)}
              />
            </div>

            {index > 0 && (
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <Input
                  type="date"
                  value={employment.endDate || ''}
                  onChange={(e) => updateEmployment(index, 'endDate', e.target.value)}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Monthly Income *</label>
            <Input
              type="number"
              value={employment.monthlyIncome || ''}
              onChange={(e) => updateEmployment(index, 'monthlyIncome', parseFloat(e.target.value) || 0)}
              placeholder="5000"
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addEmployment}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Previous Employment
      </Button>
    </div>
  )
}
