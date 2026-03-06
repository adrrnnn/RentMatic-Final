"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Users, Edit, Trash2, Eye, Plus, MapPin } from "lucide-react";
import { Button } from "@/components/Button";
import type { Property } from "@/types/firestore";

interface PropertyGridProps {
  properties: Property[];
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
  onView: (property: Property) => void;
  onAddUnit?: (property: Property) => void;
  loading?: boolean;
}

export function PropertyGrid({ 
  properties, 
  onEdit, 
  onDelete, 
  onView, 
  onAddUnit,
  loading = false 
}: PropertyGridProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState<Property | null>(null);

  const handleDelete = (property: Property) => {
    setShowDeleteDialog(property);
  };

  const confirmDelete = () => {
    if (showDeleteDialog) {
      onDelete(showDeleteDialog);
      setShowDeleteDialog(null);
    }
  };

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

  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Properties Found</h3>
        <p className="text-gray-500">Get started by adding your first property.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property, index) => {

          return (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Property Image */}
              {property.imageURL && (
                <div className="h-48 w-full overflow-hidden">
                  <img
                    src={property.imageURL}
                    alt={property.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Property Content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium border border-green-200">
                        {property.type}
                      </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">{property.name}</h3>
                
                {/* Address */}
                <div className="flex items-start mb-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-gray-600 text-sm line-clamp-2">{property.address}</p>
                </div>

                {/* Description */}
                {property.description && (
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{property.description}</p>
                )}

                
                {/* Stats */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-1" />
                    {property.numberOfUnits} units
                  </div>
                  {property.manager && (
                    <div className="text-sm text-gray-500">
                      Manager: {property.manager}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(property)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(property)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(property)}
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Add Unit Button */}
                {onAddUnit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAddUnit(property)}
                    className="w-full mt-3 border-green-200 text-green-600 hover:bg-green-50"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Unit
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Property</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete &quot;{showDeleteDialog.name}&quot;? This action cannot be undone.
              All units and tenant assignments will be removed.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}