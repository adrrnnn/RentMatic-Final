"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, User, Mail, Phone, FileText } from "lucide-react";
import type { Tenant, CreateTenantData, UpdateTenantData } from "@/types/firestore";
import { TenantService } from "@/lib/firestore/properties/tenantService";
import toast from "react-hot-toast";

interface SimpleTenantModalProps {
  tenant: Tenant | null;
  userId: string;
  onClose: (success: boolean) => void;
}

export function SimpleTenantModal({ tenant, userId, onClose }: SimpleTenantModalProps) {
  interface TenantFormData {
    fullName: string;
    contact: {
      email: string;
      phone: string;
    };
    notes: string;
  }

  const [formData, setFormData] = useState<TenantFormData>({
    fullName: tenant?.fullName || "",
    contact: {
      email: tenant?.contact?.email || "",
      phone: tenant?.contact?.phone || "",
    },
    notes: tenant?.notes || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.contact.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.contact.email)) {
      newErrors.email = "Email is invalid";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (tenant) {
        // Update existing tenant
        const updates: UpdateTenantData = {
          fullName: formData.fullName,
          contact: { email: formData.contact.email, phone: formData.contact.phone },
          notes: formData.notes,
        };
        await TenantService.updateTenant(userId, tenant.id, updates);
        toast.success("Tenant updated");
      } else {
        // Create new tenant
        const create: CreateTenantData = {
          fullName: formData.fullName,
          contact: { email: formData.contact.email, phone: formData.contact.phone },
          notes: formData.notes,
          unitId: null,
          propertyId: null,
        };
        await TenantService.createTenant(userId, create);
        toast.success("Tenant created");
      }

      onClose(true);
    } catch (error) {
      console.error("Error saving tenant:", error);
      toast.error("Failed to save tenant");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: 'fullName' | 'email' | 'phone' | 'notes', value: string) => {
    if (field === "fullName") {
      setFormData((prev) => ({ ...prev, fullName: value }));
    } else if (field === "email") {
      setFormData((prev) => ({ ...prev, contact: { ...prev.contact, email: value } }));
    } else if (field === "phone") {
      setFormData((prev) => ({ ...prev, contact: { ...prev.contact, phone: value } }));
    } else if (field === "notes") {
      setFormData((prev) => ({ ...prev, notes: value }));
    }
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={() => onClose(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-green-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {tenant ? "Edit Tenant" : "Add New Tenant"}
              </h2>
              <p className="text-gray-600 text-sm">
                {tenant
                  ? "Update tenant information"
                  : "Create a new tenant profile"}
              </p>
            </div>
          </div>
          <button
            onClick={() => onClose(false)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
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
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 ${
                    errors.name ? "border-red-300" : "border-gray-200"
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
                  value={formData.contact.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 ${
                    errors.email ? "border-red-300" : "border-gray-200"
                  }`}
                  placeholder="Enter email address"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Contact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  value={formData.contact.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 ${
                    errors.phone ? "border-red-300" : "border-gray-200"
                  }`}
                  placeholder="Enter phone number"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Monthly rent omitted; not part of canonical tenant schema */}


            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 resize-none"
                  placeholder="Enter any additional notes"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Saving..."
                : tenant
                  ? "Update Tenant"
                  : "Create Tenant"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

