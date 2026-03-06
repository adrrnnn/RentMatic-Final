'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/Button';
import { PaymentRequest } from '@/components/payments/PaymentRequest';
import { XenditService, PaymentMethod } from '@/lib/services/xenditService';
import { PropertyService } from '@/lib/firestore/properties/propertyService';
import { UnitService } from '@/lib/firestore/properties/unitService';
import { TenantService } from '@/lib/firestore/properties/tenantService';
import { useUserStore } from '@/store/useUserStore';
import type { Property, Unit, Tenant } from '@/types/firestore';
import { ArrowLeft, CreditCard, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function TenantPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUserStore();
  const propertyId = searchParams.get('propertyId');
  const unitId = searchParams.get('unitId');
  const tenantId = searchParams.get('tenantId');
  
  const [paymentCreated, setPaymentCreated] = useState(false);
  const [paymentId, setPaymentId] = useState<string>('');
  const [availableMethods, setAvailableMethods] = useState<PaymentMethod[]>([]);
  const [property, setProperty] = useState<Property | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState<string>('');

  // Load real data from Firestore
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id || !propertyId) {
        toast.error('Missing required information. Redirecting...');
        router.push('/properties');
        return;
      }

      try {
        setLoading(true);
        console.log('🔍 [TENANT-PAYMENT] Loading data:', { userId: user.id, propertyId, unitId, tenantId });

        // Load property
        const propertyData = await PropertyService.getProperty(user.id, propertyId);
        if (!propertyData) {
          toast.error('Property not found');
          router.push('/properties');
          return;
        }
        setProperty(propertyData);
        console.log('✅ [TENANT-PAYMENT] Property loaded:', propertyData.name);

        // Load unit if unitId provided
        if (unitId) {
          const unitData = await UnitService.getUnit(user.id, propertyId, unitId);
          setUnit(unitData);
          setAmount(unitData.rentAmount || 0);
          setDescription(`Rent for ${unitData.name} - ${propertyData.name}`);
          console.log('✅ [TENANT-PAYMENT] Unit loaded:', unitData.name);

          // Load tenant if unit has tenantId
          if (unitData.tenantId) {
            const tenantData = await TenantService.getTenant(user.id, unitData.tenantId);
            setTenant(tenantData);
            console.log('✅ [TENANT-PAYMENT] Tenant loaded:', tenantData.fullName);
          }
        }

        // Load tenant directly if tenantId provided
        if (tenantId && !tenant) {
          const tenantData = await TenantService.getTenant(user.id, tenantId);
          setTenant(tenantData);
          console.log('✅ [TENANT-PAYMENT] Tenant loaded:', tenantData.fullName);
          
          // Try to find unit for this tenant
          if (tenantData.unitId && tenantData.propertyId === propertyId) {
            const unitData = await UnitService.getUnit(user.id, propertyId, tenantData.unitId);
            setUnit(unitData);
            setAmount(unitData.rentAmount || 0);
            setDescription(`Rent for ${unitData.name} - ${propertyData.name}`);
          }
        }

        // Load payment methods
        const methods = await XenditService.getAvailablePaymentMethods();
        setAvailableMethods(methods.filter(method => method.enabled));
      } catch (error: any) {
        console.error('❌ [TENANT-PAYMENT] Error loading data:', error);
        toast.error(`Failed to load data: ${error?.message || 'Unknown error'}`);
        router.push('/properties');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id, propertyId, unitId, tenantId, router]);

  const handlePaymentCreated = (id: string) => {
    setPaymentId(id);
    setPaymentCreated(true);
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment information...</p>
        </div>
      </div>
    );
  }

  if (!property || !user?.id) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Missing Information</h1>
            <p className="text-gray-600 mb-6">Property or user information not found.</p>
            <Button onClick={() => router.push('/properties')} className="bg-green-600 hover:bg-green-700 text-white">
              Back to Properties
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Tenant Not Found</h1>
            <p className="text-gray-600 mb-6">Please select a tenant with a unit assignment to create a payment request.</p>
            <Button onClick={() => router.push(`/properties/property-detail?id=${propertyId}`)} className="bg-green-600 hover:bg-green-700 text-white">
              Back to Property
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (paymentCreated) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Request Created</h1>
            <p className="text-gray-600 mb-6">
              Your payment request has been created successfully. Please complete the payment using your chosen method.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">Payment ID: {paymentId}</p>
              <p className="text-sm text-gray-600">Amount: ₱{amount.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Property: {property.name} {unit ? `- ${unit.name}` : ''}</p>
            </div>
            
            <div className="flex space-x-4 justify-center">
              <Button
                onClick={handleBack}
                variant="outline"
                className="px-6 py-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <Button
            onClick={handleBack}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Payment Request</h1>
            <p className="text-gray-600">
              {property.name} {unit ? `- ${unit.name}` : ''}
            </p>
            {tenant && (
              <p className="text-sm text-gray-500 mt-1">Tenant: {tenant.fullName}</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {tenant && (
            <PaymentRequest
              amount={amount || 0}
              description={description || `Rent payment for ${property.name}`}
              tenantId={tenant.id}
              propertyId={property.id}
              unitId={unit?.id || ''}
              tenantName={tenant.fullName}
              tenantEmail={tenant.contact?.email || ''}
              landlordUserId={user.id}
              unitName={unit?.name || 'N/A'}
              propertyName={property.name}
              availableMethods={availableMethods}
              onPaymentCreated={handlePaymentCreated}
            />
          )}
        </div>
      </div>
    </div>
  );
}
