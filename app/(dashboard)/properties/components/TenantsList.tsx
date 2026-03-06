"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Mail, Phone, Edit, Trash2, UserMinus } from "lucide-react";
import { Button } from "@/components/Button";
import type { Tenant } from "@/types/firestore";

interface TenantsListProps {
  tenants: Tenant[];
  onEdit: (tenant: Tenant) => void;
  onDelete: (tenant: Tenant) => void;
  onUnassign?: (tenant: Tenant) => void;
  loading?: boolean;
}

export function TenantsList({ 
  tenants, 
  onEdit, 
  onDelete, 
  onUnassign,
  loading = false 
}: TenantsListProps) {
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

  const getStatusColor = (tenant: Tenant) => {
    if (tenant.unitId) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusText = (tenant: Tenant) => {
    return tenant.unitId ? 'Assigned' : 'Unassigned';
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Tenants Assigned</h3>
        <p className="text-gray-500">No tenants are currently assigned to this property.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {tenants.map((tenant, index) => (
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
                    <div className="flex items-center">
                      <Phone className="w-3 h-3 mr-1" />
                      {tenant.contact.phone}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Actions */}
              <div className="flex items-center space-x-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(tenant)}`}>
                  {getStatusText(tenant)}
                </span>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(tenant)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  {onUnassign && tenant.unitId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUnassign(tenant)}
                      className="text-orange-600 hover:text-orange-700 hover:border-orange-300"
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  )}
                  
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

          </motion.div>
        ))}
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
