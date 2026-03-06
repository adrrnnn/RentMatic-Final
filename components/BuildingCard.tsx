"use client";

import { motion } from "framer-motion";
import { Building2, Edit, Trash2, Users, MapPin, Calendar, ExternalLink } from "lucide-react";
import { Button } from "./Button";
import type { Property } from "@/types/properties";

interface BuildingCardProps {
  building: Property;
  onEdit: (building: Property) => void;
  onDelete: (buildingId: string) => void;
  onViewDetails?: (building: Property) => void;
}

export function BuildingCard({ building, onEdit, onDelete, onViewDetails }: BuildingCardProps) {
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

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-green-100 hover:shadow-xl transition-all duration-300"
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
      <div className="mb-4">
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
        
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span className="font-medium">{Math.round(occupancyRate)}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Description */}
      {building.description && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 line-clamp-2">{building.description}</p>
        </div>
      )}

      {/* Footer */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-gray-500">
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

        {/* View Details Button */}
        {onViewDetails && (
          <Button
            onClick={() => onViewDetails(building)}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
          >
            <span>View Details</span>
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

