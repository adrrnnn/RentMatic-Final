"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Mail, Phone, MapPin, Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/Button";
import type { Tenant, Property } from "@/types/firestore";

interface TenantTableProps {
  tenants: Tenant[];
  properties: Property[];
  onEdit: (tenant: Tenant) => void;
  onDelete: (tenant: Tenant) => void;
  onAdd: () => void;
  loading?: boolean;
  filterByProperty?: string;
  onFilterChange?: (propertyId: string) => void;
}

export function TenantTable({ 
  tenants, 
  properties, 
  onEdit, 
  onDelete, 
  onAdd, 
  loading = false,
  filterByProperty,
  onFilterChange
}: TenantTableProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState<Tenant | null>(null);

  const handleDelete = (tenant: Tenant) => {
    setShowDeleteDialog(tenant);
  };

  const confirmDelete = () => {
    if (showDeleteDialog) {
      onDelete(showDeleteDialog);
      setShowDeleteDialog(null);
    }
  };

  const getPropertyName = (propertyId: string | null | undefined) => {
    if (!propertyId) return "Unassigned";
    const property = properties.find(p => p.id === propertyId);
    return property?.name || "Unknown Property";
  };

  const getRentStatus = (tenant: Tenant) => {
    // Simple rent status logic - you can enhance this
    if (!tenant.leaseStartDate) return "No Lease";
    if (!tenant.leaseEndDate) return "Active";

    const endDate = new Date(tenant.leaseEndDate);
    const now = new Date();
    
    if (endDate < now) return "Expired";
    return "Active";
  };

  const getRentStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800 border-green-200";
      case "Expired": return "bg-red-100 text-red-800 border-red-200";
      case "No Lease": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-48"></div>
                </div>
              </div>
              <div className="flex space-x-2">
                <div className="h-8 bg-gray-200 rounded w-16"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Tenants Found</h3>
        <p className="text-gray-500 mb-6">
          {filterByProperty ? "No tenants assigned to this property." : "Get started by adding your first tenant."}
        </p>
        <Button onClick={onAdd} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Tenant
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Filter and Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Property:</label>
          <select
            value={filterByProperty || ""}
            onChange={(e) => onFilterChange?.(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Properties</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={onAdd} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Tenant
        </Button>
      </div>

      {/* Tenants List */}
      <div className="space-y-4">
        {tenants.map((tenant, index) => {
          const rentStatus = getRentStatus(tenant);
          const propertyName = getPropertyName(tenant.propertyId);

          return (
            <motion.div
              key={tenant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-medium">
                    {tenant.fullName.charAt(0).toUpperCase()}
                  </div>

                  {/* Tenant Info */}
                  <div className="space-y-1">
                    <h3 className="font-medium text-gray-900">{tenant.fullName}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        {tenant.contact.email}
                      </div>
                      {tenant.contact.phone && (
                        <div className="flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {tenant.contact.phone}
                        </div>
                      )}
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {propertyName}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status and Actions */}
                <div className="flex items-center space-x-4">
                  <span 
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getRentStatusColor(rentStatus)}`}
                  >
                    {rentStatus}
                  </span>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(tenant)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(tenant)}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              {(tenant.leaseStartDate || tenant.leaseEndDate || tenant.securityDeposit) && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    {tenant.leaseStartDate && (
                      <div>
                        <span className="font-medium">Lease Start:</span> {new Date(tenant.leaseStartDate).toLocaleDateString()}
                      </div>
                    )}
                    {tenant.leaseEndDate && (
                      <div>
                        <span className="font-medium">Lease End:</span> {new Date(tenant.leaseEndDate).toLocaleDateString()}
                      </div>
                    )}
                    {tenant.securityDeposit && (
                      <div>
                        <span className="font-medium">Security Deposit:</span> ₱{tenant.securityDeposit.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Tenant</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete &quot;{showDeleteDialog.fullName}&quot;? This action cannot be undone.
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
