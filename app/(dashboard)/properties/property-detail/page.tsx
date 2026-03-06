"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, Users, DollarSign, Home, Calendar, Edit, Trash2, Plus, MapPin, User, Clock, Map, Phone, Mail, CreditCard, Shield, FileText, Star, Wifi, Car, Dog, Ban, Users as UsersIcon, Bell, Tag, CheckCircle, AlertCircle, X, Eye, ExternalLink, Send, TrendingUp, BarChart3 } from "lucide-react";
import { Button } from "@/components/Button";
import { useUserStore } from "@/store/useUserStore";
import { PropertyService } from "@/lib/firestore/properties/propertyService";
import { UnitService } from "@/lib/firestore/properties/unitService";
import { TenantService } from "@/lib/firestore/properties/tenantService";
import type { Property, Unit, Tenant, CreateUnitData, UpdateUnitData } from "@/types/firestore";
import { toast } from "react-hot-toast";

// Import unit components
import { UnitDialog } from "./components/UnitDialog";
import { UnitCard } from "./components/UnitCard";
import { UnitViewModal } from "./components/UnitViewModal";
import { TenantAssignmentDialog } from "./components/TenantAssignmentDialog";
import { TenantUnitViewer } from "./components/TenantUnitViewer";
import { PaymentMethodsConfig } from "@/components/payments/PaymentMethodsConfig";
import { PaymentMethod } from "@/lib/services/xenditService";
import { PaymentSetupModal } from "@/components/payments/PaymentSetupModal";
import { PaymentRequestForm } from "@/components/payments/PaymentRequestForm";
import { PaymentMethodIcon } from "@/components/payments/PaymentMethodIcon";
import { BillingSettingsConfig } from "@/components/billing/BillingSettingsConfig";
import type { BillingSettings } from "@/components/billing/BillingSettingsConfig";
import { BillingSettingsTabs } from "@/components/billing/BillingSettingsTabs";

type TabType = "overview" | "payments" | "units" | "amenities";

