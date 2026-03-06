"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Users, 
  Edit, 
  Trash2,
  Plus,
  User
} from "lucide-react";
// NOTE: This legacy component uses a simplified Property shape.
// We only update Tenant reference to the new firestore types for name/email fields used below.
import type { Tenant } from "@/types/firestore";

interface MinimalPropertyCard {
  id: string;
  name: string;
  address: string;
  description?: string;
  totalUnits: number;
  occupiedCount: number;
  createdAt: string;
}
import { Button } from "./Button";

interface PropertyCardProps {
  property: MinimalPropertyCard;
  assignedTenants: Tenant[];
  isDragOver?: boolean;
  onDrop?: (e: React.DragEvent, propertyId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onEdit?: (property: MinimalPropertyCard) => void;
  onDelete?: (propertyId: string) => void;
  onRemoveTenant?: (tenantId: string) => void;
  className?: string;
}

export function PropertyCard({ 
  property, 
  assignedTenants,
  isDragOver = false,
  onDrop,
  onDragOver,
  onDragLeave,
  onEdit,
  onDelete,
  onRemoveTenant,
  className = ""
}: PropertyCardProps) {
  const [hoveredUnit, setHoveredUnit] = useState<number | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Maintenance":
        return "bg-orange-100 text-orange-800";
      case "Vacant":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { 
      style: 'currency', 
      currency: 'PHP' 
    }).format(amount);
  };

  // Create unit slots
  const unitSlots = Array.from({ length: property.totalUnits }, (_, index) => {
    const unitNumber = index + 1;
    const isOccupied = index < property.occupiedCount;
    const tenant = assignedTenants[index] || null;
    
    return {
      unitNumber,
      isOccupied,
      tenant
    };
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    onDragOver?.(e);
  };

  const handleDrop = (e: React.DragEvent, unitNumber: number) => {
    e.preventDefault();
    onDrop?.(e, property.id);
  };

  const handleRemoveTenant = (tenantId: string) => {
    onRemoveTenant?.(tenantId);
  };

  return (
    <motion.div
      onDragOver={handleDragOver}
      onDragLeave={onDragLeave}
      animate={isDragOver ? { 
        scale: 1.02,
        boxShadow: "0 0 0 4px rgba(34, 197, 94, 0.2)"
      } : {}}
      className={`
        bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-green-100
        transition-all duration-300 hover:shadow-xl hover:border-green-200
        ${isDragOver ? 'ring-4 ring-green-200 ring-opacity-50' : ''}
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{property.name}</h3>
            <div className="flex items-center space-x-1 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{property.address}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit?.(property)}
              className="p-2 hover:bg-green-50"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete?.(property.id)}
              className="p-2 hover:bg-red-50 text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Property Info */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Building2 className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm text-gray-500">Total Units</p>
            <p className="font-semibold text-gray-900">{property.totalUnits}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-sm text-gray-500">Occupancy</p>
            <p className="font-semibold text-gray-900">{property.occupiedCount}/{property.totalUnits}</p>
          </div>
        </div>
      </div>

      {/* Unit Slots */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Units</h4>
        <div className="grid grid-cols-2 gap-2">
          {unitSlots.map((slot) => (
            <motion.div
              key={slot.unitNumber}
              onDrop={(e) => handleDrop(e, slot.unitNumber)}
              onDragOver={handleDragOver}
              onMouseEnter={() => setHoveredUnit(slot.unitNumber)}
              onMouseLeave={() => setHoveredUnit(null)}
              whileHover={{ scale: 1.02 }}
              className={`
                p-3 rounded-lg border-2 border-dashed transition-all duration-200
                ${slot.isOccupied 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 bg-gray-50 hover:border-green-300 hover:bg-green-50'
                }
                ${hoveredUnit === slot.unitNumber ? 'border-green-400 bg-green-100' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                    ${slot.isOccupied 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-300 text-gray-600'
                    }
                  `}>
                    {slot.unitNumber}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Unit {slot.unitNumber}
                    </p>
                    {slot.tenant && (
                      <p className="text-xs text-gray-600 truncate">
                        {slot.tenant.fullName}
                      </p>
                    )}
                  </div>
                </div>
                
                {slot.isOccupied && slot.tenant ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 text-white" />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTenant(slot.tenant!.id)}
                      className="p-1 hover:bg-red-50 text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                    <Plus className="w-3 h-3 text-gray-600" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Description */}
      {property.description && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600 line-clamp-2">{property.description}</p>
        </div>
      )}
    </motion.div>
  );
}
