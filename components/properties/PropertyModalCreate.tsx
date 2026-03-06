"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, MapPin, FileText, Image, Plus } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { PropertyService } from "@/lib/firestore/properties/propertyService";
import { Button } from "@/components/Button";
import { getClientAuth } from "@/lib/firebase";
import toast from "react-hot-toast";

interface PropertyModalCreateProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PropertyModalCreate({ isOpen, onClose }: PropertyModalCreateProps) {
  const { user, initializeAuth, authLoading } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: "",
    imageUrl: "",
    generateUnits: 0
  });

  useEffect(() => {
    // Initialize authentication when modal opens
    if (isOpen) {
      initializeAuth();
    }
  }, [isOpen, initializeAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const auth = getClientAuth();
    const currentUser = auth?.currentUser;
    const userIdToUse = user?.id || currentUser?.uid;
    
    console.log("Firebase current user in modal:", currentUser ? `User: ${currentUser.uid}` : "No current user");
    
    if (!userIdToUse) return;

    console.log("Creating property for user:", userIdToUse);
    console.log("Property data:", formData);

    setLoading(true);
    try {
      const { generateUnits, name, address, description, imageUrl } = formData;
      const propertyData = {
        name,
        address,
        description,
        imageURL: imageUrl,
        type: "Apartment",
        numberOfUnits: Number(generateUnits) || 0,
      };
      const propertyId = await PropertyService.createProperty(userIdToUse, propertyData, { generateUnits });
      toast.success("Property created");
      
      // Reset form
      setFormData({
        name: "",
        address: "",
        description: "",
        imageUrl: "",
        generateUnits: 0
      });
      
      onClose();
    } catch (error) {
      console.error("Error creating property:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Error creating property: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Add New Property</h2>
                  <p className="text-sm text-gray-600">Create a new rental property</p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Property Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter property name"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter property address"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="Enter property description"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <div className="relative">
                  <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              {/* Generate Units */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Generate Units
                </label>
                <div className="relative">
                  <Plus className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={formData.generateUnits}
                    onChange={(e) => handleInputChange("generateUnits", parseInt(e.target.value) || 0)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Number of units to create"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Leave as 0 to create property without units
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Property
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