export default function PropertyDetailPage() {
  console.log("PropertyDetailPage loaded with drag-and-drop functionality");
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("id");
  const { user } = useUserStore();
  
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  
  // Data state
  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBillingUnitId, setSelectedBillingUnitId] = useState<string | null>(null);
  const [selectedBillingTenant, setSelectedBillingTenant] = useState<Tenant | null>(null);

  // Dialog states
  const [showUnitDialog, setShowUnitDialog] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [showUnitViewModal, setShowUnitViewModal] = useState(false);
  const [viewingUnit, setViewingUnit] = useState<Unit | null>(null);
  const [showTenantAssignmentDialog, setShowTenantAssignmentDialog] = useState(false);
  const [assigningUnit, setAssigningUnit] = useState<Unit | null>(null);
  const [saving, setSaving] = useState(false);
  const [draggedTenant, setDraggedTenant] = useState<Tenant | null>(null);
  const [showTenantViewer, setShowTenantViewer] = useState(false);
  const [showPaymentConfig, setShowPaymentConfig] = useState(false);
  const [showPaymentSetupModal, setShowPaymentSetupModal] = useState(false);
  const [showPaymentRequestModal, setShowPaymentRequestModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showBillingSettings, setShowBillingSettings] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [tenantSearch, setTenantSearch] = useState<string>("");
  const isPaymentConfigured = !!property?.paymentMethods && property.paymentMethods.length > 0;

  // Load property data
  useEffect(() => {
    if (!user?.id || !propertyId) {
      setLoading(false);
      setError("User not authenticated or property ID missing.");
      return;
    }

    setLoading(true);
    const unsubscribeProperty = PropertyService.getPropertiesListener(
      user.id,
      (properties) => {
        const fetchedProperty = properties.find(p => p.id === propertyId);
        if (fetchedProperty) {
          setProperty(fetchedProperty);
        } else {
          setError("Property not found.");
        }
        setLoading(false);
      }
    );

    const unsubscribeUnits = UnitService.getUnitsListener(
      user.id,
      propertyId,
      (fetchedUnits) => {
        setUnits(fetchedUnits);
      }
    );

    const unsubscribeTenants = TenantService.getTenantsListener(
      user.id,
      (fetchedTenants) => {
        console.log("All tenants loaded:", fetchedTenants);
        console.log("Property ID:", propertyId);
        const propertyTenants = fetchedTenants.filter(tenant => {
          if (tenant.unitId) {
            const assignedUnit = units.find(unit => unit.id === tenant.unitId);
            return assignedUnit && assignedUnit.propertyId === propertyId;
          }
          return tenant.propertyId === propertyId;
        });
        console.log("Property tenants:", propertyTenants);
        setTenants(fetchedTenants);
      }
    );

    return () => {
      unsubscribeProperty();
      unsubscribeUnits();
      unsubscribeTenants();
    };
  }, [user?.id, propertyId]);


  // Tab configuration
  const tabs = [
    {
      id: "overview" as TabType,
      label: "Overview",
      icon: Home,
      count: null
    },
    {
      id: "payments" as TabType,
      label: "Payments",
      icon: CreditCard,
      count: null
    },
    {
      id: "amenities" as TabType,
      label: "Policies",
      icon: Shield,
      count: null
    },
    {
      id: "units" as TabType,
      label: "Units",
      icon: Building2,
      count: units.length
    }
  ];

  const handleBackToProperties = () => {
    router.push("/properties");
  };

  const handleEditProperty = () => {
    // TODO: Implement edit property modal
    toast.success("Edit Property functionality coming soon!");
  };

  const handleSavePaymentMethods = async (methods: PaymentMethod[]) => {
    if (!property || !user || !propertyId) return;
    
    try {
      setSaving(true);
      await PropertyService.updateProperty(user.id, propertyId, {
        paymentMethods: methods
      });
      
      // Update local state
      setProperty(prev => prev ? { ...prev, paymentMethods: methods } : null);
      setShowPaymentConfig(false);
      toast.success('Payment methods updated successfully');
    } catch (error) {
      console.error('Error updating payment methods:', error);
      toast.error('Failed to update payment methods');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBillingSettings = async (settings: BillingSettings) => {
    if (!property || !user || !propertyId) return;
    
    try {
      setSaving(true);
      // Convert BillingSettings to billingDefaults format
      const billingDefaults = {
        dueDay: settings.dueDay,
        graceDays: settings.graceDays,
        lateFeeType: settings.lateFeeType,
        lateFeeValue: settings.lateFeeValue,
        reminderDaysBefore: settings.reminderDaysBefore
      };
      
      await PropertyService.updateProperty(user.id, propertyId, {
        billingDefaults
      });
      
      // Update local state
      setProperty(prev => prev ? { ...prev, billingDefaults } : null);
      setShowBillingSettings(false);
      toast.success('Billing settings updated successfully');
    } catch (error) {
      console.error('Error updating billing settings:', error);
      toast.error('Failed to update billing settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProperty = () => {
    // TODO: Implement delete property confirmation
    toast.success("Delete Property functionality coming soon!");
  };

  // Unit handlers
  const handleCreateUnit = () => {
    setEditingUnit(null);
    setShowUnitDialog(true);
  };

  const handleEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setShowUnitDialog(true);
  };

  const handleViewUnit = (unit: Unit) => {
    setViewingUnit(unit);
    setShowUnitViewModal(true);
  };

  const handleSaveUnit = async (data: CreateUnitData | UpdateUnitData) => {
    if (!user?.id || !propertyId) return;

    console.log("Saving unit:", { editingUnit: !!editingUnit, data, propertyId, userId: user.id });
    
    setSaving(true);
    try {
      if (editingUnit) {
        // Update existing unit
        console.log("Updating unit:", editingUnit.id, "with data:", data);
        await UnitService.updateUnit(user.id, propertyId, editingUnit.id, data as UpdateUnitData);
        toast.success("Unit updated successfully!");
      } else {
        // Create new unit
        console.log("Creating new unit with data:", data);
        await UnitService.createUnit(user.id, propertyId, data as CreateUnitData);
        toast.success("Unit created successfully!");
      }
      setShowUnitDialog(false);
      setEditingUnit(null);
    } catch (error) {
      console.error("Failed to save unit:", error);
      toast.error(`Failed to save unit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  // Save & Add Another handler
  const handleSaveAndAddAnotherUnit = async (data: CreateUnitData) => {
    if (!user?.id || !propertyId) return;
    setSaving(true);
    try {
      await UnitService.createUnit(user.id, propertyId, data);
      toast.success("Unit created. You can add another.");
      // Keep dialog open for next entry
    } catch (error) {
      console.error("Failed to create unit:", error);
      toast.error("Failed to create unit. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUnit = async (unit: Unit) => {
    if (!user?.id || !propertyId) return;

    if (confirm(`Are you sure you want to delete "${unit.name}"? This action cannot be undone.`)) {
      try {
        await UnitService.deleteUnit(user.id, propertyId, unit.id);
        toast.success("Unit deleted successfully!");
      } catch (error) {
        console.error("Failed to delete unit:", error);
        toast.error("Failed to delete unit. Please try again.");
      }
    }
  };

  const handleAssignTenant = (unit: Unit) => {
    setAssigningUnit(unit);
    setShowTenantAssignmentDialog(true);
  };

  const handleAssignTenantToUnit = async (tenantId: string, unitId: string) => {
    if (!user?.id) return;
    
    // Find the unit to get its actual propertyId
    const unit = units.find(u => u.id === unitId);
    if (!unit) {
      toast.error("Unit not found");
      return;
    }
    
    try {
      setSaving(true);
      console.log("Using unit's propertyId:", unit.propertyId, "for unit:", unitId);
      await UnitService.assignTenantToUnit(user.id, unit.propertyId, unitId, tenantId);
      toast.success("Tenant assigned to unit successfully!");
    } catch (error) {
      console.error("Error assigning tenant to unit:", error);
      toast.error("Failed to assign tenant. Please try again.");
      throw error; // Re-throw so the dialog can handle it
    } finally {
      setSaving(false);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (tenant: Tenant) => {
    console.log("Drag started for tenant:", tenant.fullName);
    setDraggedTenant(tenant);
  };

  const handleDragEnd = () => {
    setDraggedTenant(null);
  };

  const handleDropOnUnit = async (unit: Unit) => {
    console.log("Drop attempted on unit:", unit.name, "with tenant:", draggedTenant?.fullName);
    if (!draggedTenant || !user?.id || !propertyId) return;
    
    if (unit.status === "Occupied") {
      toast.error("This unit is already occupied!");
      return;
    }

    try {
      await UnitService.assignTenantToUnit(user.id, propertyId, unit.id, draggedTenant.id);
      toast.success(`${draggedTenant.fullName} assigned to ${unit.name}!`);
    } catch (error) {
      console.error("Failed to assign tenant:", error);
      toast.error("Failed to assign tenant. Please try again.");
    }
  };

  const handleUnassignTenant = async (unit: Unit) => {
    if (!user?.id || !propertyId || !unit.tenantId) return;

    try {
      await UnitService.unassignTenantFromUnit(user.id, propertyId, unit.id);
      toast.success("Tenant unassigned successfully!");
    } catch (error) {
      console.error("Failed to unassign tenant:", error);
      toast.error("Failed to unassign tenant. Please try again.");
    }
  };


  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-16">
          <div className="text-red-500 mb-4">{error}</div>
          <Button onClick={handleBackToProperties}>
            Go back to Properties
          </Button>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-6">
        <div className="text-center py-16">
          <div className="text-gray-500 mb-4">Property not found.</div>
          <Button onClick={handleBackToProperties}>
            Go back to Properties
          </Button>
        </div>
      </div>
    );
  }

  // Calculate stats for Overview tab
  const totalUnits = units.length;
  const occupiedUnits = units.filter((unit) => unit.status === "Occupied").length;
  const availableUnits = units.filter((unit) => unit.status === "Available").length;
  const maintenanceUnits = units.filter((unit) => unit.status === "Under Maintenance").length;
  const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

  const monthlyIncomePotential = units.reduce((sum, unit) => {
    if (unit.status === "Occupied") {
      switch (unit.rentType) {
        case "Monthly":
          return sum + unit.rentAmount;
        case "Quarterly":
          return sum + unit.rentAmount / 3;
        case "Yearly":
          return sum + unit.rentAmount / 12;
        default:
          return sum;
      }
    }
    return sum;
  }, 0);

  const assignedTenantsCount = tenants.filter(
    (tenant) => tenant.unitId && units.some(unit => unit.id === tenant.unitId)
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-gray-50 min-h-screen"
    >
      {/* Compact Header */}
      <div className="mb-6">
        {/* Breadcrumb and Back Button */}
        <div className="flex items-center space-x-4 mb-4">
          <Button
            onClick={handleBackToProperties}
            variant="outline"
            size="sm"
            className="text-gray-600 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Properties
          </Button>
          <div className="text-sm text-gray-500">
            Properties <span className="mx-2">›</span> {property.name}
          </div>
        </div>

        {/* Compact Property Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-md border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{property.name}</h1>
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    {property.type}
                  </span>
                  {property.manager && (
                    <span className="text-sm text-gray-600">Manager: {property.manager}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleEditProperty}
                variant="outline"
                size="sm"
                className="text-yellow-600 hover:bg-yellow-50"
              >
                <Edit className="w-4 h-4 mr-1" /> Edit
              </Button>
              <Button
                onClick={handleDeleteProperty}
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Tabs with Modern Design */}
      <div className="mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-green-500 text-white shadow-md"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                  {tab.count !== null && (
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full font-medium ${
                      isActive ? "bg-white bg-opacity-20 text-white" : "bg-gray-200 text-gray-600"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Units" value={totalUnits} icon={<Building2 />} color="bg-blue-500" />
              <StatCard title="Occupied" value={occupiedUnits} icon={<Users />} color="bg-red-500" />
              <StatCard title="Available" value={availableUnits} icon={<Home />} color="bg-green-500" />
              <StatCard title="Occupancy Rate" value={`${occupancyRate.toFixed(0)}%`} icon={<DollarSign />} color="bg-purple-500" />
            </div>

            {/* Property Header with Image */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              {property.imageURL && (
                <div className="h-48 bg-gradient-to-r from-green-500 to-green-600 relative">
                  <img 
                    src={property.imageURL} 
                    alt={property.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{property.name}</h1>
                    <div className="flex items-center space-x-3 mb-4">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        {property.type}
                      </span>
                      {property.addressPH?.province && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {property.addressPH.province}
                        </span>
                      )}
                      {property.tags && property.tags.length > 0 && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                          {property.tags[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{property.address}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleEditProperty}
                      variant="outline"
                      size="sm"
                      className="text-yellow-600 hover:bg-yellow-50"
                    >
                      <Edit className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button
                      onClick={handleDeleteProperty}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleCreateUnit} className="bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="w-4 h-4 mr-2" /> Add Unit
                </Button>
                <Button variant="outline" className="text-blue-600 hover:bg-blue-50">
                  <Users className="w-4 h-4 mr-2" /> Add Tenant
                </Button>
                <Button variant="outline" onClick={handleEditProperty} className="text-yellow-600 hover:bg-yellow-50">
                  <Edit className="w-4 h-4 mr-2" /> Edit Property
                </Button>
                <Button variant="outline" onClick={() => setShowTenantViewer(true)} className="text-purple-600 hover:bg-purple-50">
                  <Eye className="w-4 h-4 mr-2" /> Tenant View
                </Button>
              </div>
            </div>
          </div>
        )}


        {activeTab === "payments" && (
          <div className="space-y-6">
            {units.length > 0 ? (
              <>
                {/* Unit Selector - Only show if multiple units */}
                {units.length > 1 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Unit
                    </label>
                    <select
                      value={selectedBillingUnitId || units[0]?.id || ''}
                      onChange={(e) => {
                        const unitId = e.target.value;
                        setSelectedBillingUnitId(unitId || null);
                        if (unitId) {
                          const selectedUnit = units.find(u => u.id === unitId);
                          if (selectedUnit?.tenantId) {
                            const tenant = tenants.find(t => t.id === selectedUnit.tenantId);
                            setSelectedBillingTenant(tenant || null);
                          } else {
                            setSelectedBillingTenant(null);
                          }
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    >
                      {units.map((unit) => {
                        const unitTenant = tenants.find(t => t.id === unit.tenantId);
                        return (
                          <option key={unit.id} value={unit.id}>
                            {unit.name} {unitTenant ? `- ${unitTenant.fullName}` : '(Vacant)'}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {/* Billing Settings Tabs - Show for selected unit or first unit */}
                {(() => {
                  const displayUnit = selectedBillingUnitId 
                    ? units.find(u => u.id === selectedBillingUnitId) 
                    : units[0];
                  
                  if (!displayUnit) return null;

                  const displayTenant = displayUnit.tenantId 
                    ? tenants.find(t => t.id === displayUnit.tenantId) 
                    : null;

                  return (
                    <BillingSettingsTabs
                      unit={displayUnit}
                      tenant={displayTenant ? {
                        fullName: displayTenant.fullName,
                        contact: displayTenant.contact,
                        leaseStartDate: displayTenant.leaseStartDate,
                        leaseEndDate: displayTenant.leaseEndDate,
                        leaseTerms: displayTenant.leaseTerms,
                        securityDeposit: displayTenant.securityDeposit
                      } : undefined}
                      onSave={async (billingSettings) => {
                        if (!propertyId || !user?.id) return;
                        await UnitService.updateUnit(user.id, propertyId, displayUnit.id, {
                          billingSettings
                        });
                        toast.success('Billing settings updated successfully');
                      }}
                      onCancel={() => {
                        // Don't navigate away, just clear selection if multiple units
                        if (units.length > 1) {
                          setSelectedBillingUnitId(null);
                        }
                      }}
                      loading={false}
                      propertyId={propertyId || undefined}
                      userId={user?.id || undefined}
                    />
                  );
                })()}
              </>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Units Available</h3>
                <p className="text-gray-600 mb-4">Add units to this property to configure billing settings.</p>
                <Button onClick={handleCreateUnit} className="bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Unit
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "amenities" && (
          <div className="space-y-8">
            {/* Policies Hero Section */}
            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl shadow-lg border border-red-100 p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mr-6 shadow-lg">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Property Policies</h2>
                    <p className="text-gray-600">Set rules and policies for your property</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Property Policies */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center mr-3">
                    <Shield className="w-4 h-4 text-red-600" />
                  </div>
                  Property Rules & Policies
                </h3>
              </div>
              
              {/* Create New Policy Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-gray-900 flex items-center">
                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <Plus className="w-4 h-4 text-blue-600" />
                    </div>
                    Add New Policy
                  </h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Policy Type
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Select policy type...</option>
                      <option value="pet">🐕 Pet Policy</option>
                      <option value="smoking">🚭 Smoking Policy</option>
                      <option value="guest">👥 Guest Policy</option>
                      <option value="curfew">🕐 Curfew Policy</option>
                      <option value="noise">🔊 Noise Policy</option>
                      <option value="parking">🚗 Parking Policy</option>
                      <option value="custom">✏️ Custom Policy</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Policy Details
                    </label>
                    <textarea 
                      placeholder="Enter your policy details here..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg">
                    Add Policy
                  </Button>
                </div>
              </div>

              {/* Current Policies List */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-bold text-gray-900">Current Policies</h4>
                  <div className="text-sm text-gray-500">0 policies</div>
                </div>
                
                {/* Empty State */}
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Shield className="w-10 h-10 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">No Policies Created Yet</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Property policies help set clear expectations for your tenants. Create your first policy to establish rules and guidelines.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      variant="outline"
                      className="px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Learn More
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-sm hover:shadow-md transition-all">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Policy
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "units" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Units Management</h2>
                <p className="text-gray-600 mt-1">Manage units for {property.name}</p>
              </div>
              <Button onClick={handleCreateUnit} className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="w-4 h-4 mr-2" /> Add Unit
              </Button>
            </div>

            {/* Two Column Layout: Units + Tenant List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Units Section */}
              <div className="lg:col-span-2">
                {units.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Building2 className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Units Found</h3>
                    <p className="text-gray-500 mb-6">Start by adding your first unit to this property.</p>
                    <Button onClick={handleCreateUnit} className="bg-green-600 hover:bg-green-700 text-white">
                      <Plus className="w-4 h-4 mr-2" /> Add Your First Unit
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {units.map((unit) => {
                      const assignedTenant = tenants.find(tenant => tenant.unitId === unit.id);
                      return (
                        <div
                          key={unit.id}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDropOnUnit(unit)}
                          className={`transition-all duration-200 ${
                            draggedTenant && unit.status === "Available" 
                              ? "ring-2 ring-green-400 ring-opacity-50 bg-green-50" 
                              : ""
                          }`}
                        >
                          <UnitCard
                            unit={unit}
                            assignedTenant={assignedTenant}
                            onEdit={handleEditUnit}
                            onDelete={handleDeleteUnit}
                            onView={handleViewUnit}
                            onAssignTenant={handleAssignTenant}
                            onUnassignTenant={handleUnassignTenant}
                            onDropTenant={handleAssignTenantToUnit}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tenant List Section */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-blue-600" />
                      Available Tenants
                    </h3>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {tenants.filter(t => !t.unitId).length} available
                    </span>
                  </div>

                  {tenants.filter(t => !t.unitId).length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">No Available Tenants</h4>
                      <p className="text-xs text-gray-500 mb-4">All tenants are assigned to units</p>
                      <Button 
                        onClick={() => {/* Navigate to tenant creation */}} 
                        variant="outline" 
                        size="sm"
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add Tenant
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {tenants
                        .filter(t => !t.unitId)
                        .map((tenant) => (
                          <div
                            key={tenant.id}
                            draggable
                            onDragStart={() => setDraggedTenant(tenant)}
                            onDragEnd={() => setDraggedTenant(null)}
                            className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-100 hover:border-blue-200 cursor-move transition-all duration-200 hover:shadow-md"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 truncate">
                                  {tenant.fullName}
                                </h4>
                                <p className="text-sm text-gray-600 truncate">
                                  {tenant.contact?.email}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {tenant.contact?.phone}
                                </p>
                              </div>
                              <div className="text-xs text-blue-600 font-medium">
                                Drag to assign
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Instructions */}
                  <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-start space-x-2">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-green-600 text-xs">💡</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-green-800 mb-1">How to Assign</h4>
                        <p className="text-xs text-green-700">
                          Drag tenants from this list to available units on the left to assign them.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
      </motion.div>

      {/* Unit Dialog */}
      {showUnitDialog && (
        <UnitDialog
          isOpen={showUnitDialog}
          onClose={() => {
            setShowUnitDialog(false);
            setEditingUnit(null);
          }}
          onSave={handleSaveUnit}
          onSaveAddAnother={handleSaveAndAddAnotherUnit}
          unit={editingUnit}
          propertyId={propertyId || ""}
          loading={saving}
          suggestedName={`Unit ${String(units.length + 1).padStart(3, '0')}`}
          userId={user?.id}
        />
      )}

      {/* Unit View Modal */}
      {showUnitViewModal && viewingUnit && (
        <UnitViewModal
          isOpen={showUnitViewModal}
          onClose={() => {
            setShowUnitViewModal(false);
            setViewingUnit(null);
          }}
          unit={viewingUnit}
          assignedTenant={tenants.find(t => t.unitId === viewingUnit.id)}
          onRemoveTenant={handleUnassignTenant}
        />
      )}

      {/* Tenant Assignment Dialog */}
      {showTenantAssignmentDialog && (
        <TenantAssignmentDialog
          isOpen={showTenantAssignmentDialog}
          onClose={() => {
            setShowTenantAssignmentDialog(false);
            setAssigningUnit(null);
          }}
          onAssign={handleAssignTenantToUnit}
          unit={assigningUnit}
          propertyId={propertyId || ""}
          userId={user?.id || ""}
          loading={saving}
        />
      )}

      {/* Tenant Unit Viewer Modal */}
      {showTenantViewer && (
        <TenantUnitViewer
          property={property}
          units={units}
          onClose={() => setShowTenantViewer(false)}
        />
      )}

      {/* Payment Setup Modal */}
      <PaymentSetupModal
        isOpen={showPaymentSetupModal}
        onClose={() => setShowPaymentSetupModal(false)}
        propertyId={propertyId || ""}
        propertyName={property?.name || 'Property'}
      />

      {/* Payment Request Modal */}
      {showPaymentRequestModal && selectedTenant && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <PaymentRequestForm
            propertyId={propertyId || ""}
            tenantId={selectedTenant.id}
            tenantName={selectedTenant.fullName}
            tenantEmail={selectedTenant.contact.email}
            onClose={() => {
              setShowPaymentRequestModal(false);
              setSelectedTenant(null);
            }}
          />
        </div>
      )}
    </motion.div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <div className={`relative p-4 rounded-xl shadow-md overflow-hidden ${color} text-white`}>
    <div className="absolute top-3 right-3 opacity-20">
      {icon}
    </div>
    <p className="text-sm font-medium opacity-80 mb-1">{title}</p>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);