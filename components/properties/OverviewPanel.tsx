"use client";

import { motion } from "framer-motion";
import { Building2, Users, DollarSign, TrendingUp, Calendar, MapPin } from "lucide-react";
import type { Property, Unit, Tenant } from "@/types/properties";

interface OverviewPanelProps {
  property: Property;
  units: Unit[];
  tenants: Tenant[];
}

export function OverviewPanel({ property, units }: OverviewPanelProps) {
  // Calculate detailed stats
  const occupiedUnits = units.filter(unit => unit.status === 'occupied').length;
  const vacantUnits = units.filter(unit => unit.status === 'vacant').length;
  const maintenanceUnits = units.filter(unit => unit.status === 'maintenance').length;
  const monthlyIncome = units.reduce((sum, unit) => sum + unit.rentAmount, 0);
  const occupancyRate = property.totalUnits > 0 ? Math.round((occupiedUnits / property.totalUnits) * 100) : 0;
  
  // Calculate average rent
  const averageRent = occupiedUnits > 0 ? Math.round(monthlyIncome / occupiedUnits) : 0;

  const stats = [
    {
      label: "Total Units",
      value: property.totalUnits,
      icon: Building2,
      color: "blue",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      label: "Occupied Units",
      value: occupiedUnits,
      icon: Users,
      color: "green",
      bgColor: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      label: "Vacant Units",
      value: vacantUnits,
      icon: Building2,
      color: "gray",
      bgColor: "bg-gray-100",
      iconColor: "text-gray-600"
    },
    {
      label: "Maintenance",
      value: maintenanceUnits,
      icon: TrendingUp,
      color: "orange",
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600"
    },
    {
      label: "Occupancy Rate",
      value: `${occupancyRate}%`,
      icon: TrendingUp,
      color: "emerald",
      bgColor: "bg-emerald-100",
      iconColor: "text-emerald-600"
    },
    {
      label: "Monthly Income",
      value: `₱${(monthlyIncome || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "yellow",
      bgColor: "bg-yellow-100",
      iconColor: "text-yellow-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Property Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-600">Address</p>
                <p className="text-gray-900">{property.address}</p>
              </div>
            </div>
            
            {property.description && (
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Description</p>
                  <p className="text-gray-900">{property.description}</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-600">Created</p>
                <p className="text-gray-900">
                  {new Date(property.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rent</p>
                <p className="text-gray-900">
                  {averageRent > 0 ? `₱${averageRent.toLocaleString()}` : 'No occupied units'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Occupancy Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Occupancy Breakdown</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Occupied</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">{occupiedUnits} units</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${property.totalUnits > 0 ? (occupiedUnits / property.totalUnits) * 100 : 0}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Vacant</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">{vacantUnits} units</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gray-400 h-3 rounded-full transition-all duration-500"
              style={{ width: `${property.totalUnits > 0 ? (vacantUnits / property.totalUnits) * 100 : 0}%` }}
            />
          </div>
          
          {maintenanceUnits > 0 && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Maintenance</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{maintenanceUnits} units</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-orange-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${property.totalUnits > 0 ? (maintenanceUnits / property.totalUnits) * 100 : 0}%` }}
                />
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
