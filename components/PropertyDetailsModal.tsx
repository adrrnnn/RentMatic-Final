"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, MapPin, Users, Home, Plus } from "lucide-react";
import type { Property, Unit, Tenant } from "@/types/firestore";
// TODO: migrate this modal to new services when used
import { UnitCard } from "./UnitCard";
import { SimpleTenantModal } from "./SimpleTenantModal";
import { PropertyService } from "@/lib/firestore/properties/propertyService";
import { UnitService } from "@/lib/firestore/properties/unitService";
import { TenantService } from "@/lib/firestore/properties/tenantService";

interface PropertyDetailsModalProps {
  property: Property;
  onClose: () => void;
  userId: string;
}

type TabType = "overview" | "units" | "tenants";

export function PropertyDetailsModal({
  property,
  onClose,
  userId,
}: PropertyDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [unassignedTenants, setUnassignedTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [draggedTenantId, setDraggedTenantId] = useState<string | null>(null);
  const [dragOverUnitId, setDragOverUnitId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property.id, userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [unitsData, assignedTenantsData, unassignedTenantsData] =
        await Promise.all([
          UnitService.getUnits(userId, property.id),
          TenantService.getTenantsByProperty(userId, property.id),
          TenantService.getUnassignedTenants(userId),
        ]);

      setUnits(unitsData.sort((a, b) => a.name.localeCompare(b.name)));
      setTenants(assignedTenantsData);
      setUnassignedTenants(unassignedTenantsData);
    } catch (error) {
      console.error("Error loading property details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTenant = async (unitId: string, tenantId: string) => {
    try {
      const tenant = unassignedTenants.find((t) => t.id === tenantId);
      if (!tenant) return;

      await UnitService.assignTenantToUnit(
        userId,
        property.id,
        unitId,
        tenantId
      );

      // Refresh data
      await loadData();
    } catch (error) {
      console.error("Error assigning tenant:", error);
      alert("Failed to assign tenant. Please try again.");
    }
  };

  const handleRemoveTenant = async (unitId: string) => {
    const unit = units.find((u) => u.id === unitId);
    if (!unit || !unit.tenantId) return;

    const tenant = tenants.find((t) => t.id === unit.tenantId);
    const tenantName = tenant?.fullName || 'Unknown Tenant';

    if (!confirm(`Remove ${tenantName} from Unit #${unit.name}?`)) {
      return;
    }

    try {
      await UnitService.unassignTenantFromUnit(
        userId,
        property.id,
        unitId
      );

      // Refresh data
      await loadData();
    } catch (error) {
      console.error("Error removing tenant:", error);
      alert("Failed to remove tenant. Please try again.");
    }
  };

  const handleTenantDragStart = (tenantId: string) => {
    setDraggedTenantId(tenantId);
  };

  const handleTenantDragEnd = () => {
    setDraggedTenantId(null);
    setDragOverUnitId(null);
  };

  const handleUnitDrop = async (unitId: string) => {
    if (draggedTenantId) {
      await handleAssignTenant(unitId, draggedTenantId);
    }
    handleTenantDragEnd();
  };

  const handleCreateTenant = () => {
    setSelectedTenant(null);
    setShowTenantModal(true);
  };

  const handleEditTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setShowTenantModal(true);
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (!confirm("Are you sure you want to delete this tenant?")) return;

    try {
      await TenantService.deleteTenant(userId, tenantId);
      await loadData();
    } catch (error) {
      console.error("Error deleting tenant:", error);
      alert("Failed to delete tenant. Please try again.");
    }
  };

  const handleTenantModalClose = async (success: boolean) => {
    setShowTenantModal(false);
    setSelectedTenant(null);
    if (success) {
      await loadData();
    }
  };

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: Building2 },
    { id: "units" as TabType, label: "Units", icon: Home },
    { id: "tenants" as TabType, label: "Tenants", icon: Users },
  ];

  const totalUnitsCount = units.length > 0 ? units.length : (property.numberOfUnits || 0);
  const occupiedCount = tenants.length;
  const occupancyRate = totalUnitsCount > 0
    ? Math.round((occupiedCount / totalUnitsCount) * 100)
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{property.name}</h2>
                <p className="text-green-100 flex items-center mt-1">
                  <MapPin className="w-4 h-4 mr-1" />
                  {property.address}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white bg-opacity-10 rounded-lg p-3">
              <p className="text-green-100 text-sm">Total Units</p>
              <p className="text-2xl font-bold">{totalUnitsCount}</p>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-3">
              <p className="text-green-100 text-sm">Occupied</p>
              <p className="text-2xl font-bold">{occupiedCount}</p>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-3">
              <p className="text-green-100 text-sm">Occupancy Rate</p>
              <p className="text-2xl font-bold">{occupancyRate}%</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 mt-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? "bg-white text-green-700 font-semibold"
                      : "bg-white bg-opacity-20 text-white hover:bg-opacity-30"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Building Information
                    </h3>
                    <div className="space-y-2 text-gray-700">
                      <p>
                        <span className="font-medium">Address:</span>{" "}
                        {property.address}
                      </p>
                      <p>
                        <span className="font-medium">Status:</span>{" "}
                        <span className="inline-block px-2 py-1 rounded text-sm bg-green-100 text-green-700">
                          Active
                        </span>
                      </p>
                      {property.description && (
                        <p>
                          <span className="font-medium">Description:</span>{" "}
                          {property.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-700 font-medium">
                            Vacant Units
                          </p>
                          <p className="text-4xl font-bold text-green-900 mt-2">
                            {Math.max(totalUnitsCount - occupiedCount, 0)}
                          </p>
                        </div>
                        <Home className="w-12 h-12 text-green-500" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-700 font-medium">
                            Total Tenants
                          </p>
                          <p className="text-4xl font-bold text-blue-900 mt-2">
                            {tenants.length}
                          </p>
                        </div>
                        <Users className="w-12 h-12 text-blue-500" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "units" && (
                <motion.div
                  key="units"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Unit Management
                    </h3>
                    <p className="text-sm text-gray-600">
                      Drag tenants from the pool below to assign them to units
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                    {units.map((unit) => (
                      <UnitCard
                        key={unit.id}
                        unit={unit}
                        tenant={tenants.find(t => t.id === unit.tenantId)}
                      />
                    ))}
                  </div>

                  {/* Tenant Pool */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-300">
                    <h4 className="text-lg font-semibold text-blue-900 mb-4">
                      Unassigned Tenants Pool
                    </h4>
                    {unassignedTenants.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {unassignedTenants.map((tenant) => (
                          <motion.div
                            key={tenant.id}
                            draggable
                            onDragStart={() => handleTenantDragStart(tenant.id)}
                            onDragEnd={handleTenantDragEnd}
                            whileHover={{ scale: 1.05 }}
                            className="bg-white p-4 rounded-lg border-2 border-blue-200 cursor-move hover:border-blue-400 transition-all"
                          >
                            <div className="flex items-center space-x-2">
                              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                                <Users className="w-5 h-5 text-white" />
                              </div>
                              <div>
                              <p className="font-semibold text-gray-900 text-sm">
                                {tenant.fullName}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {tenant.contact?.email}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-blue-700 text-center py-8">
                        No unassigned tenants available. Create tenants in the
                        Tenants tab.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "tenants" && (
                <motion.div
                  key="tenants"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Tenant Management
                    </h3>
                    <button
                      onClick={handleCreateTenant}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Tenant</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {[...tenants, ...unassignedTenants].map((tenant) => (
                      <div
                        key={tenant.id}
                        className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                              <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {tenant.fullName}
                              </p>
                              <p className="text-sm text-gray-600">
                                {tenant.contact?.email}
                              </p>
                              <p className="text-sm text-gray-500">
                                {tenant.contact?.phone || 'No phone'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-sm text-gray-600">
                                {tenant.propertyId
                                  ? "Assigned"
                                  : "Unassigned"}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditTenant(tenant)}
                                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteTenant(tenant.id)}
                                className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {tenants.length === 0 && unassignedTenants.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No tenants yet</p>
                        <p className="text-sm">
                          Click &quot;Add Tenant&quot; to create your first tenant
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>

      {/* Tenant Modal */}
      {showTenantModal && (
        <SimpleTenantModal
          tenant={selectedTenant}
          userId={userId}
          onClose={handleTenantModalClose}
        />
      )}
    </div>
  );
}

