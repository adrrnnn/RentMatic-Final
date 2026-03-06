"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, MapPin, Hash, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "./Button";
import type { Property, CreatePropertyData } from "@/types/properties";

interface BuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePropertyData) => void;
  editingBuilding?: Property | null;
  loading?: boolean;
}

export function BuildingModal({ isOpen, onClose, onSubmit, editingBuilding, loading = false }: BuildingModalProps) {
  const [formData, setFormData] = useState({
    buildingName: "",
    address: "",
    totalUnits: 1,
    description: "",
    imageUrl: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingBuilding) {
      setFormData({
        buildingName: editingBuilding.name,
        address: editingBuilding.address,
        totalUnits: editingBuilding.totalUnits,
        description: editingBuilding.description || "",
        imageUrl: editingBuilding.imageUrl || ""
      });
    } else {
      setFormData({
        buildingName: "",
        address: "",
        totalUnits: 1,
        description: "",
        imageUrl: ""
      });
    }
    setErrors({});
  }, [editingBuilding, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.buildingName.trim()) {
      newErrors.buildingName = "Building name is required";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (formData.totalUnits < 1) {
      newErrors.totalUnits = "Total units must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    onSubmit({
      name: formData.buildingName,
      address: formData.address,
      description: formData.description,
      imageUrl: formData.imageUrl,
    });
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-green-100 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-green-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingBuilding ? "Edit Building" : "Add New Building"}
                  </h2>
                  <p className="text-gray-600">
                    {editingBuilding ? "Update building information" : "Create a new building for your property portfolio"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Building Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Building Name *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.buildingName}
                      onChange={(e) => handleInputChange("buildingName", e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 ${
                        errors.buildingName ? "border-red-300" : "border-green-200"
                      }`}
                      placeholder="Enter building name"
                    />
                  </div>
                  {errors.buildingName && (
                    <p className="mt-1 text-sm text-red-600">{errors.buildingName}</p>
                  )}
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 ${
                        errors.address ? "border-red-300" : "border-green-200"
                      }`}
                      placeholder="Enter building address"
                    />
                  </div>
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                  )}
                </div>

                {/* Total Units */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Units *
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      min="1"
                      value={formData.totalUnits}
                      onChange={(e) => handleInputChange("totalUnits", parseInt(e.target.value) || 1)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 ${
                        errors.totalUnits ? "border-red-300" : "border-green-200"
                      }`}
                      placeholder="Number of units"
                    />
                  </div>
                  {errors.totalUnits && (
                    <p className="mt-1 text-sm text-red-600">{errors.totalUnits}</p>
                  )}
                </div>


                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      rows={3}
                      className="w-full pl-10 pr-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 resize-none"
                      placeholder="Enter building description (optional)"
                    />
                  </div>
                </div>

                {/* Image URL */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL
                  </label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="Enter image URL (optional)"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-green-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {editingBuilding ? "Update Building" : "Create Building"}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

