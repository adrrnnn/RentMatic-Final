"use client";

import { useState } from "react";
import { DraggableTenantAvatar } from "./DraggableTenantAvatar";
import type { Tenant } from "@/types/properties";

interface DragDropTenantPoolProps {
  tenants: Tenant[];
  onDragStart: (tenantId: string) => void;
  onDragEnd: () => void;
}

export function DragDropTenantPool({
  tenants,
  onDragStart,
  onDragEnd,
}: DragDropTenantPoolProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleDragStart = (tenantId: string) => {
    setDraggingId(tenantId);
    onDragStart(tenantId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    onDragEnd();
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-6 border-2 border-green-200 shadow-lg mt-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xl font-bold text-gray-900">
          Available Tenants
        </h4>
        <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full border border-green-200">
          {tenants.length} tenant{tenants.length !== 1 ? 's' : ''}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Drag a tenant card and drop it on a vacant unit to assign
      </p>
      {tenants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenants.map((tenant) => (
            <DraggableTenantAvatar
              key={tenant.id}
              tenant={tenant}
              onDragStart={() => handleDragStart(tenant.id)}
              onDragEnd={handleDragEnd}
              isDragging={draggingId === tenant.id}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white/50 rounded-xl border-2 border-dashed border-green-200">
          <p className="text-gray-500 mb-2">No unassigned tenants yet</p>
          <p className="text-sm text-gray-400">
            Create tenants in the Tenants tab first
          </p>
        </div>
      )}
    </div>
  );
}

