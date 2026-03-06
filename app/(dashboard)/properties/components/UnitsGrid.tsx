"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, User, Edit, Trash2, UserPlus, UserMinus } from "lucide-react";
import { Button } from "@/components/Button";
import type { Unit, Tenant } from "@/types/firestore";

interface UnitsGridProps {
  units: Unit[];
  tenants: Tenant[];
  unassignedTenants: Tenant[];
  onEdit: (unit: Unit) => void;
  onDelete: (unit: Unit) => void;
  onAssignTenant: (tenantId: string, unitId: string) => void;
  onUnassignTenant: (unitId: string) => void;
  loading?: boolean;
}

export function UnitsGrid({ 
  units, 
  tenants, 
  unassignedTenants,
  onEdit, 
  onDelete, 
  onAssignTenant,
  onUnassignTenant,
  loading = false 
}: UnitsGridProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState<Unit | null>(null);
  const [draggedTenant, setDraggedTenant] = useState<Tenant | null>(null);
  const [dragOverUnit, setDragOverUnit] = useState<string | null>(null);

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
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tenant.id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, unitId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverUnit(unitId);
  };

  const handleDragLeave = () => {
    setDragOverUnit(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, unitId: string) => {
    e.preventDefault();
    const tenantId = e.dataTransfer.getData('text/plain');
    
    if (tenantId && draggedTenant) {
      onAssignTenant(tenantId, unitId);
    }
    
    setDraggedTenant(null);
    setDragOverUnit(null);
  };

  const getTenantForUnit = (unitId: string) => {
    return tenants.find(tenant => tenant.unitId === unitId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Occupied': return 'bg-green-100 text-green-800 border-green-200';
      case 'Available': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Under Maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded mb-4 w-2/3"></div>
            <div className="flex justify-between items-center">
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (units.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Units Found</h3>
        <p className="text-gray-500">Get started by adding your first unit to this property.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {units.map((unit, index) => {
          const assignedTenant = getTenantForUnit(unit.id);
          const isDragOver = dragOverUnit === unit.id;
          const canAcceptDrop = unit.status === 'Available' && draggedTenant;

          return (
            <motion.div
              key={unit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-2xl shadow-lg border-2 transition-all duration-200 ${
                isDragOver && canAcceptDrop
                  ? 'border-green-400 bg-green-50'
                  : isDragOver
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-100 hover:shadow-xl'
              }`}
              onDragOver={(e) => handleDragOver(e, unit.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, unit.id)}
            >
              <div className="p-6">
                {/* Unit Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(unit.status)}`}>
                    {unit.status}
                  </span>
                </div>

                {/* Unit Info */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{unit.name}</h3>
                <p className="text-gray-600 text-sm mb-4">₱{unit.rentAmount.toLocaleString()}/{unit.rentType.toLowerCase()}</p>

                {/* Tenant Info */}
                {assignedTenant ? (
                  <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {assignedTenant.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{assignedTenant.fullName}</p>
                        <p className="text-xs text-gray-600">{assignedTenant.contact.phone}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center text-gray-500">
                      <User className="w-4 h-4 mr-2" />
                      <span className="text-sm">No tenant assigned</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(unit)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  
                  {assignedTenant ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUnassignTenant(unit.id)}
                      className="flex-1 text-orange-600 hover:text-orange-700 hover:border-orange-300"
                    >
                      <UserMinus className="w-4 h-4 mr-1" />
                      Unassign
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAssignTenant('', unit.id)} // This will be handled by drag and drop
                      className="flex-1 text-green-600 hover:text-green-700 hover:border-green-300"
                      disabled
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Assign
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(unit)}
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Drag and Drop Hint */}
                {unit.status === 'Available' && !assignedTenant && (
                  <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-600 text-center">
                      Drop a tenant here to assign
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Unassigned Tenants Sidebar */}
      {unassignedTenants.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Unassigned Tenants</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {unassignedTenants.map((tenant) => (
              <div
                key={tenant.id}
                draggable
                onDragStart={(e) => handleDragStart(e, tenant)}
                className="bg-white rounded-lg border border-gray-200 p-4 cursor-move hover:shadow-md transition-shadow hover:scale-105 active:scale-95"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {tenant.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{tenant.fullName}</p>
                    <p className="text-xs text-gray-600">{tenant.contact.phone}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Drag to assign to a unit</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Unit</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete &quot;{showDeleteDialog.name}&quot;? This action cannot be undone.
              {showDeleteDialog.status === 'Occupied' && ' The assigned tenant will be unassigned.'}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
