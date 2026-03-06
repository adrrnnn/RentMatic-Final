"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Home, Building2, Users, Edit, Trash2, UserMinus } from "lucide-react";
import { Button } from "@/components/Button";
import type { Unit, Property, Tenant } from "@/types/firestore";

interface UnitsTabProps {
  units: Unit[];
  properties: Property[];
  tenants: Tenant[];
  onEdit: (unit: Unit) => void;
  onDelete: (unit: Unit) => void;
  onAssignTenant: (tenantId: string, propertyId: string, unitId: string) => void;
  onUnassignTenant: (tenantId: string, unitId: string) => void;
  loading?: boolean;
}

export function UnitsTab({ 
  units, 
  properties, 
  tenants, 
  onEdit, 
  onDelete, 
  onAssignTenant,
  onUnassignTenant,
  loading = false 
}: UnitsTabProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState<Unit | null>(null);
  const [draggedTenant, setDraggedTenant] = useState<Tenant | null>(null);
  const [hoveredUnit, setHoveredUnit] = useState<string | null>(null);

  // Group units by property
  const unitsByProperty = useMemo(() => {
    const grouped: { [key: string]: { property: Property; units: Unit[] } } = {};
    
    units.forEach(unit => {
      const property = properties.find(p => p.id === unit.propertyId);
      if (property) {
        if (!grouped[property.id]) {
          grouped[property.id] = { property, units: [] };
        }
        grouped[property.id].units.push(unit);
      }
    });
    
    return grouped;
  }, [units, properties]);

  // Get unassigned tenants
  const unassignedTenants = useMemo(() => {
    return tenants.filter(tenant => !tenant.unitId);
  }, [tenants]);

  const handleDelete = (unit: Unit) => {
    setShowDeleteDialog(unit);
  };

  const confirmDelete = () => {
    if (showDeleteDialog) {
      onDelete(showDeleteDialog);
      setShowDeleteDialog(null);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, tenant: Tenant) => {
    setDraggedTenant(tenant);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedTenant(null);
    setHoveredUnit(null);
  };

  const handleDragOver = (e: React.DragEvent, unitId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setHoveredUnit(unitId);
  };

  const handleDragLeave = () => {
    setHoveredUnit(null);
  };

  const handleDrop = (e: React.DragEvent, unit: Unit) => {
    e.preventDefault();
    if (draggedTenant && unit.status === "Available") {
      onAssignTenant(draggedTenant.id, unit.propertyId, unit.id);
    }
    setHoveredUnit(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800 border-green-200";
      case "Occupied":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Under Maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRentTypeColor = (rentType: string) => {
    switch (rentType) {
      case "Monthly":
        return "bg-purple-100 text-purple-800";
      case "Quarterly":
        return "bg-indigo-100 text-indigo-800";
      case "Yearly":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="bg-white rounded-xl border border-gray-200 p-4 h-32"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (units.length === 0 && !loading) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Home className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Units Found</h3>
        <p className="text-gray-500 mb-6">Start by adding units to your properties.</p>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Home className="w-4 h-4 mr-2" /> Add Your First Unit
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* Unassigned Tenants */}
        {unassignedTenants.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-gray-600" />
              Unassigned Tenants ({unassignedTenants.length})
            </h3>
            <div className="flex flex-wrap gap-3">
              {unassignedTenants.map((tenant) => (
                <motion.div
                  key={tenant.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent<HTMLDivElement>, tenant)}
                  onDragEnd={handleDragEnd}
                  className="bg-white border border-gray-200 rounded-lg px-4 py-2 cursor-move hover:shadow-md transition-shadow"
                  whileHover={{ scale: 1.02 }}
                  whileDrag={{ scale: 1.05, rotate: 5 }}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {tenant.fullName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tenant.fullName}</p>
                      <p className="text-xs text-gray-500">{tenant.contact.email}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Units by Property */}
        {Object.entries(unitsByProperty).map(([propertyId, { property, units: propertyUnits }]) => (
          <div key={propertyId} className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
                <p className="text-sm text-gray-600">{property.address}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {propertyUnits.map((unit) => {
                const assignedTenant = unit.tenantId ? tenants.find(t => t.id === unit.tenantId) : null;
                const isHovered = hoveredUnit === unit.id;
                const canDrop = draggedTenant && unit.status === "Available" && !unit.tenantId;

                return (
                  <motion.div
                    key={unit.id}
                    className={`bg-white rounded-xl border-2 p-4 transition-all ${
                      isHovered && canDrop
                        ? "border-green-400 bg-green-50 shadow-lg"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onDragOver={(e) => handleDragOver(e, unit.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, unit)}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                          <Home className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{unit.name}</h4>
                          <p className="text-sm text-gray-600">Floor {unit.floor}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(unit.status)}`}>
                        {unit.status}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Rent:</span>
                        <span className="font-semibold text-gray-900">₱{unit.rentAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Type:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getRentTypeColor(unit.rentType)}`}>
                          {unit.rentType}
                        </span>
                      </div>
                    </div>

                    {/* Assigned Tenant */}
                    {assignedTenant ? (
                      <div className="bg-blue-50 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-medium">
                                {assignedTenant.fullName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{assignedTenant.fullName}</p>
                              <p className="text-xs text-gray-600">{assignedTenant.contact.email}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onUnassignTenant(assignedTenant.id, unit.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <UserMinus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-2 mb-4">
                        <p className="text-sm text-gray-500">No tenant assigned</p>
                        {canDrop && (
                          <p className="text-xs text-green-600 mt-1">Drop tenant here to assign</p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(unit)}
                        className="flex-1 text-yellow-600 hover:bg-yellow-50"
                      >
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(unit)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full mx-4"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Delete Unit</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete unit &quot;{showDeleteDialog.name}&quot;? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteDialog(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmDelete}
                  className="flex-1"
                >
                  Delete
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
