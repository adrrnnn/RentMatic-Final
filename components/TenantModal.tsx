"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Mail, Phone, DollarSign, FileText, Building2 } from "lucide-react";
import { Button } from "./Button";
import type { Tenant, CreateTenantData, Property } from "@/types/properties";

interface TenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTenantData) => void;
  editingTenant?: Tenant | null;
  loading?: boolean;
  properties: Property[];
}

export function TenantModal({ isOpen, onClose, onSubmit, editingTenant, loading = false, properties }: TenantModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    monthlyRent: 0,
    assignedPropertyId: "",
    assignedUnitId: "",
    notes: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingTenant) {
      setFormData({
        name: editingTenant.name,
        email: editingTenant.email,
        phone: editingTenant.phone || "",
        monthlyRent: editingTenant.monthlyRent || 0,
        assignedPropertyId: editingTenant.assignedPropertyId || "",
        assignedUnitId: editingTenant.assignedUnitId || "",
        notes: editingTenant.notes || ""
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        monthlyRent: 0,
        assignedPropertyId: "",
        assignedUnitId: "",
        notes: ""
      });
    }
    setErrors({});
  }, [editingTenant, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (formData.monthlyRent <= 0) {
      newErrors.monthlyRent = "Monthly rent must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const submitData = {
      ...formData,
      assignedPropertyId: formData.assignedPropertyId || null,
      assignedUnitId: formData.assignedUnitId || null
    };

    onSubmit(submitData);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const selectedProperty = properties.find(p => p.id === formData.assignedPropertyId);
  const availableUnits = selectedProperty ? Array.from({ length: selectedProperty.totalUnits }, (_, i) => `Unit ${i + 1}`) : [];

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
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingTenant ? "Edit Tenant" : "Add New Tenant"}
                  </h2>
                  <p className="text-gray-600">
                    {editingTenant ? "Update tenant information" : "Add a new tenant to your property"}
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
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 ${
                        errors.name ? "border-red-300" : "border-green-200"
                      }`}
                      placeholder="Enter tenant name"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 ${
                        errors.email ? "border-red-300" : "border-green-200"
                      }`}
                      placeholder="Enter email address"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="Enter phone number (optional)"
                    />
                  </div>
                </div>

                {/* Monthly Rent */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Rent (₱) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.monthlyRent}
                      onChange={(e) => handleInputChange("monthlyRent", parseFloat(e.target.value) || 0)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 ${
                        errors.monthlyRent ? "border-red-300" : "border-green-200"
                      }`}
                      placeholder="Enter monthly rent in PHP"
                    />
                  </div>
                  {errors.monthlyRent && (
                    <p className="mt-1 text-sm text-red-600">{errors.monthlyRent}</p>
                  )}
                </div>


                {/* Assigned Property */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned Property
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      value={formData.assignedPropertyId}
                      onChange={(e) => {
                        handleInputChange("assignedPropertyId", e.target.value);
                        handleInputChange("assignedUnitId", ""); // Reset unit when property changes
                      }}
                      className="w-full pl-10 pr-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    >
                      <option value="">Select a property (optional)</option>
                      {properties.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Assigned Unit */}
                {formData.assignedPropertyId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned Unit
                    </label>
                    <select
                      value={formData.assignedUnitId}
                      onChange={(e) => handleInputChange("assignedUnitId", e.target.value)}
                      className="w-full px-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    >
                      <option value="">Select a unit (optional)</option>
                      {availableUnits.map((unit, index) => (
                        <option key={index} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      rows={3}
                      className="w-full pl-10 pr-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 resize-none"
                      placeholder="Enter any additional notes (optional)"
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
                  {editingTenant ? "Update Tenant" : "Create Tenant"}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

