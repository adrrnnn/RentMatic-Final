'use client';

import { useState } from 'react';
import { X, CreditCard, Smartphone, Building2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/Button';
import { PaymentMethodIcon } from '@/components/payments/PaymentMethodIcon';
import { LandlordAccountService } from '@/lib/services/landlordAccountService';
import { useUserStore } from '@/store/useUserStore';
import { toast } from 'react-hot-toast';
import { getClientDb } from '@/lib/firebase';

interface PaymentSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyName: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: 'ewallet' | 'bank' | 'card' | 'retail';
  icon: string;
  description: string;
  enabled: boolean;
}

// Real Xendit payment methods for Philippines
const availablePaymentMethods: PaymentMethod[] = [
  { id: 'GCASH', name: 'GCash', type: 'ewallet', icon: 'gcash', description: 'Pay via GCash e-wallet', enabled: true },
  { id: 'GRABPAY', name: 'GrabPay', type: 'ewallet', icon: 'grabpay', description: 'Pay via GrabPay e-wallet', enabled: true },
  { id: 'PAYMAYA', name: 'PayMaya', type: 'ewallet', icon: 'maya', description: 'Pay via PayMaya e-wallet', enabled: true },
  { id: 'SHOPEEPAY', name: 'ShopeePay', type: 'ewallet', icon: 'shopeepay', description: 'Pay via ShopeePay e-wallet', enabled: true },
  { id: 'BPI', name: 'BPI', type: 'bank', icon: 'bpi', description: 'Pay via BPI online banking', enabled: true },
  { id: 'BDO', name: 'BDO', type: 'bank', icon: 'bdo', description: 'Pay via BDO online banking', enabled: true },
  { id: 'RCBC', name: 'RCBC', type: 'bank', icon: 'rcbc', description: 'Pay via RCBC online banking', enabled: true },
  { id: 'CREDIT_CARD', name: 'Credit Card', type: 'card', icon: 'credit_card', description: 'Visa, Mastercard, JCB', enabled: true },
  { id: '7ELEVEN', name: '7-Eleven', type: 'retail', icon: '7eleven', description: 'Pay at 7-Eleven stores', enabled: true },
  { id: 'CEBUANA', name: 'Cebuana Lhuillier', type: 'retail', icon: 'cebuana', description: 'Pay at Cebuana outlets', enabled: true }
];

export function PaymentSetupModal({ isOpen, onClose, propertyId, propertyName }: PaymentSetupModalProps) {
  const { user } = useUserStore();
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [xenditAccountId, setXenditAccountId] = useState<string | null>(null);

  const handleMethodToggle = (methodId: string) => {
    setSelectedMethods(prev => 
      prev.includes(methodId) 
        ? prev.filter(id => id !== methodId)
        : [...prev, methodId]
    );
  };

  const handleSetupPayments = async () => {
    if (selectedMethods.length === 0 || !user?.id || !user?.email || !user?.name) {
      toast.error('Please select payment methods and ensure you are logged in');
      return;
    }
    
    setIsSettingUp(true);
    setSetupError(null);
    
    try {
      // Step 1: Create or get landlord account
      const landlordAccount = await LandlordAccountService.createOrGetLandlordAccount(
        user.id,
        user.email,
        user.name
      );

      // Step 2: Create Xendit sub-account if not exists
      let finalAccount = landlordAccount;
      if (!landlordAccount.xenditSubAccountId) {
        const subAccountId = await LandlordAccountService.createXenditSubAccount(landlordAccount);
        setXenditAccountId(subAccountId);
        // Refresh account to get updated data
        finalAccount = await LandlordAccountService.getLandlordAccount(user.id);
        if (finalAccount) {
          setXenditAccountId(finalAccount.xenditSubAccountId || subAccountId);
        }
        toast.success('Xendit sub-account created successfully!');
      } else {
        setXenditAccountId(landlordAccount.xenditSubAccountId);
      }

      // Step 3: Save payment methods configuration
      const db = getClientDb();
      if (!db) throw new Error('Firestore not initialized');
      
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const configRef = doc(db, 'users', user.id, 'payment_config', propertyId);
      await setDoc(configRef, {
        propertyId,
        enabledMethods: selectedMethods,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setIsSettingUp(false);
      setSetupComplete(true);
      toast.success('Payment setup completed successfully!');
      
    } catch (error) {
      console.error('Payment setup error:', error);
      setIsSettingUp(false);
      setSetupError(error instanceof Error ? error.message : 'Setup failed');
      toast.error('Payment setup failed. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Setup Payments</h2>
              <p className="text-sm text-gray-600">Configure payment methods for {propertyName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!setupComplete ? (
            <>
              {/* Error State */}
              {setupError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center text-red-800">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <span className="font-medium">Setup Failed</span>
                  </div>
                  <p className="text-red-700 mt-1">{setupError}</p>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Select Payment Methods</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Choose which payment methods tenants can use to pay rent for this property.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availablePaymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedMethods.includes(method.id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleMethodToggle(method.id)}
                    >
                      <div className="flex items-center">
                        <div className="mr-3">
                          <PaymentMethodIcon icon={method.icon} size="md" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{method.name}</h4>
                          <p className="text-sm text-gray-600">{method.description}</p>
                        </div>
                        {selectedMethods.includes(method.id) && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Setup Button */}
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isSettingUp}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSetupPayments}
                  disabled={selectedMethods.length === 0 || isSettingUp}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSettingUp ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Setup Payments
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            /* Success State */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Setup Complete!</h3>
              <p className="text-gray-600 mb-6">
                Payment methods have been configured for {propertyName}. 
                You can now send payment links to your tenants.
              </p>
              
              {/* Xendit Account Details */}
              {xenditAccountId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                  <div className="flex items-center text-blue-800 mb-2">
                    <Building2 className="w-5 h-5 mr-2" />
                    <span className="font-medium">Xendit Account Created</span>
                  </div>
                  <p className="text-sm text-blue-700 font-mono break-all">
                    Account ID: {xenditAccountId}
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    ✓ Real Xendit account connected via Cloudflare Worker
                  </p>
                </div>
              )}

              {/* Enabled Payment Methods */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center text-green-800 mb-2">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Enabled Payment Methods:</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedMethods.map(methodId => {
                    const method = availablePaymentMethods.find(m => m.id === methodId);
                    return (
                      <span key={methodId} className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                        {method?.icon} {method?.name}
                      </span>
                    );
                  })}
                </div>
              </div>

              <Button
                onClick={onClose}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


