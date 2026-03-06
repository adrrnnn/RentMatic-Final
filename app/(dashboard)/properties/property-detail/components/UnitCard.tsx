"use client";

import { motion } from "framer-motion";
import { Home, Edit, Trash2, User, DollarSign, Eye, Calendar } from "lucide-react";
import { Button } from "@/components/Button";
import type { Unit, Tenant } from "@/types/firestore";

interface UnitCardProps {
  unit: Unit;
  assignedTenant?: Tenant | null;
  onEdit: (unit: Unit) => void;
  onDelete: (unit: Unit) => void;
  onView?: (unit: Unit) => void;
  onAssignTenant?: (unit: Unit) => void;
  onUnassignTenant?: (unit: Unit) => void;
  onDropTenant?: (tenantId: string, unitId: string) => void;
}

export function UnitCard({
  unit,
  assignedTenant,
  onEdit,
  onDelete,
  onView,
  onAssignTenant,
  onUnassignTenant,
  onDropTenant
}: UnitCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800 border-green-200";
      case "Occupied":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Under Maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Available":
        return "🟢";
      case "Occupied":
        return "🔵";
      case "Under Maintenance":
        return "🟡";
      default:
        return "⚪";
    }
  };

  const formatRentAmount = (amount: number, type: string) => {
    const formatted = amount.toLocaleString();
    switch (type) {
      case "Monthly":
        return `₱${formatted}/month`;
      case "Quarterly":
        return `₱${formatted}/quarter`;
      case "Yearly":
        return `₱${formatted}/year`;
      case "Nightly":
        return `₱${formatted}/night`;
      default:
        return `₱${formatted}`;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (unit.status === "Available") {
      e.currentTarget.classList.add("ring-2", "ring-green-400", "ring-opacity-50", "bg-green-50");
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("ring-2", "ring-green-400", "ring-opacity-50", "bg-green-50");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("ring-2", "ring-green-400", "ring-opacity-50", "bg-green-50");
    
    if (unit.status === "Available" && onDropTenant) {
      const tenantId = e.dataTransfer.getData("text/plain");
      if (tenantId) {
        onDropTenant(tenantId, unit.id);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => onView?.(unit)}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
    >
      <div className="flex items-center p-6">
        {/* Left Side - Profile Image */}
        <div className="w-20 h-20 flex-shrink-0 mr-6">
          {unit.imageURL ? (
            <img 
              src={unit.imageURL} 
              alt={`${unit.name} unit`}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center">
              <Home className="w-8 h-8 text-gray-300" />
            </div>
          )}
        </div>

        {/* Center - Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-gray-900 text-xl mb-1">{unit.name}</h4>
              <p className="text-sm text-gray-600">Floor {unit.floor}</p>
            </div>
            
            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(unit.status)}`}>
              {getStatusIcon(unit.status)} {unit.status}
            </span>
          </div>

          {/* Rent Information */}
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-lg font-bold text-gray-900">
                {formatRentAmount(unit.rentAmount, unit.rentType)}
              </span>
            </div>
            {unit.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{unit.description}</p>
            )}
          </div>

          {/* Tenant Assignment */}
          {assignedTenant ? (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">{assignedTenant.fullName}</p>
                  <p className="text-xs text-blue-700">{assignedTenant.contact?.email}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Available for assignment</span>
              </div>
            </div>
          )}

        </div>

        {/* Right Side - Actions */}
        <div className="flex flex-col gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
          {unit.status === 'Available' ? (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onAssignTenant?.(unit);
              }}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <User className="w-4 h-4 mr-1" />
              Assign
            </Button>
          ) : (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onAssignTenant?.(unit);
              }}
              variant="outline"
              size="sm"
              className="text-green-600 hover:bg-green-50"
            >
              <User className="w-4 h-4 mr-1" />
              Reassign
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(unit);
            }}
            className="text-yellow-600 hover:bg-yellow-50"
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              // Get current tab from URL or default to 'overview'
              const urlParams = new URLSearchParams(window.location.search);
              const currentTab = urlParams.get('tab') || 'overview';
              window.location.href = `/properties/property-detail/billing?propertyId=${unit.propertyId}&unitId=${unit.id}&tab=${currentTab}`;
            }}
            className="text-blue-600 hover:bg-blue-50"
          >
            <Calendar className="w-4 h-4 mr-1" />
            Billing
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(unit);
            }}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
