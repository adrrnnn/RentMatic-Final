'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/Button';
import { BillingSettingsTabs } from '@/components/billing/BillingSettingsTabs';
import { UnitService } from '@/lib/firestore/properties/unitService';
import { TenantService } from '@/lib/firestore/properties/tenantService';
import { PropertyService } from '@/lib/firestore/properties/propertyService';
import { AutoReminderService } from '@/lib/services/autoReminderService';
import type { Property, Unit, Tenant } from '@/types/firestore';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useUserStore } from '@/store/useUserStore';

export default function PropertyBillingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useUserStore();
  const propertyId = params.get('propertyId');
  const unitIdParam = params.get('unitId');

  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(unitIdParam || null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user?.id || !propertyId) {
        router.push('/properties');
        return;
      }
      try {
        setLoading(true);
        const [p, fetchedUnits, allTenants] = await Promise.all([
          PropertyService.getProperty(user.id, propertyId),
          UnitService.getUnits(user.id, propertyId),
          TenantService.getTenants(user.id)
        ]);
        
        setProperty(p);
        setUnits(fetchedUnits);
        setTenants(allTenants);

        // If unitId in URL, set it as selected
        if (unitIdParam) {
          const unit = fetchedUnits.find(u => u.id === unitIdParam);
          if (unit) {
            setSelectedUnit(unit);
            if (unit.tenantId) {
              const tenant = allTenants.find(t => t.id === unit.tenantId);
              setSelectedTenant(tenant || null);
            }
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load billing data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id, propertyId, unitIdParam, router]);

  const handleUnitChange = (unitId: string) => {
    setSelectedUnitId(unitId);
    const unit = units.find(u => u.id === unitId);
    setSelectedUnit(unit || null);
    if (unit?.tenantId) {
      const tenant = tenants.find(t => t.id === unit.tenantId);
      setSelectedTenant(tenant || null);
    } else {
      setSelectedTenant(null);
    }
    // Update URL
    router.push(`/payments/billing?propertyId=${propertyId}&unitId=${unitId}`);
  };

  const handleSaveBillingSettings = async (billingSettings: Unit['billingSettings']) => {
    if (!selectedUnit || !user || !propertyId) return;
    
    try {
      setSaving(true);
      await UnitService.updateUnit(user.id, propertyId, selectedUnit.id, {
        billingSettings
      });
      
      // Update local state
      const updatedUnit = { ...selectedUnit, billingSettings };
      setSelectedUnit(updatedUnit);
      setUnits(prev => prev.map(u => u.id === updatedUnit.id ? updatedUnit : u));
      
      // Process automatic reminders if auto-send is enabled
      if (billingSettings?.autoSendReminders) {
        await AutoReminderService.processUnitReminders(user.id, propertyId, selectedUnit.id);
      }
      
      toast.success('Billing settings updated successfully');
    } catch (error) {
      console.error('Error updating billing settings:', error);
      toast.error('Failed to update billing settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-64 bg-gray-100 rounded" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-6">
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="mt-6 text-gray-600">Property not found.</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Unit Billing Settings</h1>
            <p className="text-sm text-gray-600">{property.name}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => router.push(`/properties/property-detail?id=${propertyId}&tab=payments`)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>

      {/* Unit Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Unit / Tenant
        </label>
        <select
          value={selectedUnitId || ''}
          onChange={(e) => handleUnitChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Choose a unit...</option>
          {units.map((unit) => {
            const unitTenant = tenants.find(t => t.id === unit.tenantId);
            return (
              <option key={unit.id} value={unit.id}>
                {unit.name} {unitTenant ? `- ${unitTenant.fullName}` : '(Vacant)'}
              </option>
            );
          })}
        </select>
      </div>

      {/* Billing Settings */}
      {selectedUnit ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <BillingSettingsTabs
            unit={selectedUnit}
            tenant={selectedTenant}
            onSave={handleSaveBillingSettings}
            onCancel={() => router.push(`/properties/property-detail?id=${propertyId}&tab=payments`)}
            loading={saving}
            propertyId={propertyId || undefined}
            userId={user?.id || undefined}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Unit Selected</h3>
          <p className="text-gray-600 mb-6">
            Select a unit above to configure its billing settings
          </p>
          {units.length === 0 && (
            <p className="text-sm text-gray-500">No units available in this property</p>
          )}
        </div>
      )}
    </div>
  );
}




