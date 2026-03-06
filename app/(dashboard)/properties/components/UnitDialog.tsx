"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Home } from "lucide-react";
import { Button } from "@/components/Button";
import type { Unit, Property, CreateUnitData, UpdateUnitData } from "@/types/firestore";

interface UnitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateUnitData | UpdateUnitData) => Promise<void>;
  unit?: Unit | null;
  properties: Property[];
  loading?: boolean;
  userId?: string;
}

export function UnitDialog({ 
  isOpen, 
  onClose, 
  onSave, 
  unit, 
  properties,
  loading = false,
  userId
}: UnitDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    propertyId: "",
    floor: "",
    rentType: "Monthly" as "Monthly" | "Quarterly" | "Yearly" | "Nightly",
    rentAmount: "",
    status: "Available" as "Available" | "Occupied" | "Under Maintenance",
    description: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const rentTypes = ["Monthly", "Quarterly", "Yearly", "Nightly"];
  const statusOptions = ["Available", "Occupied", "Under Maintenance"];

  useEffect(() => {
    if (isOpen) {
      if (unit) {
        setFormData({
          name: unit.name,
          propertyId: unit.propertyId,
          floor: unit.floor,
          rentType: unit.rentType,
          rentAmount: unit.rentAmount.toString(),
          status: unit.status,
          description: unit.description || ""
        });
      } else {
        setFormData({
          name: "",
          propertyId: "",
          floor: "",
          rentType: "Monthly",
          rentAmount: "",
          status: "Available",
          description: ""
        });
      }
      setErrors({});
    }
  }, [unit, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Unit name is required";
    }

    if (!formData.propertyId.trim()) {
      newErrors.propertyId = "Property is required";
    }

    if (!formData.floor.trim()) {
      newErrors.floor = "Floor is required";
    }

    if (!formData.rentAmount.trim()) {
      newErrors.rentAmount = "Rent amount is required";
    } else if (isNaN(Number(formData.rentAmount)) || Number(formData.rentAmount) < 0) {
      newErrors.rentAmount = "Rent amount must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const data = {
        ...formData,
        rentAmount: Number(formData.rentAmount)
      };

      await onSave(data);
      onClose();
    } catch (error) {
      console.error("Error saving unit:", error);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md lg:max-w-lg max-h-[95vh] overflow-y-auto border border-gray-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 lg:p-8 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {unit ? "Edit Unit" : "Add New Unit"}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {unit ? "Update unit information" : "Create a new unit"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={loading}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8">
              <div className="space-y-6">
                {/* Unit Name and Property */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Unit Name/Number *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.name ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="e.g., 101, A1, Studio 1"
                      disabled={loading}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700 mb-2">
                      Property *
                    </label>
                    <select
                      id="propertyId"
                      name="propertyId"
                      value={formData.propertyId}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.propertyId ? "border-red-300" : "border-gray-300"
                      }`}
                      disabled={loading}
                    >
                      <option value="">Select property</option>
                      {properties.map(property => (
                        <option key={property.id} value={property.id}>
                          {property.name} - {property.address}
                        </option>
                      ))}
                    </select>
                    {errors.propertyId && (
                      <p className="text-red-500 text-sm mt-1">{errors.propertyId}</p>
                    )}
                  </div>
                </div>

                {/* Floor and Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="floor" className="block text-sm font-medium text-gray-700 mb-2">
                      Floor *
                    </label>
                    <input
                      type="text"
                      id="floor"
                      name="floor"
                      value={formData.floor}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.floor ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="e.g., Ground, 1st, 2nd"
                      disabled={loading}
                    />
                    {errors.floor && (
                      <p className="text-red-500 text-sm mt-1">{errors.floor}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Rent Type and Amount */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="rentType" className="block text-sm font-medium text-gray-700 mb-2">
                      Rent Type
                    </label>
                    <select
                      id="rentType"
                      name="rentType"
                      value={formData.rentType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                    >
                      {rentTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="rentAmount" className="block text-sm font-medium text-gray-700 mb-2">
                      Rent Amount (₱) *
                    </label>
                    <input
                      type="number"
                      id="rentAmount"
                      name="rentAmount"
                      value={formData.rentAmount}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.rentAmount ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="Enter rent amount"
                      min="0"
                      step="0.01"
                      disabled={loading}
                    />
                    {errors.rentAmount && (
                      <p className="text-red-500 text-sm mt-1">{errors.rentAmount}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter unit description (optional)"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-8 border-t border-gray-100 mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {loading ? "Saving..." : unit ? "Update Unit" : "Create Unit"}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}