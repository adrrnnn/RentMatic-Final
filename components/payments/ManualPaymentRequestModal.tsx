"use client";

import { useState, useEffect } from 'react';
import { X, Send, Mail, Link as LinkIcon, DollarSign, Calendar, FileText, Building2, User, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/Button';
import { PaymentRequestService } from '@/lib/services/paymentRequestService';
import { PropertyService } from '@/lib/firestore/properties/propertyService';
import { TenantService } from '@/lib/firestore/properties/tenantService';
import { EmailJSService } from '@/lib/services/emailJSService';
import { useUserStore } from '@/store/useUserStore';
import { toast } from 'react-hot-toast';
import type { Property, Tenant } from '@/types/firestore';

interface ManualPaymentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ManualPaymentRequestModal({ isOpen, onClose, onSuccess }: ManualPaymentRequestModalProps) {
  const { user } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // Form state
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [sendVia, setSendVia] = useState<'link' | 'email' | 'both'>('email');

  // Load properties and tenants
  useEffect(() => {
    if (!isOpen || !user?.id) return;
    
    setLoadingData(true);
    const loadData = async () => {
      try {
        const [props, tenantsList] = await Promise.all([
          PropertyService.getProperties(user.id),
          TenantService.getTenants(user.id)
        ]);
        setProperties(props);
        setTenants(tenantsList);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load properties and tenants');
      } finally {
        setLoadingData(false);
      }
    };
    
    loadData();
  }, [isOpen, user?.id]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedPropertyId('');
      setSelectedTenantId('');
      setAmount('');
      setDescription('');
      setDueDate('');
      setSendVia('email');
    }
  }, [isOpen]);

  // Filter tenants by selected property
  const filteredTenants = selectedPropertyId
    ? tenants.filter(t => t.propertyId === selectedPropertyId || 
        (t.unitId && properties.find(p => p.id === selectedPropertyId)?.units?.some(u => u.id === t.unitId && u.propertyId === selectedPropertyId)))
    : tenants;

  const selectedTenant = tenants.find(t => t.id === selectedTenantId);
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !selectedPropertyId || !selectedTenantId || !amount || !description || !dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);

    try {
      // Get property payment methods
      const property = await PropertyService.getProperty(user.id, selectedPropertyId);
      const paymentMethods = (property?.paymentMethods && property.paymentMethods.length > 0)
        ? property.paymentMethods.filter((m: any) => m?.enabled !== false).map((m: any) => m.id)
        : ['GCASH', 'GRABPAY', 'PAYMAYA', 'CREDIT_CARD'];

      // Create payment request
      const paymentRequest = await PaymentRequestService.createPaymentRequest({
        landlordId: user.id,
        propertyId: selectedPropertyId,
        tenantId: selectedTenantId,
        amount: amountNum,
        currency: 'PHP',
        description,
        dueDate: new Date(dueDate),
        paymentMethods
      });

      const paymentUrl = paymentRequest.xenditInvoiceUrl || '';
      const dueDateStr = new Date(dueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Send email if requested
      if ((sendVia === 'email' || sendVia === 'both') && selectedTenant?.contact?.email) {
        try {
          await EmailJSService.sendRentReminder({
            email: selectedTenant.contact.email,
            tenantName: selectedTenant.fullName || 'Tenant',
            propertyName: selectedProperty?.name || 'Property',
            unitName: '', // Could be enhanced to show unit name
            rentAmount: amountNum,
            dueDate: dueDateStr,
            landlordName: 'Property Manager',
            paymentUrl
          });
          toast.success('✅ Payment request created and email sent!');
        } catch (emailError) {
          console.error('Email error:', emailError);
          toast.error('Payment created but email failed. Link copied to clipboard.');
          await navigator.clipboard.writeText(paymentUrl);
        }
      } else if (sendVia === 'link' || sendVia === 'both') {
        // Copy link to clipboard
        await navigator.clipboard.writeText(paymentUrl);
        toast.success('✅ Payment request created! Link copied to clipboard.');
      }

      // Call success callback to refresh payments list
      if (onSuccess) {
        onSuccess();
      }

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error: any) {
      console.error('Error creating payment request:', error);
      toast.error(error.message || 'Failed to create payment request');
    } finally {
      setLoading(false);
    }
  };

  // Set default due date to 7 days from now
  useEffect(() => {
    if (isOpen && !dueDate) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      setDueDate(defaultDate.toISOString().split('T')[0]);
    }
  }, [isOpen, dueDate]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-green-50 to-white">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create Payment Request</h2>
                <p className="text-sm text-gray-600">For emergencies, partial payments, or additional charges</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {loadingData ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading properties and tenants...</p>
              </div>
            ) : (
              <>
                {/* Info Alert */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Manual Payment Request</p>
                    <p>Use this for emergency charges, partial payments, utilities, or any additional fees outside of regular rent billing.</p>
                  </div>
                </div>

                {/* Property Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Property *
                  </label>
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => {
                      setSelectedPropertyId(e.target.value);
                      setSelectedTenantId(''); // Reset tenant when property changes
                    }}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select a property</option>
                    {properties.map(prop => (
                      <option key={prop.id} value={prop.id}>{prop.name}</option>
                    ))}
                  </select>
                </div>

                {/* Tenant Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Tenant *
                  </label>
                  <select
                    value={selectedTenantId}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    required
                    disabled={!selectedPropertyId}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">{selectedPropertyId ? 'Select a tenant' : 'Select property first'}</option>
                    {filteredTenants.map(tenant => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.fullName} {tenant.contact?.email ? `(${tenant.contact.email})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Amount (₱) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    placeholder="e.g., Emergency repair fee, Partial rent payment, Utility charges..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Send Via */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Send Payment Link Via
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setSendVia('email')}
                      className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-all ${
                        sendVia === 'email'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Mail className="w-5 h-5" />
                      <span className="text-sm font-medium">Email</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSendVia('link')}
                      className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-all ${
                        sendVia === 'link'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <LinkIcon className="w-5 h-5" />
                      <span className="text-sm font-medium">Copy Link</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSendVia('both')}
                      className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-all ${
                        sendVia === 'both'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Send className="w-5 h-5" />
                      <span className="text-sm font-medium">Both</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </form>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || loadingData || !selectedPropertyId || !selectedTenantId || !amount || !description || !dueDate}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Create Payment Request
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}







