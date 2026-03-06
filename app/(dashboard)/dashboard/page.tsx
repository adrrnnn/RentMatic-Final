"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Building2, 
  Users, 
  DollarSign, 
  FileText, 
  Clock,
  Home
} from "lucide-react";
import { Button } from "@/components/Button";
import { useUserStore } from "@/store/useUserStore";
import { DashboardService, DashboardStats, RecentActivity } from "@/lib/services/dashboardService";
import { DashboardCalendar } from "@/components/dashboard/DashboardCalendar";
import { AutoReminderService } from "@/lib/services/autoReminderService";
import { Property, Unit } from "@/types/firestore";
import Link from "next/link";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    activeTenants: 0,
    monthlyRevenue: 0,
    pendingRequests: 0,
    occupancyRate: 0,
    totalUnits: 0,
    occupiedUnits: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUserStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) {
        console.log("No user ID available");
        return;
      }
      
      console.log("Fetching dashboard data for user:", user.id);
      try {
        setLoading(true);
        const data = await DashboardService.getDashboardData(user.id);
        console.log("Dashboard data received:", data);
        setStats(data.stats);
        setRecentActivity(data.recentActivity);
        setProperties(data.properties || []);
        setUnits(data.units || []);
        console.log("Dashboard data loaded:", data);

        // Check and send auto reminders (silently in background)
        // This runs every time dashboard loads, checking if today is a reminder date
        AutoReminderService.processAllReminders(user.id).catch(err => {
          console.warn('Background reminder check failed (non-critical):', err);
        });
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        // Set some test data to verify the UI is working
        setStats({
          totalProperties: 1,
          activeTenants: 1,
          monthlyRevenue: 5000,
          pendingRequests: 0,
          occupancyRate: 50,
          totalUnits: 2,
          occupiedUnits: 1
        });
        setRecentActivity([{
          id: 'test',
          type: 'property',
          title: 'Test Property added',
          description: 'This is test data to verify UI',
          timestamp: new Date().toISOString(),
          icon: 'Building2'
        }]);
      } finally {
        setLoading(false);
      }
    };

    if (mounted && user?.id) {
      console.log("Dashboard mounted, user available:", user);
      fetchDashboardData();
    } else {
      console.log("Dashboard not ready - mounted:", mounted, "user:", user);
    }
  }, [mounted, user?.id]);

  if (!mounted) {
    return (
      <div className="py-6 space-y-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const userName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || "User";
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  return (
    <div className="py-6 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, <span className="text-green-600">{userName}</span>
          </h1>
          <p className="text-gray-600 text-lg">Here&apos;s a quick overview of your account.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{new Date().toLocaleDateString()}</span>
          </div>
          <Link href="/properties">
            <Button className="flex items-center">
              <Building2 className="w-4 h-4 mr-2" /> Manage Properties
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Properties</p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? "..." : stats.totalProperties}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Tenants</p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? "..." : stats.activeTenants}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? "..." : formatCurrency(stats.monthlyRevenue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl text-emerald-600">₱</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? "..." : `${stats.occupancyRate}%`}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.occupiedUnits}/{stats.totalUnits} units
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Links */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/dashboard">
            <div className="p-4 border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-colors cursor-pointer">
              <Home className="w-8 h-8 text-green-600 mb-2" />
              <h3 className="font-medium text-gray-900">Dashboard Overview</h3>
              <p className="text-sm text-gray-600">View your account summary and stats</p>
            </div>
          </Link>
          <Link href="/properties">
            <div className="p-4 border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-colors cursor-pointer">
              <Building2 className="w-8 h-8 text-green-600 mb-2" />
              <h3 className="font-medium text-gray-900">Manage Properties</h3>
              <p className="text-sm text-gray-600">Add, edit, or view your properties</p>
            </div>
          </Link>
          <Link href="/properties">
            <div className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
              <Users className="w-8 h-8 text-blue-600 mb-2" />
              <h3 className="font-medium text-gray-900">Manage Tenants</h3>
              <p className="text-sm text-gray-600">Add, edit, or view tenant information</p>
            </div>
          </Link>
          <Link href="/finance">
            <div className="p-4 border border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-colors cursor-pointer">
              <span className="text-3xl text-emerald-600 mb-2">₱</span>
              <h3 className="font-medium text-gray-900">View Finances</h3>
              <p className="text-sm text-gray-600">Track income and expenses</p>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* Property Calendar */}
      {properties.length > 0 && units.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.6 }} 
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <DashboardCalendar properties={properties} units={units} />
        </motion.div>
      )}

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
              </div>
            </div>
          ) : recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  {activity.type === 'property' ? (
                    <Building2 className="w-4 h-4 text-green-600" />
                  ) : activity.type === 'tenant' ? (
                    <Users className="w-4 h-4 text-blue-600" />
                  ) : (
                    <FileText className="w-4 h-4 text-orange-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-600">{activity.description}</p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(activity.timestamp).toLocaleDateString()}
                </span>
              </motion.div>
            ))
          ) : (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Building2 className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Welcome to RentMatic!</p>
                <p className="text-xs text-gray-600">Get started by adding your first property</p>
              </div>
              <span className="text-xs text-gray-500">Just now</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
