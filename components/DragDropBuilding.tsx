"use client";

import { motion } from "framer-motion";
import { Building2, Edit, Trash2, Users, MapPin, Calendar, X } from "lucide-react";
import { Button } from "./Button";
import type { Tenant } from "@/types/firestore";

interface BuildingCardData {
  id: string;
  name: string;
  address: string;
  totalUnits: number;
  occupiedCount: number;
  createdAt: string;
  imageUrl?: string;
}

interface DragDropBuildingProps {
  building: BuildingCardData;
  assignedTenants: Tenant[];
  isDragOver: boolean;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  onEdit: (building: BuildingCardData) => void;
  onDelete: (buildingId: string) => void;
  onRemoveTenant: (tenantId: string) => void;
}

export function DragDropBuilding({ 
  building, 
  assignedTenants, 
  isDragOver, 
  onDrop, 
  onDragOver, 
  onDragLeave,
  onEdit,
  onDelete,
  onRemoveTenant
}: DragDropBuildingProps) {
  const occupancyRate = building.totalUnits > 0 ? (building.occupiedCount / building.totalUnits) * 100 : 0;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Maintenance":
        return "bg-yellow-100 text-yellow-800";
      case "Inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Generate unit slots
  const unitSlots = Array.from({ length: building.totalUnits }, (_, i) => {
    const unitNumber = i + 1;
    const assignedTenant = assignedTenants[i] || null;
    return {
      unitNumber,
      tenant: assignedTenant
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ 
        y: -6, 
        scale: 1.02,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      className={`bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-lg border transition-all duration-300 ${
        isDragOver 
          ? "border-green-400 shadow-green-200 shadow-2xl ring-2 ring-green-200" 
          : "border-green-100 hover:shadow-xl hover:border-green-200"
      }`}
      onDrop={onDrop}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      onDragLeave={onDragLeave}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{building.name}</h3>
            <div className="flex items-center text-gray-500 text-sm">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="truncate max-w-48">{building.address}</span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(building)}
            className="text-gray-500 hover:text-green-600 hover:bg-green-50"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(building.id)}
            className="text-gray-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>


      {/* Occupancy Stats */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Occupancy</span>
          </div>
          <span className="text-sm font-bold text-gray-900">
            {building.occupiedCount} / {building.totalUnits}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${occupancyRate}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-2 rounded-full ${
              occupancyRate >= 90 ? "bg-red-500" :
              occupancyRate >= 70 ? "bg-yellow-500" :
              "bg-green-500"
            }`}
          />
        </div>
      </div>

      {/* Unit Slots */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Unit Assignments</h4>
        <div className="grid grid-cols-2 gap-2">
          {unitSlots.map((slot, index) => (
            <motion.div
              key={slot.unitNumber}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileHover={{ scale: 1.05, y: -2 }}
              className={`p-3 rounded-lg border-2 border-dashed transition-all duration-200 ${
                slot.tenant 
                  ? "border-green-300 bg-green-50 shadow-sm" 
                  : isDragOver 
                    ? "border-green-400 bg-green-100 shadow-md" 
                    : "border-gray-200 bg-gray-50 hover:border-green-200 hover:bg-green-25"
              }`}
            >
              {slot.tenant ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Users className="w-3 h-3 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {slot.tenant.fullName}
                      </p>
                      {/* Monthly rent omitted; not part of canonical tenant schema */}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveTenant(slot.tenant!.id)}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Unit {slot.unitNumber}</p>
                  <p className="text-xs text-gray-400">Drop tenant here</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-500 mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-1">
          <Calendar className="w-4 h-4" />
          <span>Created {new Date(building.createdAt).toLocaleDateString()}</span>
        </div>
        
        {building.imageUrl && (
          <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-gray-500" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
