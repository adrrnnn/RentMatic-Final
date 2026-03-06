"use client";

import React, { useState } from 'react';
import { Button } from '@/components/Button';
import { PaymentMethodIcon } from '@/components/payments/PaymentMethodIcon';
import { CreditCard, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface PaymentSetupWizardProps {
  onComplete: (selectedMethods: string[]) => void;
  onSkip: () => void;
}

export function PaymentSetupWizard({ onComplete, onSkip }: PaymentSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);

  const availableMethods = [
    {
      id: 'gcash',
      name: 'GCash',
      description: 'Mobile wallet payment',
      icon: 'gcash',
      category: 'ewallet'
    },
    {
      id: 'maya',
      name: 'Maya (PayMaya)',
      description: 'Mobile wallet payment',
      icon: 'maya',
      category: 'ewallet'
    },
    {
      id: 'grabpay',
      name: 'GrabPay',
      description: 'Mobile wallet payment',
      icon: 'grabpay',
      category: 'ewallet'
    },
    {
      id: 'bdo',
      name: 'BDO Online Banking',
      description: 'Bank transfer',
      icon: 'bdo',
      category: 'bank'
    },
    {
      id: 'bpi',
      name: 'BPI Online Banking',
      description: 'Bank transfer',
      icon: 'bpi',
      category: 'bank'
    },
    {
      id: 'metrobank',
      name: 'Metrobank Online',
      description: 'Bank transfer',
      icon: 'metrobank',
      category: 'bank'
    },
    {
      id: 'cash',
      name: 'Cash Payment',
      description: 'Manual collection',
      icon: 'cash',
      category: 'cash'
    }
  ];

  const handleMethodToggle = (methodId: string) => {
    setSelectedMethods(prev => {
      if (prev.includes(methodId)) {
        return prev.filter(id => id !== methodId);
      } else {
        return [...prev, methodId];
      }
    });
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(selectedMethods);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Set Up Payment Methods</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Choose how your tenants can pay rent. You can always add or remove methods later.
            </p>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">💡 Recommendation</h3>
                <p className="text-sm text-blue-800">
                  We recommend enabling at least one digital payment method (GCash, PayMaya) for convenience, 
                  plus bank transfer options for tenants who prefer traditional banking.
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Payment Methods</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableMethods.map((method) => (
                <motion.div
                  key={method.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedMethods.includes(method.id)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleMethodToggle(method.id)}
                >
                  <div className="flex items-center space-x-3">
                    <PaymentMethodIcon 
                      icon={method.icon} 
                      size="md" 
                      className="flex-shrink-0"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{method.name}</h3>
                      <p className="text-sm text-gray-600">{method.description}</p>
                      <span className="text-xs text-gray-500 capitalize">{method.category}</span>
                    </div>
                    {selectedMethods.includes(method.id) && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Review Your Selection</h2>
            <p className="text-gray-600 mb-6">
              You&apos;ve selected {selectedMethods.length} payment method{selectedMethods.length !== 1 ? 's' : ''}:
            </p>
            <div className="space-y-2 mb-8">
              {selectedMethods.map(methodId => {
                const method = availableMethods.find(m => m.id === methodId);
                return method ? (
                  <div key={methodId} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <PaymentMethodIcon 
                      icon={method.icon} 
                      size="sm" 
                      className="flex-shrink-0"
                    />
                    <span className="font-medium">{method.name}</span>
                  </div>
                ) : null;
              })}
            </div>
            {selectedMethods.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800">
                  ⚠️ No payment methods selected. You can still add them later in the Payments tab.
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">Step {currentStep} of 3</span>
              <span className="text-sm text-gray-500">Payment Setup</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="mb-8">
            {getStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <div>
              {currentStep > 1 && (
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="text-gray-600 hover:bg-gray-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={onSkip}
                variant="outline"
                className="text-gray-600 hover:bg-gray-50"
              >
                Skip for Now
              </Button>
              <Button
                onClick={handleNext}
                disabled={currentStep === 2 && selectedMethods.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {currentStep === 3 ? 'Complete Setup' : 'Next'}
                {currentStep < 3 && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

import React, { useState } from 'react';
import { Button } from '@/components/Button';
import { PaymentMethodIcon } from '@/components/payments/PaymentMethodIcon';
import { CreditCard, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface PaymentSetupWizardProps {
  onComplete: (selectedMethods: string[]) => void;
  onSkip: () => void;
}

export function PaymentSetupWizard({ onComplete, onSkip }: PaymentSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);

  const availableMethods = [
    {
      id: 'gcash',
      name: 'GCash',
      description: 'Mobile wallet payment',
      icon: 'gcash',
      category: 'ewallet'
    },
    {
      id: 'maya',
      name: 'Maya (PayMaya)',
      description: 'Mobile wallet payment',
      icon: 'maya',
      category: 'ewallet'
    },
    {
      id: 'grabpay',
      name: 'GrabPay',
      description: 'Mobile wallet payment',
      icon: 'grabpay',
      category: 'ewallet'
    },
    {
      id: 'bdo',
      name: 'BDO Online Banking',
      description: 'Bank transfer',
      icon: 'bdo',
      category: 'bank'
    },
    {
      id: 'bpi',
      name: 'BPI Online Banking',
      description: 'Bank transfer',
      icon: 'bpi',
      category: 'bank'
    },
    {
      id: 'metrobank',
      name: 'Metrobank Online',
      description: 'Bank transfer',
      icon: 'metrobank',
      category: 'bank'
    },
    {
      id: 'cash',
      name: 'Cash Payment',
      description: 'Manual collection',
      icon: 'cash',
      category: 'cash'
    }
  ];

  const handleMethodToggle = (methodId: string) => {
    setSelectedMethods(prev => {
      if (prev.includes(methodId)) {
        return prev.filter(id => id !== methodId);
      } else {
        return [...prev, methodId];
      }
    });
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(selectedMethods);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Set Up Payment Methods</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Choose how your tenants can pay rent. You can always add or remove methods later.
            </p>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">💡 Recommendation</h3>
                <p className="text-sm text-blue-800">
                  We recommend enabling at least one digital payment method (GCash, PayMaya) for convenience, 
                  plus bank transfer options for tenants who prefer traditional banking.
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Payment Methods</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableMethods.map((method) => (
                <motion.div
                  key={method.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedMethods.includes(method.id)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleMethodToggle(method.id)}
                >
                  <div className="flex items-center space-x-3">
                    <PaymentMethodIcon 
                      icon={method.icon} 
                      size="md" 
                      className="flex-shrink-0"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{method.name}</h3>
                      <p className="text-sm text-gray-600">{method.description}</p>
                      <span className="text-xs text-gray-500 capitalize">{method.category}</span>
                    </div>
                    {selectedMethods.includes(method.id) && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Review Your Selection</h2>
            <p className="text-gray-600 mb-6">
              You&apos;ve selected {selectedMethods.length} payment method{selectedMethods.length !== 1 ? 's' : ''}:
            </p>
            <div className="space-y-2 mb-8">
              {selectedMethods.map(methodId => {
                const method = availableMethods.find(m => m.id === methodId);
                return method ? (
                  <div key={methodId} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <PaymentMethodIcon 
                      icon={method.icon} 
                      size="sm" 
                      className="flex-shrink-0"
                    />
                    <span className="font-medium">{method.name}</span>
                  </div>
                ) : null;
              })}
            </div>
            {selectedMethods.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800">
                  ⚠️ No payment methods selected. You can still add them later in the Payments tab.
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">Step {currentStep} of 3</span>
              <span className="text-sm text-gray-500">Payment Setup</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="mb-8">
            {getStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <div>
              {currentStep > 1 && (
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="text-gray-600 hover:bg-gray-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={onSkip}
                variant="outline"
                className="text-gray-600 hover:bg-gray-50"
              >
                Skip for Now
              </Button>
              <Button
                onClick={handleNext}
                disabled={currentStep === 2 && selectedMethods.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {currentStep === 3 ? 'Complete Setup' : 'Next'}
                {currentStep < 3 && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
