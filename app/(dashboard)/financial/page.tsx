"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useUserStore } from "@/store/useUserStore";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Download,
  Filter,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Building2,
  Users,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/Animations/FadeIn";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { doc, collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { getClientDb } from "@/lib/firebase";

interface FinancialData {
  totalRevenue: number;
  monthlyGrowth: number;
  outstandingPayments: number;
  collectionRate: number;
  properties: number;
  tenants: number;
}

interface Transaction {
  id: string;
  tenant: string;
  property: string;
  amount: number;
  date: Date;
  status: "completed" | "pending" | "failed";
  method: "bank_transfer" | "credit_card" | "cash" | "online";
  type: "rent" | "deposit" | "fee" | "refund";
}

export default function FinancialPage() {
  const { user } = useUserStore();
  const [financialData, setFinancialData] = useState<FinancialData>({
    totalRevenue: 0,
    monthlyGrowth: 0,
    outstandingPayments: 0,
    collectionRate: 0,
    properties: 0,
    tenants: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [timeRange, setTimeRange] = useState("month");
  const [loading, setLoading] = useState(true);
  
  const financialRef = useRef(null);
  const inView = useInView(financialRef, { once: true });

  useEffect(() => {
    if (user?.id) {
      fetchFinancialData();
    }
  }, [user?.id, timeRange]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      // Fetch properties
      const db = getClientDb();
      if (!db) throw new Error("Firestore not available");
      const propertiesRef = collection(db, "users", user?.id || "", "properties");
      const propertiesSnapshot = await getDocs(propertiesRef);
      const properties = propertiesSnapshot.docs.map(doc => doc.data());
      
      // Calculate financial metrics
      const totalRevenue = properties.reduce((sum, property) => 
        sum + (property.rentAmount * property.occupiedUnits), 0
      );
      
      const monthlyGrowth = totalRevenue * 0.08; // 8% growth simulation
      const outstandingPayments = totalRevenue * 0.12; // 12% outstanding simulation
      const collectionRate = 94; // 94% collection rate simulation
      
      setFinancialData({
        totalRevenue,
        monthlyGrowth,
        outstandingPayments,
        collectionRate,
        properties: properties.length,
        tenants: properties.reduce((sum, property) => sum + property.occupiedUnits, 0)
      });

      // Generate mock transaction data
      generateMockTransactions();
    } catch (error) {
      console.error("Error fetching financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockTransactions = () => {
    const mockTransactions: Transaction[] = [
      {
        id: "1",
        tenant: "John Doe",
        property: "Greenwood Apartments - 2A",
        amount: 15000,
        date: new Date(2024, 9, 3),
        status: "completed",
        method: "bank_transfer",
        type: "rent"
      },
      {
        id: "2",
        tenant: "Sarah Wilson",
        property: "Sunset Villa - 1B",
        amount: 18000,
        date: new Date(2024, 9, 2),
        status: "pending",
        method: "credit_card",
        type: "rent"
      },
      {
        id: "3",
        tenant: "Mike Johnson",
        property: "Riverside Complex - 5C",
        amount: 12000,
        date: new Date(2024, 9, 1),
        status: "completed",
        method: "cash",
        type: "rent"
      },
      {
        id: "4",
        tenant: "Lisa Chen",
        property: "Greenwood Apartments - 3B",
        amount: 15000,
        date: new Date(2024, 8, 30),
        status: "failed",
        method: "bank_transfer",
        type: "rent"
      }
    ];
    
    setTransactions(mockTransactions);
  };

  const chartData = [
    { month: "Jan", revenue: 120000, expenses: 15000 },
    { month: "Feb", revenue: 135000, expenses: 18000 },
    { month: "Mar", revenue: 142000, expenses: 16000 },
    { month: "Apr", revenue: 138000, expenses: 17000 },
    { month: "May", revenue: 145000, expenses: 19000 },
    { month: "Jun", revenue: 150000, expenses: 20000 }
  ];

  const paymentMethodData = [
    { name: "Bank Transfer", value: 60, amount: 90000, color: "#10b981" },
    { name: "Credit Card", value: 25, amount: 37500, color: "#3b82f6" },
    { name: "Online Payment", value: 10, amount: 15000, color: "#8b5cf6" },
    { name: "Cash", value: 5, amount: 7500, color: "#6b7280" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "bank_transfer":
        return Building2;
      case "credit_card":
        return CreditCard;
      case "cash":
        return DollarSign;
      case "online":
        return Users;
      default:
        return CreditCard;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <FadeIn direction="up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Financial Summary</h1>
            <p className="text-gray-600 text-lg">Track revenue, expenses, and financial performance across your properties.</p>
            <div className="mt-2">
              <button 
                onClick={() => window.open('/finance', '_blank')}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                View Summary Dashboard →
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                // Export functionality
                const data = {
                  financialData,
                  transactions,
                  exportDate: new Date().toISOString()
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `financial-summary-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                // Filter functionality - could open a filter modal
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
        {[
          { 
            title: "Total Revenue", 
            value: `₱${financialData.totalRevenue.toLocaleString()}`, 
            icon: DollarSign, 
            color: "text-green-600", 
            bg: "bg-green-50",
            change: "+12%",
            changeType: "increase"
          },
          { 
            title: "Monthly Growth", 
            value: `₱${financialData.monthlyGrowth.toLocaleString()}`, 
            icon: TrendingUp, 
            color: "text-blue-600", 
            bg: "bg-blue-50",
            change: "+8%",
            changeType: "increase"
          },
          { 
            title: "Outstanding Payments", 
            value: `₱${financialData.outstandingPayments.toLocaleString()}`, 
            icon: AlertCircle, 
            color: "text-orange-600", 
            bg: "bg-orange-50",
            change: "-3%",
            changeType: "decrease"
          },
          { 
            title: "Collection Rate", 
            value: `${financialData.collectionRate}%`, 
            icon: BarChart3, 
            color: "text-purple-600", 
            bg: "bg-purple-50",
            change: "+1%",
            changeType: "increase"
          }
        ].map((stat, index) => (
          <FadeIn key={stat.title} direction="up" delay={0.1 * index} className="group">
            <Card variant="elevated" className="h-full bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:scale-105">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-xl font-semibold text-gray-800">{stat.title}</CardTitle>
                <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <motion.p
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                  className="text-4xl font-bold text-gray-900 mb-2"
                >
                  {stat.value}
                </motion.p>
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
              </CardContent>
            </Card>
          </FadeIn>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <FadeIn direction="up" delay={0.2}>
          <Card variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">Revenue Overview</CardTitle>
                  <CardDescription>Monthly revenue trends and performance</CardDescription>
                </div>
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
            </CardHeader>
            
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [`₱${value.toLocaleString()}`, name === 'revenue' ? 'Revenue' : 'Expenses']}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Payment Methods */}
        <FadeIn direction="up" delay={0.3}>
          <Card variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900">Payment Methods</CardTitle>
              <CardDescription>Distribution of payment methods used by tenants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentMethodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `${value}%`, 
                        props.payload.name,
                        `₱${props.payload.amount.toLocaleString()}`
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 space-y-2">
                {paymentMethodData.map((method, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: method.color }}></div>
                      <span className="text-sm text-gray-600">{method.name}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      ₱{method.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Recent Transactions */}
      <FadeIn direction="up" delay={0.4}>
        <Card variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">Recent Transactions</CardTitle>
            <CardDescription>Latest payment activity and transaction history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.map((transaction, index) => {
                const MethodIcon = getMethodIcon(transaction.method);
                
                return (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                        <MethodIcon className="w-6 h-6 text-white" />
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-gray-900">{transaction.tenant}</h3>
                        <p className="text-sm text-gray-600">{transaction.property}</p>
                        <p className="text-xs text-gray-500">{transaction.date.toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          ₱{transaction.amount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 capitalize">
                          {transaction.type.replace('_', ' ')}
                        </div>
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
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
