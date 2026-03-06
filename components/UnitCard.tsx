"use client";

import { motion } from "framer-motion";
import { Home, User, X } from "lucide-react";
import type { Unit } from "@/types/firestore";

interface UnitCardProps {
  unit: Unit;
  tenant?: { id: string; fullName: string; monthlyRent?: number } | null;
  onRemoveTenant?: (unitId: string) => void;
  onDrop?: (unitId: string, e: React.DragEvent) => void;
  isDragOver?: boolean;
}

export function UnitCard({ unit, tenant, onRemoveTenant, onDrop, isDragOver }: UnitCardProps) {
  const isOccupied = unit.status === "Occupied";

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDrop) {
      onDrop(unit.id, e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)" }}
      transition={{ duration: 0.2 }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
        isOccupied
          ? "bg-gradient-to-br from-green-50 to-green-100 border-green-300"
          : isDragOver
            ? "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400 border-dashed scale-105"
            : "bg-white border-gray-200 hover:border-green-400"
      }`}
    >
      {/* Unit Number Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isOccupied
                ? "bg-green-500 text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            <Home className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Unit</p>
            <p className="text-lg font-bold text-gray-900">#{unit.name}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isOccupied
              ? "bg-green-500 text-white"
              : "bg-gray-300 text-gray-700"
          }`}
        >
          {isOccupied ? "Occupied" : "Vacant"}
        </div>
      </div>

      {/* Tenant Info */}
      {isOccupied && tenant ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-3 bg-white rounded-lg border border-green-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {tenant.fullName}
                </p>
                {tenant.monthlyRent && (
                  <p className="text-xs text-gray-600">
                    ₱{tenant.monthlyRent.toLocaleString()}/mo
                  </p>
                )}
              </div>
            </div>

            {onRemoveTenant && (
              <button
                onClick={() => onRemoveTenant(unit.id)}
                className="p-1 rounded-full hover:bg-red-100 text-red-500 transition-colors"
                title="Remove tenant"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="mt-3 p-3 border-2 border-dashed border-gray-300 rounded-lg text-center">
          <p className="text-xs text-gray-500">
            Drag a tenant here to assign
          </p>
        </div>
      )}

      {/* Drag Over Indicator */}
      {isDragOver && !isOccupied && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-xl pointer-events-none flex items-center justify-center"
        >
          <div className="text-blue-600 font-semibold text-sm">
            Drop to assign
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

