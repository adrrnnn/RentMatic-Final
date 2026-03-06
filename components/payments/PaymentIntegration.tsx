'use client';

import { useState } from 'react';
import { CreditCard, Shield, Bell, CheckCircle, Plus, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Card';

interface PaymentIntegrationProps {
  onSendPaymentRequest: () => void;
  onConfigureBilling: () => void;
  onSendReminder: () => void;
  onAddCharge: () => void;
  onMarkPaid: () => void;
}

const PaymentIntegration: React.FC<PaymentIntegrationProps> = ({
  onSendPaymentRequest,
  onConfigureBilling,
  onSendReminder,
  onAddCharge,
  onMarkPaid
}) => {
  const [selectedMethods, setSelectedMethods] = useState<string[]>(['gcash', 'bank']);

  const paymentMethods = [
    { id: 'gcash', name: 'GCash', icon: '🟢', description: 'Mobile wallet' },
    { id: 'paymaya', name: 'PayMaya', icon: '🟣', description: 'Mobile wallet' },
    { id: 'bank', name: 'Bank Transfer', icon: '🏦', description: 'Online banking' },
    { id: 'card', name: 'Credit/Debit Card', icon: '💳', description: 'Visa, Mastercard' }
  ];

  const handleMethodToggle = (methodId: string) => {
    setSelectedMethods(prev => 
      prev.includes(methodId) 
        ? prev.filter(id => id !== methodId)
        : [...prev, methodId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Payment Integration Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">Payment Integration</CardTitle>
              <CardDescription>Accept payments from tenants with multiple payment options</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => handleMethodToggle(method.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedMethods.includes(method.id)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-2">{method.icon}</div>
                <h4 className="font-medium text-gray-900">{method.name}</h4>
                <p className="text-sm text-gray-500">{method.description}</p>
                {selectedMethods.includes(method.id) && (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-2" />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-2 text-green-600" />
              Secure Processing
            </div>
            <div className="flex items-center">
              <Bell className="w-4 h-4 mr-2 text-green-600" />
              Auto Reminders
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
              Multiple Methods
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Send Payment Request */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Send Payment Request</CardTitle>
                <CardDescription>Create and send payment requests to tenants</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Send secure payment links directly to your tenants. They'll receive email notifications with payment options.
            </p>
            <Button 
              onClick={onSendPaymentRequest}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Send Payment Request
            </Button>
          </CardContent>
        </Card>

        {/* Unit Billing Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Unit Billing Settings</CardTitle>
                  <CardDescription>Configure billing and payment settings</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Manual Payment
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Sample Unit */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">001</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Unit 001</h4>
                    <p className="text-sm text-gray-600">Occupied by joe</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">₱1,000/month</p>
                  <p className="text-sm text-gray-600">Due Day: 22 | Grace: 3 days</p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={onConfigureBilling}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Configure Billing
                </Button>
                <Button 
                  onClick={onSendReminder}
                  variant="outline"
                  size="sm"
                >
                  <Bell className="w-4 h-4 mr-1" />
                  Remind
                </Button>
                <Button 
                  onClick={onAddCharge}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Charge
                </Button>
                <Button 
                  onClick={onMarkPaid}
                  variant="outline"
                  size="sm"
                >
                  <DollarSign className="w-4 h-4 mr-1" />
                  Pay
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentIntegration;

import { useState } from 'react';
import { CreditCard, Shield, Bell, CheckCircle, Plus, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Card';

interface PaymentIntegrationProps {
  onSendPaymentRequest: () => void;
  onConfigureBilling: () => void;
  onSendReminder: () => void;
  onAddCharge: () => void;
  onMarkPaid: () => void;
}

const PaymentIntegration: React.FC<PaymentIntegrationProps> = ({
  onSendPaymentRequest,
  onConfigureBilling,
  onSendReminder,
  onAddCharge,
  onMarkPaid
}) => {
  const [selectedMethods, setSelectedMethods] = useState<string[]>(['gcash', 'bank']);

  const paymentMethods = [
    { id: 'gcash', name: 'GCash', icon: '🟢', description: 'Mobile wallet' },
    { id: 'paymaya', name: 'PayMaya', icon: '🟣', description: 'Mobile wallet' },
    { id: 'bank', name: 'Bank Transfer', icon: '🏦', description: 'Online banking' },
    { id: 'card', name: 'Credit/Debit Card', icon: '💳', description: 'Visa, Mastercard' }
  ];

  const handleMethodToggle = (methodId: string) => {
    setSelectedMethods(prev => 
      prev.includes(methodId) 
        ? prev.filter(id => id !== methodId)
        : [...prev, methodId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Payment Integration Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">Payment Integration</CardTitle>
              <CardDescription>Accept payments from tenants with multiple payment options</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => handleMethodToggle(method.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedMethods.includes(method.id)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-2">{method.icon}</div>
                <h4 className="font-medium text-gray-900">{method.name}</h4>
                <p className="text-sm text-gray-500">{method.description}</p>
                {selectedMethods.includes(method.id) && (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-2" />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-2 text-green-600" />
              Secure Processing
            </div>
            <div className="flex items-center">
              <Bell className="w-4 h-4 mr-2 text-green-600" />
              Auto Reminders
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
              Multiple Methods
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Send Payment Request */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Send Payment Request</CardTitle>
                <CardDescription>Create and send payment requests to tenants</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Send secure payment links directly to your tenants. They'll receive email notifications with payment options.
            </p>
            <Button 
              onClick={onSendPaymentRequest}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Send Payment Request
            </Button>
          </CardContent>
        </Card>

        {/* Unit Billing Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Unit Billing Settings</CardTitle>
                  <CardDescription>Configure billing and payment settings</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Manual Payment
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Sample Unit */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">001</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Unit 001</h4>
                    <p className="text-sm text-gray-600">Occupied by joe</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">₱1,000/month</p>
                  <p className="text-sm text-gray-600">Due Day: 22 | Grace: 3 days</p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={onConfigureBilling}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Configure Billing
                </Button>
                <Button 
                  onClick={onSendReminder}
                  variant="outline"
                  size="sm"
                >
                  <Bell className="w-4 h-4 mr-1" />
                  Remind
                </Button>
                <Button 
                  onClick={onAddCharge}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Charge
                </Button>
                <Button 
                  onClick={onMarkPaid}
                  variant="outline"
                  size="sm"
                >
                  <DollarSign className="w-4 h-4 mr-1" />
                  Pay
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentIntegration;


























