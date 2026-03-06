"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Building2, Edit, Trash2, Camera, ArrowLeft, Users, DollarSign, TrendingUp, Calendar, Plus } from "lucide-react";
import { Button } from "@/components/Button";
import { useUserStore } from "@/store/useUserStore";
import { PropertyService } from "@/lib/firestore/properties/propertyService";
import { UnitService } from "@/lib/firestore/properties/unitService";
import { TenantService } from "@/lib/firestore/properties/tenantService";
import type { Property, Unit, Tenant } from "@/types/firestore";
import { toast } from "react-hot-toast";

type TabType = "overview" | "units" | "tenants";

interface PropertyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
}

export function PropertyDetailModal({ isOpen, onClose, property }: PropertyDetailModalProps) {
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  
  // Data state
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);

  // Load data when modal opens
  useEffect(() => {
    if (!isOpen || !property || !user?.id) {
      setUnits([]);
      setTenants([]);
      return;
    }

    setLoading(true);

    // Listen to units for this property
    const unsubscribeUnits = UnitService.getUnitsListener(
      user.id,
      property.id,
      (unitsData) => {
        setUnits(unitsData);
        setLoading(false);
      }
    );

    // Listen to all tenants (we'll filter client-side)
    const unsubscribeTenants = TenantService.getTenantsListener(
      user.id,
      (tenantsData) => {
        setTenants(tenantsData);
      }
    );

    return () => {
      unsubscribeUnits();
      unsubscribeTenants();
    };
  }, [isOpen, property, user?.id]);

  // Tab configuration
  const tabs = [
    {
      id: "overview" as TabType,
      label: "Overview",
      count: null
    },
    {
      id: "units" as TabType,
      label: "Units",
      count: units.length
    },
    {
      id: "tenants" as TabType,
      label: "Tenants",
      count: tenants.filter(t => t.unitId && units.some(u => u.id === t.unitId)).length
    }
  ];

  // Property handlers
  const handleEditProperty = () => {
    toast.success("Edit property functionality coming soon!");
  };

  const handleDeleteProperty = async () => {
    if (!user?.id || !property) return;
    
    if (confirm(`Are you sure you want to delete "${property.name}"? This action cannot be undone.`)) {
      try {
        await PropertyService.deleteProperty(user.id, property.id);
        toast.success("Property deleted successfully!");
        onClose();
      } catch (error) {
        console.error("Failed to delete property:", error);
        toast.error("Failed to delete property. Please try again.");
      }
    }
  };

  if (!isOpen || !property) return null;

  // Calculate stats for overview
  const occupiedUnits = units.filter(unit => unit.status === "Occupied").length;
  const availableUnits = units.filter(unit => unit.status === "Available").length;
  const maintenanceUnits = units.filter(unit => unit.status === "Under Maintenance").length;
  
  const occupancyRate = property.numberOfUnits > 0 ? (occupiedUnits / property.numberOfUnits) * 100 : 0;
  
  const monthlyIncome = units
    .filter(unit => unit.status === "Occupied")
    .reduce((total, unit) => {
      switch (unit.rentType) {
        case "Monthly":
          return total + unit.rentAmount;
        case "Quarterly":
          return total + (unit.rentAmount / 3);
        case "Yearly":
          return total + (unit.rentAmount / 12);
        default:
          return total + unit.rentAmount;
      }
    }, 0);

  const assignedTenants = tenants.filter(tenant => 
    tenant.unitId && units.some(unit => unit.id === tenant.unitId)
  ).length;

  const stats = [
    {
      title: "Total Units",
      value: property.numberOfUnits,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Occupied Units",
      value: occupiedUnits,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Available Units",
      value: availableUnits,
      icon: Building2,
      color: "text-gray-600",
      bgColor: "bg-gray-100"
    },
    {
      title: "Occupancy Rate",
      value: `${occupancyRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "Monthly Income",
      value: `₱${monthlyIncome.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Assigned Tenants",
      value: assignedTenants,
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100"
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-gray-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-white">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{property.name}</h2>
              <p className="text-sm text-gray-600">Property Details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Property Image */}
        <div className="h-48 w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
          {property.imageURL ? (
            <img
              src={property.imageURL}
              alt={property.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 font-medium">No image uploaded</p>
            </div>
          )}
        </div>

        {/* Property Info */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div>
                <div className="flex items-center space-x-4 text-gray-600 mb-2">
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium border border-green-200">
                    {property.type}
                  </span>
                  {property.manager && (
                    <span className="text-sm">Manager: {property.manager}</span>
                  )}
                </div>
                <p className="text-gray-600">{property.address}</p>
                {property.description && (
                  <p className="text-gray-500 text-sm mt-2">{property.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={handleEditProperty}
                variant="outline"
                size="sm"
                className="text-yellow-600 hover:bg-yellow-50"
              >
                <Edit className="w-4 h-4 mr-2" /> Edit
              </Button>
              <Button
                onClick={handleDeleteProperty}
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span
                      className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                            <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                          </div>
                          <div className={`w-8 h-8 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                            <Icon className={`w-4 h-4 ${stat.color}`} />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Unit Status Breakdown */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Unit Status</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <p className="text-sm font-medium text-green-800">Occupied</p>
                    <p className="text-xl font-bold text-green-900">{occupiedUnits}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <p className="text-sm font-medium text-blue-800">Available</p>
                    <p className="text-xl font-bold text-blue-900">{availableUnits}</p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                    <p className="text-sm font-medium text-yellow-800">Maintenance</p>
                    <p className="text-xl font-bold text-yellow-900">{maintenanceUnits}</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Add Unit
                  </Button>
                  <Button size="sm" variant="outline" className="text-blue-600 hover:bg-blue-50">
                    <Users className="w-4 h-4 mr-2" /> Add Tenant
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === "units" && (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Units management coming soon!</p>
              <p className="text-gray-400 text-sm">This will show all units for this property</p>
            </div>
          )}
          
          {activeTab === "tenants" && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Tenants management coming soon!</p>
              <p className="text-gray-400 text-sm">This will show all tenants for this property</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}


