"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Users, DollarSign, Eye, Edit, Trash2, MapPin, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Property } from "@/types/properties";
import { Button } from "@/components/Button";
// Using existing components instead of ShadCN UI

interface PropertyCardProps {
  property: Property;
  onView?: (propertyId: string) => void;
  onEdit?: (propertyId: string) => void;
  onDelete?: (propertyId: string) => Promise<void> | void;
}

export function PropertyCard({ property, onView, onEdit, onDelete }: PropertyCardProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  console.log("PropertyCard received property:", property);
  
  const occupancyRate = property.totalUnits > 0 
    ? Math.round((property.occupiedCount / property.totalUnits) * 100) 
    : 0;
  
  // Ensure occupancyRate is a valid number
  const validOccupancyRate = isNaN(occupancyRate) ? 0 : occupancyRate;

  const handleView = () => {
    if (onView) {
      onView(property.id);
      return;
    }
    router.push(`/properties/property-detail?id=${property.id}`);
  };

  const handleEdit = () => {
    if (onEdit) onEdit(property.id);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    await onDelete(property.id);
    setShowDeleteDialog(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden"
      >
        {/* Property Image */}
        <div className="relative w-full h-48 overflow-hidden">
          {property.imageUrl && !imageError ? (
            <Image
              src={property.imageUrl}
              alt={property.name}
              fill
              className="object-cover transition-transform duration-300 hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
              <Building2 className="w-16 h-16 text-green-600" />
            </div>
          )}
          
          {/* Occupancy Badge */}
          <div className="absolute top-3 right-3">
            <span 
              className={`px-2 py-1 rounded-full text-xs font-medium border ${
                validOccupancyRate >= 80 
                  ? 'bg-green-100 text-green-800 border-green-200' 
                  : validOccupancyRate >= 50 
                  ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                  : 'bg-red-100 text-red-800 border-red-200'
              }`}
            >
              {validOccupancyRate}% Occupied
            </span>
          </div>
        </div>

        {/* Property Info */}
        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-1">
              {property.name}
            </h3>
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="text-sm line-clamp-1">{property.address}</span>
            </div>
            {property.description && (
              <p className="text-gray-600 text-sm line-clamp-2">
                {property.description}
              </p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Units</p>
                <p className="font-semibold text-gray-900">
                  {property.occupiedCount}/{property.totalUnits}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Monthly Income</p>
                <p className="font-semibold text-gray-900">
                  ₱{property.monthlyIncomeEstimate.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Occupancy Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Occupancy Rate</span>
              <span className="font-medium text-gray-900">{validOccupancyRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  validOccupancyRate >= 80 
                    ? 'bg-gradient-to-r from-green-500 to-green-600' 
                    : validOccupancyRate >= 50 
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                    : 'bg-gradient-to-r from-red-500 to-red-600'
                }`}
                style={{ width: `${validOccupancyRate}%` }}
              />
            </div>
          </div>

          {/* Created Date */}
          <div className="flex items-center text-gray-500 text-xs">
            <Calendar className="w-3 h-3 mr-1" />
            <span>Created {formatDate(property.createdAt)}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleView}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Eye className="w-4 h-4" />
              View Details
            </Button>
            
            <Button
              variant="outline"
              onClick={handleEdit}
              className="flex items-center justify-center"
            >
              <Edit className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Property</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete &quot;{property.name}&quot;? This action cannot be undone.
              All units and tenant assignments will be removed.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
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
