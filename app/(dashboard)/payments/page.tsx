"use client";

import { useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  CreditCard,
  Banknote,
  Calendar,
  Filter,
  Download,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Mail,
  Receipt,
  Trash2,
  X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { useUserStore } from "@/store/useUserStore";
import { PaymentRequestService, PaymentRequest } from "@/lib/services/paymentRequestService";
import { TenantService } from "@/lib/firestore/properties/tenantService";
import { PropertyService } from "@/lib/firestore/properties/propertyService";
import { toast } from "react-hot-toast";
import { ManualPaymentRequestModal } from "@/components/payments/ManualPaymentRequestModal";

export default function PaymentsPage() {
  const { user } = useUserStore();
  const [timeRange, setTimeRange] = useState("month");
  const [filterStatus, setFilterStatus] = useState("all");
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<Record<string, { tenantName?: string; propertyName?: string; unitName?: string }>>({});
  const [showManualPaymentModal, setShowManualPaymentModal] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<{ id: string; tenant: string; amount: string } | null>(null);
  const [markingAsPaidId, setMarkingAsPaidId] = useState<string | null>(null);
  
  const overviewRef = useRef(null);
  const transactionsRef = useRef(null);
  const overviewInView = useInView(overviewRef, { once: true });
  const transactionsInView = useInView(transactionsRef, { once: true });

  useEffect(() => {
    if (!user?.id) return;
    fetchPayments();
  }, [user?.id]);

  const fetchPayments = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const paymentRequests = await PaymentRequestService.getPaymentRequests(user.id);
      
      // Convert Firestore timestamps to Date objects
      const processedPayments = paymentRequests.map(p => ({
        ...p,
        createdAt: p.createdAt instanceof Date ? p.createdAt : (typeof p.createdAt === 'object' && 'toDate' in p.createdAt ? p.createdAt.toDate() : new Date(p.createdAt)),
        updatedAt: p.updatedAt instanceof Date ? p.updatedAt : (typeof p.updatedAt === 'object' && 'toDate' in p.updatedAt ? p.updatedAt.toDate() : new Date(p.updatedAt)),
        dueDate: p.dueDate instanceof Date ? p.dueDate : (typeof p.dueDate === 'object' && 'toDate' in p.dueDate ? p.dueDate.toDate() : new Date(p.dueDate)),
        paidAt: p.paidAt ? (p.paidAt instanceof Date ? p.paidAt : (typeof p.paidAt === 'object' && 'toDate' in p.paidAt ? p.paidAt.toDate() : new Date(p.paidAt))) : undefined
      }));
      
      setPayments(processedPayments);
      
      // Fetch tenant, property, and unit details
      const details: Record<string, { tenantName?: string; propertyName?: string; unitName?: string }> = {};
      for (const payment of processedPayments) {
        try {
          const tenant = await TenantService.getTenant(user.id, payment.tenantId);
          const property = await PropertyService.getProperty(user.id, payment.propertyId);
          let unitName: string | undefined;
          if (tenant?.unitId && property) {
            try {
              const unit = await PropertyService.getUnit(user.id, payment.propertyId, tenant.unitId);
              unitName = unit?.name;
            } catch {}
          }
          details[payment.id] = {
            tenantName: tenant?.fullName,
            propertyName: property?.name,
            unitName
          };
        } catch (error) {
          console.error(`Error fetching details for payment ${payment.id}:`, error);
        }
      }
      setPaymentDetails(details);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from real payment data
  const paidPayments = payments.filter(p => p.status === 'paid');
  const pendingPayments = payments.filter(p => p.status === 'pending');
  const expiredPayments = payments.filter(p => p.status === 'expired');
  
  const totalIncome = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  const overdueAmount = expiredPayments.reduce((sum, p) => sum + p.amount, 0);
  const collectionRate = payments.length > 0 
    ? Math.round((paidPayments.length / payments.filter(p => p.status !== 'pending').length) * 100) || 0
    : 0;

  const paymentStats = [
    {
      title: "Total Income",
      value: `₱${totalIncome.toLocaleString()}`,
      change: "",
      changeType: "increase" as const,
      icon: DollarSign,
      color: "from-green-500 to-green-600",
      glow: "shadow-green-500/25"
    },
    {
      title: "Pending Payments",
      value: `₱${pendingAmount.toLocaleString()}`,
      change: `${pendingPayments.length} requests`,
      changeType: "decrease" as const,
      icon: Clock,
      color: "from-yellow-500 to-yellow-600",
      glow: "shadow-yellow-500/25"
    },
    {
      title: "Expired/Overdue",
      value: `₱${overdueAmount.toLocaleString()}`,
      change: `${expiredPayments.length} expired`,
      changeType: "increase" as const,
      icon: AlertCircle,
      color: "from-red-500 to-red-600",
      glow: "shadow-red-500/25"
    },
    {
      title: "Collection Rate",
      value: `${collectionRate}%`,
      change: `${paidPayments.length} paid`,
      changeType: "increase" as const,
      icon: TrendingUp,
      color: "from-blue-500 to-blue-600",
      glow: "shadow-blue-500/25"
    }
  ];

  // Filter transactions based on status filter
  const filteredPayments = filterStatus === 'all' 
    ? payments 
    : payments.filter(p => p.status === filterStatus);

  const transactions = filteredPayments.map(payment => {
    const details = paymentDetails[payment.id] || {};
    return {
      id: payment.id,
      payment: payment,
      tenant: details.tenantName || 'Unknown Tenant',
      property: details.propertyName || 'Unknown Property',
      unit: details.unitName || 'N/A',
      amount: `₱${payment.amount.toLocaleString()}`,
      status: payment.status,
      date: payment.createdAt instanceof Date ? payment.createdAt.toLocaleDateString() : new Date(payment.createdAt).toLocaleDateString(),
      paidDate: payment.paidAt ? (payment.paidAt instanceof Date ? payment.paidAt.toLocaleDateString() : new Date(payment.paidAt).toLocaleDateString()) : undefined,
      method: payment.paymentMethods?.join(', ') || 'Multiple',
      reference: payment.xenditInvoiceId || payment.id.substring(0, 8),
      receiptSent: payment.receiptSent || false,
      description: payment.description
    };
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return CheckCircle;
      case "pending":
        return Clock;
      case "overdue":
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const handleDeleteClick = (transaction: typeof transactions[0]) => {
    setPaymentToDelete({
      id: transaction.id,
      tenant: transaction.tenant,
      amount: transaction.amount
    });
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!paymentToDelete || !user?.id) return;

    try {
      setDeletingPaymentId(paymentToDelete.id);
      await PaymentRequestService.deletePaymentRequest(paymentToDelete.id, user.id);
      toast.success('Payment request deleted successfully');
      setShowDeleteConfirm(false);
      setPaymentToDelete(null);
      fetchPayments(); // Refresh the list
    } catch (error: any) {
      console.error('Error deleting payment:', error);
      toast.error(error.message || 'Failed to delete payment request');
    } finally {
      setDeletingPaymentId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setPaymentToDelete(null);
  };

  const handleMarkAsPaid = async (transaction: typeof transactions[0]) => {
    if (!transaction.payment?.xenditInvoiceId || !user?.id) {
      toast.error('Cannot mark as paid: Missing invoice ID');
      return;
    }

    try {
      setMarkingAsPaidId(transaction.id);
      console.log(`[PAYMENTS-PAGE] Manually marking payment ${transaction.id} as paid (invoice: ${transaction.payment.xenditInvoiceId})`);
      
      await PaymentRequestService.updatePaymentStatus(
        transaction.payment.xenditInvoiceId,
        'paid',
        new Date() // Set paidAt to now
      );
      
      console.log(`[PAYMENTS-PAGE] ✅ Successfully marked payment ${transaction.id} as paid`);
      toast.success(`Payment marked as paid successfully!`);
      
      // Refresh the data
      await fetchPayments();
    } catch (error: any) {
      console.error('[PAYMENTS-PAGE] Error marking payment as paid:', error);
      toast.error(`Failed to mark as paid: ${error.message || 'Unknown error'}`);
    } finally {
      setMarkingAsPaidId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Track rent collection and payment analytics</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button variant="outline" className="mr-2">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={() => setShowManualPaymentModal(true)}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/25"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Payment Request
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Payment Stats Overview */}
      <section ref={overviewRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {paymentStats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={overviewInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.9 }}
            transition={{ duration: 0.6, delay: 0.1 * index }}
            whileHover={{ 
              scale: 1.03, 
              y: -5,
              rotateY: 2
            }}
            className="group"
          >
            <Card variant="elevated" className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              
              <CardHeader className="relative">
                <div className="flex items-center justify-between mb-4">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-lg ${stat.glow} group-hover:shadow-2xl transition-all duration-300`}
                  >
                    <stat.icon className="w-6 h-6 text-white" />
                  </motion.div>
                  
                  <div className="flex items-center space-x-1">
                    {stat.changeType === "increase" ? (
                      <ArrowUpRight className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      stat.changeType === "increase" ? "text-green-600" : "text-red-600"
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                
                <CardTitle className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</CardTitle>
                <CardDescription className="text-sm text-gray-600">{stat.title}</CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Chart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">Payment Trends</CardTitle>
                  <CardDescription>Monthly rent collection overview</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="px-3 py-1 bg-white/50 backdrop-blur-sm border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300"
                  >
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                    <option value="year">This Year</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Mock Chart - In a real app, you'd use Recharts or similar */}
              <div className="h-64 bg-gradient-to-br from-green-50 to-white rounded-xl p-6 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Payment Analytics</h3>
                  <p className="text-gray-500">Chart visualization would be implemented with Recharts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-6"
        >
          <Card variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-900">Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { method: "Bank Transfer", percentage: 45, color: "bg-green-500" },
                  { method: "Credit Card", percentage: 30, color: "bg-blue-500" },
                  { method: "Online Payment", percentage: 20, color: "bg-purple-500" },
                  { method: "Cash", percentage: 5, color: "bg-gray-500" }
                ].map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.method}</span>
                      <span className="font-medium">{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                        className={`h-2 rounded-full ${item.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-900">Collection Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">94%</div>
                <div className="text-sm text-gray-600 mb-4">This Month</div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "94%" }}
                    transition={{ duration: 1.5, delay: 0.8 }}
                    className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Target: 95%</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <section ref={transactionsRef}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={transactionsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Transactions</h2>
            <div className="flex space-x-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-white/50 backdrop-blur-sm border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300"
              >
                <option value="all">All Transactions</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Loading payments...</p>
              </div>
            ) : transactions.length === 0 ? (
              <Card variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payments Found</h3>
                  <p className="text-gray-600">Payment requests will appear here once created.</p>
                </CardContent>
              </Card>
            ) : (
              transactions.map((transaction, index) => {
                const StatusIcon = getStatusIcon(transaction.status);
                
                return (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={transactionsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.5, delay: 0.1 * index }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="group"
                  >
                    <Card variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            <motion.div
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              className={`w-12 h-12 bg-gradient-to-br rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 ${
                                transaction.status === 'paid' ? 'from-green-500 to-green-600' :
                                transaction.status === 'pending' ? 'from-yellow-500 to-yellow-600' :
                                'from-red-500 to-red-600'
                              }`}
                            >
                              <CreditCard className="w-6 h-6 text-white" />
                            </motion.div>
                            
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{transaction.tenant}</h3>
                              <p className="text-sm text-gray-600">{transaction.property} - {transaction.unit}</p>
                              <p className="text-xs text-gray-500">
                                Created: {transaction.date}
                                {transaction.paidDate && ` • Paid: ${transaction.paidDate}`}
                              </p>
                              {transaction.description && (
                                <p className="text-xs text-gray-400 mt-1">{transaction.description}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-900">{transaction.amount}</div>
                              <div className="text-xs text-gray-500">Ref: {transaction.reference}</div>
                              {transaction.status === 'paid' && transaction.receiptSent && (
                                <div className="flex items-center justify-end mt-1 text-xs text-green-600">
                                  <Receipt className="w-3 h-3 mr-1" />
                                  Receipt sent
                                </div>
                              )}
                              {transaction.status === 'paid' && !transaction.receiptSent && (
                                <div className="text-xs text-yellow-600 mt-1">Receipt pending</div>
                              )}
                            </div>
                            
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(transaction.status)}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {transaction.status.toUpperCase()}
                            </div>
                            
                            {transaction.status === 'paid' && (
                              <div className="flex items-center space-x-1">
                                {transaction.receiptSent ? (
                                  <div className="p-2 text-green-600" title="Receipt sent">
                                    <Mail className="w-5 h-5" />
                                  </div>
                                ) : (
                                  <div className="p-2 text-yellow-600" title="Receipt not sent yet">
                                    <Clock className="w-5 h-5" />
                                  </div>
                                )}
                              </div>
                            )}
                            
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                              title="View details"
                            >
                              <Eye className="w-5 h-5" />
                            </motion.button>
                            
                            {/* Mark as Paid button - only show for pending/expired payments */}
                            {(transaction.status === 'pending' || transaction.status === 'expired') && transaction.payment?.xenditInvoiceId && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleMarkAsPaid(transaction)}
                                disabled={markingAsPaidId === transaction.id}
                                className="p-2 text-gray-400 hover:text-green-600 transition-colors disabled:opacity-50"
                                title="Mark as paid (use when Xendit confirms payment)"
                              >
                                {markingAsPaidId === transaction.id ? (
                                  <Clock className="w-5 h-5 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-5 h-5" />
                                )}
                              </motion.button>
                            )}
                            
                            {/* Delete button - only show for pending/expired payments */}
                            {(transaction.status === 'pending' || transaction.status === 'expired' || transaction.status === 'failed') && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDeleteClick(transaction)}
                                disabled={deletingPaymentId === transaction.id}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                title="Delete payment request"
                              >
                                <Trash2 className="w-5 h-5" />
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && paymentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Delete Payment Request</h3>
              <button
                onClick={handleDeleteCancel}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                Are you sure you want to delete this payment request?
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Tenant:</span> {paymentToDelete.tenant}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-semibold">Amount:</span> {paymentToDelete.amount}
                </p>
              </div>
              <p className="text-xs text-red-600 mt-3">
                ⚠️ This action cannot be undone. Paid payments cannot be deleted.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={handleDeleteCancel}
                variant="outline"
                className="flex-1"
                disabled={deletingPaymentId !== null}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={deletingPaymentId !== null}
              >
                {deletingPaymentId ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Manual Payment Request Modal */}
      <ManualPaymentRequestModal
        isOpen={showManualPaymentModal}
        onClose={() => setShowManualPaymentModal(false)}
        onSuccess={() => {
          fetchPayments(); // Refresh payments list after successful creation
        }}
      />
    </div>
  );
}
