'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AssetInfo } from '@/types/urla'
import { Plus, Trash2 } from 'lucide-react'

interface AssetsSectionProps {
  data: AssetInfo[]
  onChange: (data: AssetInfo[]) => void
  errors: Record<string, string>
}

export function AssetsSection({ data, onChange, errors }: AssetsSectionProps) {
  const [assets, setAssets] = useState<AssetInfo[]>(
    data.length > 0 ? data : []
  )

  function createEmptyAsset(): AssetInfo {
    return {
      asset_type: '',
      description: '',
      current_value: 0,
    }
  }

  const updateAsset = (index: number, field: keyof AssetInfo, value: any) => {
    const updated = [...assets]
    updated[index] = { ...updated[index], [field]: value }
    setAssets(updated)
    onChange(updated)
  }

  const addAsset = () => {
    const updated = [...assets, createEmptyAsset()]
    setAssets(updated)
    onChange(updated)
  }

  const removeAsset = (index: number) => {
    const updated = assets.filter((_, i) => i !== index)
    setAssets(updated)
    onChange(updated)
  }

  const totalAssets = assets.reduce((sum, asset) => sum + (asset.current_value || 0), 0)

  return (
    <div className="space-y-4">
      {assets.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-8">
          No assets added yet. Click &quot;Add Asset&quot; to get started.
        </p>
      )}

      {assets.map((asset, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Asset {index + 1}</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeAsset(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Asset Type *</label>
            <select
              value={asset.asset_type}
              onChange={(e) => updateAsset(index, 'asset_type', e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select...</option>
              <option value="Checking Account">Checking Account</option>
              <option value="Savings Account">Savings Account</option>
              <option value="Money Market">Money Market</option>
              <option value="Stocks/Bonds">Stocks/Bonds</option>
              <option value="Retirement Account">Retirement Account</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input
              value={asset.description}
              onChange={(e) => updateAsset(index, 'description', e.target.value)}
              placeholder="Bank name, account type, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Current Value *</label>
            <Input
              type="number"
              value={asset.current_value || ''}
              onChange={(e) => updateAsset(index, 'current_value', parseFloat(e.target.value) || 0)}
              placeholder="10000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Account Last 4 Digits</label>
            <Input
              type="text"
              value={asset.account_last_four || ''}
              onChange={(e) => updateAsset(index, 'account_last_four', e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="1234"
              maxLength={4}
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addAsset}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Asset
      </Button>

      {assets.length > 0 && (
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Assets</span>
            <span className="text-lg font-semibold">${totalAssets.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  )
}
