"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, MapPin, Users, Edit, Trash2, Eye, Camera, Search } from "lucide-react";
import { Button } from "@/components/Button";
import type { Property, Unit } from "@/types/firestore";

interface PropertiesTabProps {
  properties: Property[];
  units: Unit[];
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
  onView: (property: Property) => void;
  onCreate: () => void;
  loading?: boolean;
}

export function PropertiesTab({ 
  properties, 
  units,
  onEdit, 
  onDelete, 
  onView, 
  onCreate, 
  loading = false 
}: PropertiesTabProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState<Property | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleDelete = (property: Property) => {
    setShowDeleteDialog(property);
  };

  // Calculate occupancy rate for a property
  const getOccupancyRate = (property: Property) => {
    // Get units for this specific property
    const propertyUnits = units.filter(unit => unit.propertyId === property.id);
    const totalUnits = propertyUnits.length;
    const occupiedUnits = propertyUnits.filter(unit => unit.status === "Occupied").length;
    
    if (totalUnits === 0) return 0;
    return Math.round((occupiedUnits / totalUnits) * 100);
  };

  // Get occupancy bar color based on rate
  const getOccupancyColor = (rate: number) => {
    if (rate >= 90) return "bg-red-500"; // High occupancy - red
    if (rate >= 70) return "bg-yellow-500"; // Medium-high occupancy - yellow
    if (rate >= 50) return "bg-blue-500"; // Medium occupancy - blue
    return "bg-green-500"; // Low occupancy - green
  };

  // Get occupancy status text
  const getOccupancyStatus = (rate: number) => {
    if (rate >= 90) return "Full";
    if (rate >= 70) return "High";
    if (rate >= 50) return "Medium";
    return "Low";
  };

  const confirmDelete = () => {
    if (showDeleteDialog) {
      onDelete(showDeleteDialog);
      setShowDeleteDialog(null);
    }
  };

  // Filter properties based on search query
  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (property.manager && property.manager.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded mb-4 w-2/3"></div>
            <div className="flex justify-between items-center">
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (properties.length === 0 && !loading) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Properties Found</h3>
        <p className="text-gray-500 mb-6">Start by adding your first property to get started.</p>
        <Button onClick={onCreate} className="bg-green-600 hover:bg-green-700 text-white">
          <Building2 className="w-4 h-4 mr-2" /> Add Your First Property
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search properties by name, address, type, or manager..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property, index) => (
          <motion.div
            key={property.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{property.name}</h4>
                <p className="text-sm text-gray-600">{property.type}</p>
              </div>
            </div>

            {/* Property Info */}
            <div className="bg-green-50 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">{property.address}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">{property.numberOfUnits} units</span>
              </div>
              {property.manager && (
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-green-700">Manager: {property.manager}</span>
                </div>
              )}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Building2 className="w-4 h-4 mr-2" />
                {property.numberOfUnits} total units
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Users className="w-4 h-4 mr-2" />
                0 occupied
              </div>
            </div>

            {/* Occupancy Rate Bar */}
            {(() => {
              const occupancyRate = getOccupancyRate(property);
              const occupancyColor = getOccupancyColor(occupancyRate);
              const occupancyStatus = getOccupancyStatus(occupancyRate);
              
              return (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Occupancy</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {occupancyRate.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                    <motion.div
                      className={`h-2 rounded-full ${occupancyColor}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${occupancyRate}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${
                      occupancyRate >= 90 ? "text-red-600" :
                      occupancyRate >= 70 ? "text-yellow-600" :
                      occupancyRate >= 50 ? "text-blue-600" :
                      "text-green-600"
                    }`}>
                      {occupancyStatus}
                    </span>
                    <span className="text-xs text-gray-500">
                      {(() => {
                        const propertyUnits = units.filter(unit => unit.propertyId === property.id);
                        const occupiedUnits = propertyUnits.filter(unit => unit.status === "Occupied").length;
                        return `${occupiedUnits} / ${propertyUnits.length} occupied`;
                      })()}
                    </span>
                  </div>
                </div>
              );
            })()}

            {property.description && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-700">{property.description}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(property)}
                className="flex-1 text-blue-600 hover:bg-blue-50"
              >
                <Eye className="w-4 h-4 mr-1" /> View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(property)}
                className="text-yellow-600 hover:bg-yellow-50"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(property)}
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full mx-4"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Delete Property</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete &quot;{showDeleteDialog.name}&quot;? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteDialog(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmDelete}
                  className="flex-1"
                >
                  Delete
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
