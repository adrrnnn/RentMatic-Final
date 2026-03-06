"use client";

import { motion } from "framer-motion";
import { Plus, Building2 } from "lucide-react";
import type { Unit, Tenant } from "@/types/firestore";
import { UnitCard } from "./UnitCard";
import { Button } from "@/components/Button";

interface UnitGridProps {
  propertyId: string;
  units: Unit[];
  tenants: Tenant[];
}

export function UnitGrid({ propertyId, units, tenants }: UnitGridProps) {
  const handleAddUnit = () => {
    // TODO: Implement add unit functionality
    console.log("Add unit for property:", propertyId);
  };

  // Create a map of tenant ID to tenant data for quick lookup
  const tenantMap = new Map(tenants.map(tenant => [tenant.id, tenant]));

  if (units.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Units Yet</h3>
        <p className="text-gray-600 mb-6">Add units to start managing your property</p>
        <Button
          onClick={handleAddUnit}
          className="flex items-center gap-2 mx-auto"
        >
          <Plus className="w-4 h-4" />
          Add Your First Unit
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Units</h3>
          <p className="text-gray-600">Manage individual rental units</p>
        </div>
        <Button
          onClick={handleAddUnit}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Unit
        </Button>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {units.map((unit, index) => {
          const tenant = unit.tenantId ? tenantMap.get(unit.tenantId) : null;
          
          return (
            <motion.div
              key={unit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <UnitCard
                unit={unit}
                tenant={tenant}
                propertyId={propertyId}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}








