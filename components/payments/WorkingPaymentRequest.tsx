'use client';

import React, { useState } from 'react';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { WorkingXenditService } from '@/lib/services/workingXenditService';
import { Send, Copy, CheckCircle, ExternalLink, AlertCircle, TestTube } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface WorkingPaymentRequestProps {
  landlordUserId: string;
  tenantEmail: string;
  tenantName: string;
  propertyName: string;
  unitName: string;
  amount: number;
  description: string;
  onPaymentCreated: (paymentUrl: string, paymentId: string) => void;
}

export function WorkingPaymentRequest({
  landlordUserId,
  tenantEmail,
  tenantName,
  propertyName,
  unitName,
  amount,
  description,
  onPaymentCreated
}: WorkingPaymentRequestProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [error, setError] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'failed'>('unknown');

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const isConnected = await WorkingXenditService.testConnection();
      setConnectionStatus(isConnected ? 'success' : 'failed');
      if (isConnected) {
        toast.success('Xendit connection successful!');
      } else {
        toast.error('Xendit connection failed. Check your API key.');
      }
    } catch (error) {
      setConnectionStatus('failed');
      toast.error('Xendit connection failed.');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleCreatePayment = async () => {
    setIsCreating(true);
    setError('');

    try {
      console.log('🚀 Creating working payment request...');
      
      const paymentRequest = await WorkingXenditService.createRealPaymentRequest(
        landlordUserId,
        tenantEmail,
        tenantName,
        amount,
        description,
        unitName,
        propertyName
      );

      setPaymentUrl(paymentRequest.xenditInvoiceUrl);
      setPaymentId(paymentRequest.id);
      onPaymentCreated(paymentRequest.xenditInvoiceUrl, paymentRequest.id);
      
      toast.success('Real payment request created successfully!');
      console.log('✅ Payment request created:', paymentRequest);
    } catch (error) {
      console.error('❌ Error creating payment request:', error);
      setError('Failed to create payment request. Please check your Xendit API key and try again.');
      toast.error('Failed to create payment request');
    } finally {
      setIsCreating(false);
    }
  };

  const copyPaymentUrl = () => {
    navigator.clipboard.writeText(paymentUrl);
    toast.success('Payment link copied to clipboard!');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="w-5 h-5" />
            <span>Test Xendit Connection</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Test your Xendit API connection before creating payments
              </p>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'success' ? 'bg-green-500' : 
                  connectionStatus === 'failed' ? 'bg-red-500' : 'bg-gray-400'
                }`} />
                <span className="text-sm text-gray-600">
                  {connectionStatus === 'success' ? 'Connected' : 
                   connectionStatus === 'failed' ? 'Failed' : 'Not tested'}
                </span>
              </div>
            </div>
            <Button
              onClick={handleTestConnection}
              disabled={testingConnection}
              variant="outline"
              className="flex items-center space-x-2"
            >
              {testingConnection ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4" />
                  <span>Test Connection</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Send className="w-5 h-5" />
            <span>Create Real Payment Request</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Tenant:</span>
              <span className="ml-2 font-medium">{tenantName}</span>
            </div>
            <div>
              <span className="text-gray-600">Email:</span>
              <span className="ml-2 font-medium">{tenantEmail}</span>
            </div>
            <div>
              <span className="text-gray-600">Property:</span>
              <span className="ml-2 font-medium">{propertyName}</span>
            </div>
            <div>
              <span className="text-gray-600">Unit:</span>
              <span className="ml-2 font-medium">{unitName}</span>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Amount:</span>
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(amount)}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Creation */}
      {!paymentUrl ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Send className="w-8 h-8 text-blue-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Create Real Xendit Payment
                </h3>
                <p className="text-gray-600 mb-4">
                  This will create a <strong>real payment link</strong> using your Xendit account.
                  The tenant can pay with real money through GCash, PayMaya, bank transfer, etc.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}

              <Button
                onClick={handleCreatePayment}
                disabled={isCreating || connectionStatus === 'failed'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating Real Payment...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Create Real Payment Request
                  </>
                )}
              </Button>

              {connectionStatus === 'failed' && (
                <p className="text-sm text-red-600">
                  Please test your Xendit connection first and ensure your API key is configured.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Payment Created Successfully */
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Real Payment Request Created!
                </h3>
                <p className="text-gray-600 mb-4">
                  Your tenant can now pay using the <strong>real Xendit payment link</strong> below.
                  This is a live payment that will process real money.
                </p>
              </div>

              {/* Payment URL */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 mb-1">Real Payment Link:</p>
                    <p className="text-sm font-mono text-gray-900 truncate">
                      {paymentUrl}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      onClick={copyPaymentUrl}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </Button>
                    <Button
                      onClick={() => window.open(paymentUrl, '_blank')}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium mb-1">This is a REAL payment link!</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Tenant can pay with GCash, PayMaya, bank transfer, cards</li>
                      <li>• Money will be processed through your Xendit account</li>
                      <li>• You'll receive real money in your Xendit balance</li>
                      <li>• Payment status will be updated in real-time</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Share Options */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Share with tenant:</p>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => {
                      const subject = `Rent Payment - ${propertyName} ${unitName}`;
                      const body = `Hello ${tenantName},\n\nPlease pay your rent using this secure link: ${paymentUrl}\n\nAmount: ${formatCurrency(amount)}\nProperty: ${propertyName} ${unitName}\n\nThank you!`;
                      window.open(`mailto:${tenantEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Send Email
                  </Button>
                  <Button
                    onClick={() => {
                      const text = `Please pay your rent using this secure link: ${paymentUrl}`;
                      window.open(`sms:${tenantEmail}?body=${encodeURIComponent(text)}`);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Send SMS
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}












