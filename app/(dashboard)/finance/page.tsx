"use client";

import { useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  Filter,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  MoreHorizontal,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  Trash2,
  X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/Animations/FadeIn";
import { useUserStore } from "@/store/useUserStore";
import { PaymentRequestService, PaymentRequest } from "@/lib/services/paymentRequestService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart as RechartsLineChart, Line, Legend, AreaChart, Area } from "recharts";
import { TenantService } from "@/lib/firestore/properties/tenantService";
import { PropertyService } from "@/lib/firestore/properties/propertyService";
import { toast } from "react-hot-toast";
import * as XLSX from 'xlsx';

function FinancePageContent() {
  const { user } = useUserStore();
  const searchParams = useSearchParams();
  const [timeRange, setTimeRange] = useState("month");
  const [chartType, setChartType] = useState("line");
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<Record<string, { tenantName?: string; propertyName?: string; unitName?: string }>>({});
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<{ id: string; tenant: string; amount: string } | null>(null);
  const [markingAsPaidId, setMarkingAsPaidId] = useState<string | null>(null);
  
  const financeRef = useRef(null);
  const financeInView = useInView(financeRef, { once: true });

  useEffect(() => {
    if (user?.id) {
      // Check if we came from payment success page - auto-sync
      const synced = searchParams?.get('synced');
      const syncFailed = searchParams?.get('sync_failed');
      
      if (synced === 'true') {
        // Auto-sync when coming from payment success
        fetchFinancialData(true);
        toast.success('Payment status synced successfully!');
      } else if (syncFailed === 'true') {
        // Show message if sync failed
        toast.error('Payment sync unavailable. Please click "Sync Payments" button to update status.', {
          duration: 5000
        });
        fetchFinancialData(false);
      } else {
        fetchFinancialData(false);
      }
    }
  }, [user?.id, timeRange, searchParams]);

  const fetchFinancialData = async (syncFromXendit: boolean = false) => {
    if (!user?.id) return;
    try {
      setLoading(true);
      
      // Sync payment statuses from Xendit if requested
      if (syncFromXendit) {
        try {
          console.log('[FINANCE-PAGE] Starting payment sync...');
          const syncResult = await PaymentRequestService.syncAllPaymentStatuses(user.id);
          console.log('[FINANCE-PAGE] Sync complete:', syncResult);
          
          // Wait a bit for Firestore to propagate updates (increased delay)
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if (syncResult.updated > 0) {
            toast.success(`Updated ${syncResult.updated} payment status${syncResult.updated > 1 ? 'es' : ''}`);
          } else if (syncResult.synced > 0) {
            toast.success(`Checked ${syncResult.synced} payment${syncResult.synced > 1 ? 's' : ''} - all up to date`);
          }
        } catch (error: any) {
          console.error('[FINANCE-PAGE] Error syncing payment statuses:', error);
          toast.error(`Sync failed: ${error.message || 'Unknown error'}`);
        }
      }
      
      const paymentRequests = await PaymentRequestService.getPaymentRequests(user.id);
      console.log('[FINANCE-PAGE] Fetched payments:', paymentRequests.length, 'total');
      
      // PaymentRequestService now returns dates properly converted, but ensure they're Date objects
      const processedPayments = paymentRequests.map(p => ({
        ...p,
        createdAt: p.createdAt instanceof Date ? p.createdAt : new Date(p.createdAt || Date.now()),
        updatedAt: p.updatedAt instanceof Date ? p.updatedAt : new Date(p.updatedAt || Date.now()),
        dueDate: p.dueDate instanceof Date ? p.dueDate : new Date(p.dueDate || Date.now()),
        paidAt: p.paidAt ? (p.paidAt instanceof Date ? p.paidAt : new Date(p.paidAt)) : undefined,
        status: p.status || 'pending',
        amount: p.amount || 0,
        currency: p.currency || 'PHP',
        paymentMethods: p.paymentMethods || []
      }));
      
      // Log payment statuses for debugging
      const statusCounts = processedPayments.reduce((acc, p) => {
        const status = String(p.status || '').toLowerCase();
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log('[FINANCE-PAGE] Payment status counts:', statusCounts);
      
      // Log outstanding payments specifically
      const outstanding = processedPayments.filter(p => {
        const status = String(p.status || '').toLowerCase();
        return status === 'pending' || status === 'expired';
      });
      console.log('[FINANCE-PAGE] Outstanding payments count:', outstanding.length);
      console.log('[FINANCE-PAGE] Outstanding payments:', outstanding.map(p => ({ id: p.id, status: p.status, amount: p.amount })));
      
      // Log paid payments to verify they're not in outstanding
      const paid = processedPayments.filter(p => String(p.status || '').toLowerCase() === 'paid');
      console.log('[FINANCE-PAGE] Paid payments count:', paid.length);
      console.log('[FINANCE-PAGE] Paid payments:', paid.map(p => ({ id: p.id, status: p.status, amount: p.amount })));
      
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
    } catch (error: any) {
      console.error('Error fetching financial data:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      toast.error(`Failed to load financial data: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Calculate financial metrics from real payment data
  const getFilteredPayments = () => {
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }
    
    return payments.filter(p => {
      const paymentDate = p.paidAt || p.createdAt;
      return paymentDate >= startDate;
    });
  };

  const filteredPayments = getFilteredPayments();
  
  // Use case-insensitive comparison for status filtering
  const paidPayments = filteredPayments.filter(p => String(p.status || '').toLowerCase() === 'paid');
  const pendingPayments = filteredPayments.filter(p => String(p.status || '').toLowerCase() === 'pending');
  const expiredPayments = filteredPayments.filter(p => String(p.status || '').toLowerCase() === 'expired');
  
  const totalRevenue = paidPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const pendingAmount = pendingPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const overdueAmount = expiredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  
  // Outstanding payments = pending + expired
  const outstandingAmount = pendingAmount + overdueAmount;
  const outstandingPayments = [...pendingPayments, ...expiredPayments];
  
  // Calculate collection rate (paid / (paid + expired))
  const collectionRate = paidPayments.length + expiredPayments.length > 0
    ? Math.round((paidPayments.length / (paidPayments.length + expiredPayments.length)) * 100)
    : 0;
  
  // Calculate monthly growth (compare current period with previous period)
  const getPreviousPeriodPayments = () => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    
    switch (timeRange) {
      case "week":
        endDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
        endDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear(), 0, 1);
        break;
    }
    
    return payments.filter(p => {
      const paymentDate = p.paidAt || p.createdAt;
      return paymentDate >= startDate && paymentDate < endDate && p.status === 'paid';
    });
  };

  const previousPeriodPayments = getPreviousPeriodPayments();
  const previousRevenue = previousPeriodPayments.reduce((sum, p) => sum + p.amount, 0);
  const monthlyGrowth = previousRevenue > 0 
    ? totalRevenue - previousRevenue 
    : totalRevenue;
  const growthPercent = previousRevenue > 0
    ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100)
    : totalRevenue > 0 ? 100 : 0;

  const financialStats = [
    {
      title: "Total Revenue",
      value: `₱${totalRevenue.toLocaleString()}`,
      change: growthPercent !== 0 ? `${growthPercent > 0 ? '+' : ''}${growthPercent}%` : "0%",
      changeType: growthPercent >= 0 ? "increase" as const : "decrease" as const,
      icon: DollarSign,
      color: "from-green-500 to-green-600",
      glow: "shadow-green-500/25"
    },
    {
      title: "Monthly Growth",
      value: `₱${monthlyGrowth.toLocaleString()}`,
      change: `${paidPayments.length} paid`,
      changeType: monthlyGrowth >= 0 ? "increase" as const : "decrease" as const,
      icon: TrendingUp,
      color: "from-blue-500 to-blue-600",
      glow: "shadow-blue-500/25"
    },
    {
      title: "Outstanding Payments",
      value: `₱${outstandingAmount.toLocaleString()}`,
      change: `${outstandingPayments.length} pending`,
      changeType: "decrease" as const,
      icon: TrendingDown,
      color: "from-orange-500 to-orange-600",
      glow: "shadow-orange-500/25"
    },
    {
      title: "Collection Rate",
      value: `${collectionRate}%`,
      change: `${paidPayments.length} of ${paidPayments.length + expiredPayments.length}`,
      changeType: collectionRate >= 90 ? "increase" as const : "decrease" as const,
      icon: BarChart3,
      color: "from-purple-500 to-purple-600",
      glow: "shadow-purple-500/25"
    }
  ];

  // Generate chart data from payment history
  const generateChartData = () => {
    const now = new Date();
    let months: { label: string; date: Date }[] = [];
    
    switch (timeRange) {
      case "week":
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          months.push({ label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), date });
        }
        break;
      case "month":
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        for (let i = 0; i < Math.min(daysInMonth, 30); i++) {
          const date = new Date(now.getFullYear(), now.getMonth(), i + 1);
          months.push({ label: `${i + 1}`, date });
        }
        break;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        for (let i = 0; i < 3; i++) {
          const date = new Date(now.getFullYear(), quarter * 3 + i, 1);
          months.push({ label: date.toLocaleDateString('en-US', { month: 'short' }), date });
        }
        break;
      case "year":
        for (let i = 0; i < 12; i++) {
          const date = new Date(now.getFullYear(), i, 1);
          months.push({ label: date.toLocaleDateString('en-US', { month: 'short' }), date });
        }
        break;
    }

    return months.map(({ label, date }) => {
      let endDate = new Date(date);
      switch (timeRange) {
        case "week":
        case "month":
          endDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
          break;
        case "quarter":
          endDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);
          break;
        case "year":
          endDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);
          break;
      }

      const periodPayments = paidPayments.filter(p => {
        const paymentDate = p.paidAt || p.createdAt;
        return paymentDate >= date && paymentDate < endDate;
      });

      const revenue = periodPayments.reduce((sum, p) => sum + p.amount, 0);
      const pending = filteredPayments.filter(p => {
        const paymentDate = p.paidAt || p.createdAt;
        const status = String(p.status || '').toLowerCase();
        return paymentDate >= date && paymentDate < endDate && (status === 'pending' || status === 'expired');
      }).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      return {
        period: label,
        revenue,
        pending,
        transactions: periodPayments.length
      };
    });
  };

  const chartData = generateChartData();

  // Calculate payment method distribution
  const paymentMethodDistribution = () => {
    const methodMap: Record<string, { count: number; amount: number }> = {};
    
    paidPayments.forEach(payment => {
      payment.paymentMethods?.forEach(method => {
        if (!methodMap[method]) {
          methodMap[method] = { count: 0, amount: 0 };
        }
        methodMap[method].count += 1;
        methodMap[method].amount += payment.amount / payment.paymentMethods.length;
      });
    });

    const total = Object.values(methodMap).reduce((sum, m) => sum + m.amount, 0);
    
    const colors: Record<string, string> = {
      'GCASH': '#10b981',
      'PAYMAYA': '#3b82f6',
      'GRABPAY': '#8b5cf6',
      'CREDIT_CARD': '#f59e0b',
      'BPI': '#ef4444',
      'BDO': '#6366f1',
      '7ELEVEN': '#6b7280',
      'CEBUANA': '#ec4899'
    };

    return Object.entries(methodMap)
      .map(([method, data]) => ({
        name: method.replace('_', ' '),
        value: total > 0 ? Math.round((data.amount / total) * 100) : 0,
        amount: Math.round(data.amount),
        count: data.count,
        color: colors[method] || '#6b7280'
      }))
      .sort((a, b) => b.value - a.value);
  };

  const paymentMethodData = paymentMethodDistribution();

  // Get recent transactions
  const recentTransactions = filteredPayments
    .sort((a, b) => {
      const dateA = a.paidAt || a.createdAt;
      const dateB = b.paidAt || b.createdAt;
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 10)
    .map(payment => {
      const details = paymentDetails[payment.id] || {};
      return {
        id: payment.id,
        xenditInvoiceId: payment.xenditInvoiceId, // Keep for marking as paid
        paymentStatus: payment.status, // Keep original status for delete check
        tenant: details.tenantName || 'Unknown Tenant',
        property: details.propertyName || 'Unknown Property',
        amount: `₱${payment.amount.toLocaleString()}`,
        type: "Rent Payment",
        status: payment.status === 'paid' ? 'Completed' : payment.status === 'pending' ? 'Pending' : 'Overdue',
        date: (payment.paidAt || payment.createdAt).toLocaleDateString(),
        method: payment.paymentMethods?.[0]?.replace('_', ' ') || 'Multiple'
      };
    });

  // Smart insights and forecasts
  const generateInsights = () => {
    const insights: { type: 'success' | 'warning' | 'info'; message: string; icon: any }[] = [];

    // Collection rate insight
    if (collectionRate >= 95) {
      insights.push({
        type: 'success',
        message: `Excellent collection rate of ${collectionRate}%! Keep up the great work.`,
        icon: CheckCircle
      });
    } else if (collectionRate < 80) {
      insights.push({
        type: 'warning',
        message: `Collection rate is ${collectionRate}%. Consider following up on overdue payments.`,
        icon: AlertCircle
      });
    }

    // Growth trend
    if (growthPercent > 10) {
      insights.push({
        type: 'success',
        message: `Strong growth of ${growthPercent}% compared to previous period.`,
        icon: TrendingUp
      });
    } else if (growthPercent < -10) {
      insights.push({
        type: 'warning',
        message: `Revenue decreased by ${Math.abs(growthPercent)}%. Review payment collection strategies.`,
        icon: TrendingDown
      });
    }

    // Pending payments
    if (outstandingAmount > totalRevenue * 0.2) {
      insights.push({
        type: 'warning',
        message: `High outstanding amount (₱${outstandingAmount.toLocaleString()}). Follow up with ${outstandingPayments.length} tenants.`,
        icon: Clock
      });
    }

    // Forecast (simple linear projection)
    if (chartData.length >= 3) {
      const recentRevenue = chartData.slice(-3).map(d => d.revenue);
      const avgRevenue = recentRevenue.reduce((a, b) => a + b, 0) / recentRevenue.length;
      if (avgRevenue > 0) {
        insights.push({
          type: 'info',
          message: `Based on recent trends, projected revenue next period: ₱${Math.round(avgRevenue).toLocaleString()}`,
          icon: Sparkles
        });
      }
    }

    return insights;
  };

  const insights = generateInsights();

  const handleDeleteClick = (transaction: typeof recentTransactions[0]) => {
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
      fetchFinancialData(); // Refresh the data
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

  const handleMarkAsPaid = async (transaction: typeof recentTransactions[0]) => {
    if (!transaction.xenditInvoiceId || !user?.id) {
      toast.error('Cannot mark as paid: Missing invoice ID');
      return;
    }

    try {
      setMarkingAsPaidId(transaction.id);
      console.log(`[FINANCE-PAGE] Manually marking payment ${transaction.id} as paid (invoice: ${transaction.xenditInvoiceId})`);
      
      // Use the payment ID to find the payment and update it
      // We'll use updatePaymentStatus which requires xenditInvoiceId
      await PaymentRequestService.updatePaymentStatus(
        transaction.xenditInvoiceId,
        'paid',
        new Date() // Set paidAt to now
      );
      
      console.log(`[FINANCE-PAGE] ✅ Successfully marked payment ${transaction.id} as paid`);
      toast.success(`Payment marked as paid successfully!`);
      
      // Refresh the data
      await fetchFinancialData(false);
    } catch (error: any) {
      console.error('[FINANCE-PAGE] Error marking payment as paid:', error);
      toast.error(`Failed to mark as paid: ${error.message || 'Unknown error'}`);
    } finally {
      setMarkingAsPaidId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
      case "paid":
        return "bg-green-100 text-green-800";
      case "Pending":
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "Overdue":
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleExport = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Financial Summary
      const summaryData = [
        ['RENTMATIC - FINANCIAL SUMMARY REPORT', '', '', ''],
        ['Generated on:', new Date().toLocaleString(), '', ''],
        ['', '', '', ''],
        ['KEY METRICS', '', '', ''],
        ['Metric', 'Value', '', ''],
        ['Total Revenue', totalRevenue, 'PHP', ''],
        ['Monthly Growth', monthlyGrowth, `PHP (${growthPercent > 0 ? '+' : ''}${growthPercent}%)`, ''],
        ['Outstanding Payments', outstandingAmount, 'PHP', ''],
        ['Collection Rate', collectionRate, '%', ''],
        ['', '', '', ''],
        ['PERIOD SUMMARY', '', '', ''],
        ['Category', 'Count', '', ''],
        ['Paid Payments', paidPayments.length, '', ''],
        ['Pending Payments', pendingPayments.length, '', ''],
        ['Expired Payments', expiredPayments.length, '', ''],
        ['', '', '', ''],
        ['Time Range', timeRange === 'week' ? 'This Week' : timeRange === 'month' ? 'This Month' : timeRange === 'quarter' ? 'This Quarter' : 'This Year', '', '']
      ];

      // Add insights if available
      if (insights.length > 0) {
        summaryData.push(['', '', '', '']);
        summaryData.push(['SMART INSIGHTS', '', '', '']);
        summaryData.push(['Type', 'Message', '', '']);
        insights.forEach(insight => {
          summaryData.push([insight.type.toUpperCase(), insight.message, '', '']);
        });
      }

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Merge header cells and set column widths
      summarySheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Title row
        { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } }, // KEY METRICS header
        { s: { r: 10, c: 0 }, e: { r: 10, c: 3 } }, // PERIOD SUMMARY header
        ...(insights.length > 0 ? [{ s: { r: summaryData.length - insights.length - 1, c: 0 }, e: { r: summaryData.length - insights.length - 1, c: 3 } }] : []) // INSIGHTS header
      ];
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 10 }];
      
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Sheet 2: Transactions
      if (recentTransactions.length > 0 || payments.length > 0) {
        // Export ALL transactions, not just recent ones
        const allTransactions = filteredPayments
          .sort((a, b) => {
            const dateA = a.paidAt || a.createdAt;
            const dateB = b.paidAt || b.createdAt;
            return dateB.getTime() - dateA.getTime();
          })
          .map(payment => {
            const details = paymentDetails[payment.id] || {};
            return {
              tenant: details.tenantName || 'Unknown Tenant',
              property: details.propertyName || 'Unknown Property',
              unit: details.unitName || 'N/A',
              amount: payment.amount,
              status: payment.status === 'paid' ? 'Completed' : payment.status === 'pending' ? 'Pending' : 'Overdue',
              date: (payment.paidAt || payment.createdAt).toLocaleDateString(),
              paidDate: payment.paidAt ? payment.paidAt.toLocaleDateString() : 'N/A',
              method: payment.paymentMethods?.join(', ') || 'Multiple',
              description: payment.description || '',
              invoiceId: payment.xenditInvoiceId || payment.id.substring(0, 8)
            };
          });

        const transactionsData = [
          ['TRANSACTION HISTORY', '', '', '', '', '', '', '', ''],
          ['', '', '', '', '', '', '', '', ''],
          ['Tenant', 'Property', 'Unit', 'Amount (₱)', 'Status', 'Created Date', 'Paid Date', 'Payment Method', 'Description', 'Invoice ID']
        ];
        allTransactions.forEach(transaction => {
          transactionsData.push([
            transaction.tenant,
            transaction.property,
            transaction.unit,
            transaction.amount,
            transaction.status,
            transaction.date,
            transaction.paidDate,
            transaction.method,
            transaction.description,
            transaction.invoiceId
          ]);
        });

        const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionsData);
        transactionsSheet['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } } // Title row
        ];
        transactionsSheet['!cols'] = [
          { wch: 20 }, // Tenant
          { wch: 25 }, // Property
          { wch: 15 }, // Unit
          { wch: 15 }, // Amount
          { wch: 12 }, // Status
          { wch: 15 }, // Created Date
          { wch: 15 }, // Paid Date
          { wch: 20 }, // Payment Method
          { wch: 30 }, // Description
          { wch: 15 }  // Invoice ID
        ];
        XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transactions');
      }

      // Sheet 3: Payment Methods
      if (paymentMethodData.length > 0) {
        const paymentMethodsData = [
          ['PAYMENT METHODS BREAKDOWN', '', '', ''],
          ['', '', '', ''],
          ['Payment Method', 'Amount (₱)', 'Percentage (%)', 'Transaction Count']
        ];
        paymentMethodData.forEach(method => {
          paymentMethodsData.push([
            method.name,
            method.amount,
            method.value,
            method.count
          ]);
        });
        
        // Add total row
        const totalAmount = paymentMethodData.reduce((sum, m) => sum + m.amount, 0);
        const totalCount = paymentMethodData.reduce((sum, m) => sum + m.count, 0);
        paymentMethodsData.push(['', '', '', '']);
        paymentMethodsData.push(['TOTAL', totalAmount, '100%', totalCount]);

        const paymentMethodsSheet = XLSX.utils.aoa_to_sheet(paymentMethodsData);
        paymentMethodsSheet['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } } // Title row
        ];
        paymentMethodsSheet['!cols'] = [
          { wch: 20 }, // Payment Method
          { wch: 18 }, // Amount
          { wch: 15 }, // Percentage
          { wch: 18 }  // Count
        ];
        XLSX.utils.book_append_sheet(workbook, paymentMethodsSheet, 'Payment Methods');
      }

      // Sheet 4: Chart Data (Revenue by Period)
      if (chartData.length > 0) {
        const chartDataSheet = [
          ['REVENUE TRENDS BY PERIOD', '', '', ''],
          ['', '', '', ''],
          ['Period', 'Revenue (₱)', 'Pending (₱)', 'Number of Transactions']
        ];
        chartData.forEach(data => {
          chartDataSheet.push([
            data.period,
            data.revenue,
            data.pending,
            data.transactions
          ]);
        });
        
        // Add totals row
        const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
        const totalPending = chartData.reduce((sum, d) => sum + d.pending, 0);
        const totalTrans = chartData.reduce((sum, d) => sum + d.transactions, 0);
        chartDataSheet.push(['', '', '', '']);
        chartDataSheet.push(['TOTAL', totalRevenue, totalPending, totalTrans]);

        const chartSheet = XLSX.utils.aoa_to_sheet(chartDataSheet);
        chartSheet['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } } // Title row
        ];
        chartSheet['!cols'] = [
          { wch: 15 }, // Period
          { wch: 18 }, // Revenue
          { wch: 18 }, // Pending
          { wch: 22 }  // Transactions
        ];
        XLSX.utils.book_append_sheet(workbook, chartSheet, 'Revenue Trends');
      }

      // Generate Excel file with formatting
      const excelBuffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'array',
        cellStyles: true
      });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial-summary-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Financial data exported to Excel successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export to Excel. Please try again.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <FadeIn direction="up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Summary</h1>
            <p className="text-gray-600">Track revenue, expenses, and financial performance</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fetchFinancialData(true)}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Clock className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Syncing...' : 'Sync Payments'}</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              disabled={loading || payments.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                // Filter functionality
                alert('Filter functionality - coming soon!');
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </motion.button>
          </div>
        </div>
      </FadeIn>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {financialStats.map((stat, index) => (
          <FadeIn
            key={index}
            direction="up"
            delay={0.1 * index}
            className="group"
          >
            <Card variant="elevated" className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:scale-105">
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
          </FadeIn>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2">
          <FadeIn direction="up" delay={0.2}>
            <Card variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Revenue Overview</CardTitle>
                    <CardDescription>Monthly revenue trends and performance</CardDescription>
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
                    <select
                      value={chartType}
                      onChange={(e) => setChartType(e.target.value)}
                      className="px-3 py-1 bg-white/50 backdrop-blur-sm border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300"
                    >
                      <option value="line">Line Chart</option>
                      <option value="bar">Bar Chart</option>
                      <option value="pie">Pie Chart</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {loading ? (
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading financial data...</p>
                    </div>
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="h-80 bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <BarChart3 className="w-12 h-12 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">No Data Available</h3>
                      <p className="text-gray-500">Start collecting payments to see revenue analytics</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === "line" ? (
                        <RechartsLineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="period" 
                            stroke="#6b7280"
                            fontSize={12}
                          />
                          <YAxis 
                            stroke="#6b7280"
                            fontSize={12}
                            tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}K`}
                          />
                          <Tooltip 
                            formatter={(value: number, name: string) => [
                              `₱${value.toLocaleString()}`,
                              name === 'revenue' ? 'Revenue' : name === 'pending' ? 'Pending' : 'Transactions'
                            ]}
                            labelStyle={{ color: '#374151', fontWeight: 600 }}
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#10b981" 
                            strokeWidth={3}
                            dot={{ fill: '#10b981', r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Revenue"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="pending" 
                            stroke="#f59e0b" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ fill: '#f59e0b', r: 4 }}
                            name="Pending"
                          />
                        </RechartsLineChart>
                      ) : chartType === "bar" ? (
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="period" 
                            stroke="#6b7280"
                            fontSize={12}
                          />
                          <YAxis 
                            stroke="#6b7280"
                            fontSize={12}
                            tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}K`}
                          />
                          <Tooltip 
                            formatter={(value: number, name: string) => [
                              `₱${value.toLocaleString()}`,
                              name === 'revenue' ? 'Revenue' : name === 'pending' ? 'Pending' : 'Transactions'
                            ]}
                            labelStyle={{ color: '#374151', fontWeight: 600 }}
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Legend />
                          <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue" />
                          <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Pending" />
                        </BarChart>
                      ) : (
                        <RechartsPieChart>
                          <Pie
                            data={chartData.map(d => ({ name: d.period, value: d.revenue }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ₱${(value / 1000).toFixed(0)}K`}
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#6366f1'][index % 6]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => `₱${value.toLocaleString()}`}
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                        </RechartsPieChart>
                      )}
                    </ResponsiveContainer>
                    
                    {/* Smart Insights */}
                    {insights.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {insights.map((insight, idx) => {
                          const Icon = insight.icon;
                          return (
                            <div
                              key={idx}
                              className={`flex items-start space-x-2 p-2 rounded-lg text-sm ${
                                insight.type === 'success' ? 'bg-green-50 text-green-800' :
                                insight.type === 'warning' ? 'bg-orange-50 text-orange-800' :
                                'bg-blue-50 text-blue-800'
                              }`}
                            >
                              <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>{insight.message}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <FadeIn direction="up" delay={0.3}>
            <Card variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900">Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                {paymentMethodData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No payment method data available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentMethodData.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.name}</span>
                          <div className="text-right">
                            <span className="font-medium">₱{item.amount.toLocaleString()}</span>
                            <span className="text-xs text-gray-500 ml-2">({item.value}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.value}%` }}
                            transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                            className="h-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn direction="up" delay={0.4}>
            <Card variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900">Collection Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${
                    collectionRate >= 95 ? 'text-green-600' :
                    collectionRate >= 80 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {collectionRate}%
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    {timeRange === 'week' ? 'This Week' :
                     timeRange === 'month' ? 'This Month' :
                     timeRange === 'quarter' ? 'This Quarter' :
                     'This Year'}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(collectionRate, 100)}%` }}
                      transition={{ duration: 1.5, delay: 0.8 }}
                      className={`h-3 rounded-full ${
                        collectionRate >= 95 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                        collectionRate >= 80 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                        'bg-gradient-to-r from-red-500 to-red-600'
                      }`}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Target: 95%</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {paidPayments.length} paid, {expiredPayments.length} expired
                  </p>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </div>

      {/* Recent Transactions */}
      <FadeIn direction="up" delay={0.5}>
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Transactions</h2>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading transactions...</p>
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No transactions found</p>
              <p className="text-sm text-gray-500">Start collecting payments to see transaction history</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTransactions.map((transaction, index) => (
                <FadeIn
                  key={transaction.id}
                  direction="up"
                  delay={0.6 + 0.1 * index}
                  className="group"
                >
                  <Card variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300"
                          >
                            <DollarSign className="w-6 h-6 text-white" />
                          </motion.div>
                          
                          <div>
                            <h3 className="font-semibold text-gray-900">{transaction.tenant}</h3>
                            <p className="text-sm text-gray-600">{transaction.property}</p>
                            <p className="text-xs text-gray-500">{transaction.date} • {transaction.method}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">{transaction.amount}</div>
                            <div className="text-sm text-gray-600">{transaction.type}</div>
                          </div>
                          
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </div>
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                          >
                            <Eye className="w-5 h-5" />
                          </motion.button>
                          
                          {/* Mark as Paid button - only show for pending/expired payments */}
                          {(transaction.paymentStatus === 'pending' || transaction.paymentStatus === 'expired') && transaction.xenditInvoiceId && (
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
                          
                          {/* Delete button - only show for pending/expired/failed payments */}
                          {(transaction.paymentStatus === 'pending' || transaction.paymentStatus === 'expired' || transaction.paymentStatus === 'failed') && (
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
                </FadeIn>
              ))}
            </div>
          )}
        </div>
      </FadeIn>

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
    </div>
  );
}

export default function FinancePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading financial data...</p>
        </div>
      </div>
    }>
      <FinancePageContent />
    </Suspense>
  );
}
