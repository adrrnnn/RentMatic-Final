"use client";

import { motion } from "framer-motion";
import type { Unit } from "@/types/firestore";
import { UnitCard } from "@/components/UnitCard";
import { useUserStore } from "@/store/useUserStore";
import { UnitService } from "@/lib/firestore/properties/unitService";

interface DragDropUnitGridProps {
  units: Unit[];
  onRemoveTenant?: (unitId: string) => void;
  propertyId: string;
  dragOverUnitId: string | null;
}

export function DragDropUnitGrid({
  units,
  onRemoveTenant,
  propertyId,
  dragOverUnitId,
}: DragDropUnitGridProps) {
  const { user } = useUserStore();

  const assign = async (unitId: string, e?: React.DragEvent) => {
    if (!user?.id) return;
    const tenantId = e?.dataTransfer?.getData('application/tenant-id');
    if (!tenantId) return;
    try {
      await UnitService.assignTenantToUnit(user.id, propertyId, unitId, tenantId);
      const { default: toast } = await import('react-hot-toast');
      toast.success('Tenant assigned');
    } catch (err) {
      console.error(err);
      const { default: toast } = await import('react-hot-toast');
      toast.error('Failed to assign tenant');
    }
  };

  const unassign = async (unitId: string) => {
    if (!user?.id) return;
    try {
      await UnitService.unassignTenantFromUnit(user.id, propertyId, unitId);
      const { default: toast } = await import('react-hot-toast');
      toast.success('Tenant unassigned');
    } catch (err) {
      console.error(err);
      const { default: toast } = await import('react-hot-toast');
      toast.error('Failed to unassign tenant');
    }
  };
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          Unit Management
        </h3>
        <p className="text-sm text-gray-600">
          Drag tenants from the pool below to assign them to units
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {units.map((unit) => (
          <UnitCard
            key={unit.id}
            unit={unit}
            onRemoveTenant={onRemoveTenant || unassign}
            onDrop={(id, e) => assign(id, e)}
            isDragOver={dragOverUnitId === unit.id}
          />
        ))}
      </div>
    </div>
  );
}

