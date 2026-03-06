"use client";

import { motion } from "framer-motion";
import { Plus, Users } from "lucide-react";
import type { Tenant, Unit } from "@/types/firestore";
import { TenantCard } from "./TenantCard";
import { Button } from "@/components/Button";

interface TenantPoolProps {
  propertyId: string;
  tenants: Tenant[];
  units: Unit[];
}

export function TenantPool({ propertyId, tenants }: TenantPoolProps) {
  const handleAddTenant = () => {
    // TODO: Implement add tenant functionality
    console.log("Add tenant for property:", propertyId);
  };

  // Separate assigned and unassigned tenants
  const assignedTenants = tenants.filter(tenant => tenant.unitId);
  const unassignedTenants = tenants.filter(tenant => !tenant.unitId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Tenants</h3>
          <p className="text-gray-600">Manage tenants for this property</p>
        </div>
        <Button
          onClick={handleAddTenant}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Tenant
        </Button>
      </div>

      {/* Assigned Tenants */}
      {assignedTenants.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">
              Assigned Tenants ({assignedTenants.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedTenants.map((tenant, index) => (
                <motion.div
                  key={tenant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <TenantCard
                    tenant={tenant}
                    propertyId={propertyId}
                    isAssigned={true}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Unassigned Tenants */}
      {unassignedTenants.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">
              Available Tenants ({unassignedTenants.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unassignedTenants.map((tenant, index) => (
                <motion.div
                  key={tenant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <TenantCard
                    tenant={tenant}
                    propertyId={propertyId}
                    isAssigned={false}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {tenants.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tenants Yet</h3>
          <p className="text-gray-600 mb-6">Add tenants to start managing your property</p>
          <Button
            onClick={handleAddTenant}
            className="flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            Add Your First Tenant
          </Button>
        </motion.div>
      )}
    </div>
  );
}
