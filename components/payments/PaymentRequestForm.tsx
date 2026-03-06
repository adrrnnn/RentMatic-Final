"use client";

import { useEffect, useMemo, useState } from 'react';
import { CreditCard, Send, CheckCircle, Copy, ExternalLink, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/Button';
import { PaymentRequestService } from '@/lib/services/paymentRequestService';
import { useUserStore } from '@/store/useUserStore';
import { toast } from 'react-hot-toast';
import { PropertyService } from '@/lib/firestore/properties/propertyService';

interface PaymentRequestFormProps {
  propertyId: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  onClose: () => void;
}

export function PaymentRequestForm({ 
  propertyId, 
  tenantId, 
  tenantName, 
  tenantEmail, 
  onClose 
}: PaymentRequestFormProps) {
  const { user } = useUserStore();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [requestCreated, setRequestCreated] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'paid' | 'expired' | 'failed'>('pending');
  const [propertyMethods, setPropertyMethods] = useState<{ id: string; name: string }[]>([]);
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);

  // Load property methods for professional defaults
  useEffect(() => {
    let isCancelled = false;
    (async () => {
      try {
        if (!user?.id || !propertyId) return;
        const prop = await PropertyService.getProperty(user.id, propertyId);
        if (isCancelled) return;
        if (prop?.paymentMethods && prop.paymentMethods.length > 0) {
          const list = prop.paymentMethods
            .filter((m: any) => m?.enabled !== false)
            .map((m: any) => ({ id: m.id, name: m.name }));
          setPropertyMethods(list);
          setSelectedMethods(list.map(m => m.id));
        } else {
          const fallback = [
            { id: 'GCASH', name: 'GCash' },
            { id: 'GRABPAY', name: 'GrabPay' },
            { id: 'PAYMAYA', name: 'Maya' },
            { id: 'CREDIT_CARD', name: 'Cards' },
          ];
          setPropertyMethods(fallback);
          setSelectedMethods(fallback.map(m => m.id));
        }
      } catch (_) {}
    })();
    return () => { isCancelled = true; };
  }, [user?.id, propertyId]);

  const amountDisplay = useMemo(() => {
    const n = Number(amount || '0');
    return isNaN(n) ? '₱0' : `₱${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }, [amount]);

  const handleCreateRequest = async () => {
    if (!user?.id || !amount || !description || !dueDate) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsCreating(true);

    try {
      const paymentRequest = await PaymentRequestService.createPaymentRequest({
        landlordId: user.id,
        propertyId,
        tenantId,
        amount: parseFloat(amount),
        currency: 'PHP',
        description,
        dueDate: new Date(dueDate),
        paymentMethods: selectedMethods.length > 0 ? selectedMethods : ['GCASH', 'PAYMAYA', 'GRABPAY', 'CREDIT_CARD']
      });

      setPaymentUrl(paymentRequest.xenditInvoiceUrl || '');
      setInvoiceId(paymentRequest.xenditInvoiceId || null);
      setRequestCreated(true);
      toast.success('Payment request created successfully!');

    } catch (error) {
      console.error('Error creating payment request:', error);
      toast.error('Failed to create payment request');
    } finally {
      setIsCreating(false);
    }
  };

  // Poll Xendit invoice status via Cloudflare Worker and update Firestore
  useEffect(() => {
    if (!requestCreated || !invoiceId) return;

    let isCancelled = false;
    const workerUrl = 'https://xenditsecretkey.rentmatic495.workers.dev';

    const poll = async () => {
      try {
        const res = await fetch(`${workerUrl}/xendit/invoice/${invoiceId}`, { method: 'GET' });
        if (!res.ok) return;
        const data = await res.json();
        const xStatus = (data.status || '').toLowerCase();
        if (xStatus === 'paid' || xStatus === 'settled') {
          if (!isCancelled) {
            setStatus('paid');
            // Use paid_at from Xendit API if available, otherwise use current date
            const paidAt = data.paid_at ? new Date(data.paid_at) : new Date();
            await PaymentRequestService.updatePaymentStatus(invoiceId, 'paid', paidAt);
          }
        } else if (xStatus === 'expired' || xStatus === 'voided' || xStatus === 'canceled') {
          if (!isCancelled) {
            setStatus('expired');
            await PaymentRequestService.updatePaymentStatus(invoiceId, 'expired');
          }
        }
      } catch (_) {}
    };

    // immediate check, then interval
    poll();
    const id = setInterval(poll, 5000);
    return () => { isCancelled = true; clearInterval(id); };
  }, [requestCreated, invoiceId]);

  if (requestCreated) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="bg-white rounded-xl shadow-xl border border-gray-100 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Request Created!</h3>
          <p className="text-gray-600 mb-4">
            A payment link has been generated for {tenantName}.
          </p>
          {invoiceId && (
            <div className="mb-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${status === 'paid' ? 'bg-green-100 text-green-800' : status === 'expired' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-800'}`}>
                Status: {status.toUpperCase()}
              </span>
            </div>
          )}
          {paymentUrl && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
              <p className="text-xs text-gray-600 mb-2">Payment Link</p>
              <div className="flex items-center gap-2">
                <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline break-all text-sm flex-1">
                  {paymentUrl}
                </a>
                <Button
                  variant="outline"
                  onClick={() => { navigator.clipboard.writeText(paymentUrl); toast.success('Link copied to clipboard'); }}
                  className="px-3 py-1 text-sm"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => window.open(paymentUrl, '_blank')}
                  className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          <Button
            onClick={onClose}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Done
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="bg-white rounded-xl shadow-xl border border-gray-100 p-6 w-full max-w-3xl">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
          <Send className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Send Payment Request</h3>
          <p className="text-sm text-gray-600">Create a payment link for {tenantName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount (PHP)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex gap-2 mt-2">
              {["5000","10000","15000"].map(preset => (
                <button key={preset} onClick={() => setAmount(preset)} className="px-3 py-1 text-xs rounded-lg border border-gray-200 hover:bg-gray-50">₱{Number(preset).toLocaleString()}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Monthly rent payment"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Methods</label>
            <div className="flex flex-wrap gap-2">
              {propertyMethods.map((m) => {
                const active = selectedMethods.includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMethods(prev => active ? prev.filter(x => x !== m.id) : [...prev, m.id])}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                  >
                    {m.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRequest}
              disabled={isCreating || !amount || !description || !dueDate}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Create Payment Link
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-gray-500">Tenant</div>
              <div className="text-sm font-medium text-gray-900">{tenantName}</div>
              <div className="text-xs text-gray-500">{tenantEmail}</div>
            </div>
            <div className="flex items-center gap-2 text-emerald-700 text-xs bg-emerald-50 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-4 h-4" /> Secure link
            </div>
          </div>
          <div className="mb-3">
            <div className="text-xs text-gray-500 mb-1">Amount</div>
            <div className="text-2xl font-bold text-gray-900">{amountDisplay}</div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-gray-500">Description</div>
              <div className="text-gray-900 truncate">{description || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Due date</div>
              <div className="text-gray-900">{dueDate || '—'}</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xs text-gray-500 mb-2">Methods</div>
            <div className="flex flex-wrap gap-2">
              {selectedMethods.length > 0 ? selectedMethods.map(id => {
                const m = propertyMethods.find(x => x.id === id);
                return <span key={id} className="px-2.5 py-1 rounded-full text-xs bg-white border border-gray-300 text-gray-700">{m?.name || id}</span>;
              }) : <span className="text-xs text-gray-500">—</span>}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

