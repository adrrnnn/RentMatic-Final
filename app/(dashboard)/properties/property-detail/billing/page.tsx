'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  DollarSign, 
  Bell, 
  Clock, 
  Save, 
  X, 
  ArrowLeft,
  Building2,
  User
} from 'lucide-react';
import { Button } from '@/components/Button';
import { BillingSettingsTabs } from '@/components/billing/BillingSettingsTabs';
import { AutoReminderService } from '@/lib/services/autoReminderService';
import { UnitService } from '@/lib/firestore/properties/unitService';
import { TenantService } from '@/lib/firestore/properties/tenantService';
import { PropertyService } from '@/lib/firestore/properties/propertyService';
import { Unit, Tenant, Property } from '@/types/firestore';
import { useUserStore } from '@/store/useUserStore';
import { toast } from 'react-hot-toast';

export default function UnitBillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUserStore();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const propertyId = searchParams.get('propertyId');
  const unitId = searchParams.get('unitId');
  const returnTab = searchParams.get('tab') || 'overview';

  useEffect(() => {
    if (!user || !propertyId || !unitId) {
      router.push('/properties');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load property
        const propertyData = await PropertyService.getProperty(user.id, propertyId);
        setProperty(propertyData);
        
        // Load unit
        const unitData = await UnitService.getUnit(user.id, propertyId, unitId);
        setUnit(unitData);
        
        // Load tenant if unit is occupied
        if (unitData && unitData.tenantId) {
          const tenantData = await TenantService.getTenant(user.id, unitData.tenantId);
          setTenant(tenantData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load billing data');
        router.push('/properties');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, propertyId, unitId, router]);

  const handleSaveBillingSettings = async (billingSettings: Unit['billingSettings']) => {
    if (!unit || !user || !propertyId) return;
    
    try {
      setSaving(true);
      await UnitService.updateUnit(user.id, propertyId, unit.id, {
        billingSettings
      });
      
      // Update local state
      setUnit(prev => prev ? { ...prev, billingSettings } : null);
      
      // Process automatic reminders if auto-send is enabled
      if (billingSettings?.autoSendReminders) {
        await AutoReminderService.processUnitReminders(user.id, propertyId, unit.id);
      }
      
      toast.success('Billing settings updated successfully');
    } catch (error) {
      console.error('Error updating billing settings:', error);
      toast.error('Failed to update billing settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Return to the property detail page with the correct tab
    router.push(`/properties/property-detail?id=${propertyId}&tab=${returnTab}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading billing settings...</p>
        </div>
      </div>
    );
  }

  if (!property || !unit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unit Not Found</h2>
          <p className="text-gray-600 mb-4">The requested unit could not be found.</p>
          <Button onClick={() => router.push('/properties')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Properties
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {property.name} - {unit.name}
                  </h1>
                  <p className="text-sm text-gray-600">Billing Configuration</p>
                </div>
              </div>
            </div>
            
            {tenant && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>Occupied by {tenant.fullName}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <BillingSettingsTabs
            unit={unit}
            tenant={tenant}
            onSave={handleSaveBillingSettings}
            onCancel={handleCancel}
            loading={saving}
            propertyId={propertyId || undefined}
            userId={user?.id || undefined}
          />
        </motion.div>
      </div>
    </div>
  );
}











