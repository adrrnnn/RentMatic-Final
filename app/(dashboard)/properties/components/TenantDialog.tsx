"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Mail, Phone, Calendar, Home } from "lucide-react";
import { Button } from "@/components/Button";
import type { Tenant, Unit, Property, CreateTenantData, UpdateTenantData } from "@/types/firestore";

interface TenantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateTenantData | UpdateTenantData) => Promise<void>;
  tenant?: Tenant | null;
  units: Unit[];
  properties: Property[];
  loading?: boolean;
  userId?: string;
}

export function TenantDialog({ 
  isOpen, 
  onClose, 
  onSave, 
  tenant, 
  units,
  properties,
  loading = false,
  userId
}: TenantDialogProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    moveInDate: "",
    notes: "",
    unitId: "",
    // Lease information
    leaseStartDate: "",
    leaseEndDate: "",
    leaseTerms: "",
    securityDeposit: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get available units (not occupied)
  const availableUnits = units.filter(unit => unit.status === "Available" || unit.id === tenant?.unitId);

  useEffect(() => {
    if (isOpen) {
      if (tenant) {
        const toDateInput = (value?: string) => {
          if (!value) return "";
          const d = new Date(value);
          if (Number.isNaN(d.getTime())) return "";
          return d.toISOString().slice(0, 10); // yyyy-MM-dd
        };
        setFormData({
          fullName: tenant.fullName,
          email: tenant.contact.email,
          phone: tenant.contact.phone,
          moveInDate: toDateInput(tenant.moveInDate),
          notes: tenant.notes || "",
          unitId: tenant.unitId || "",
          // Lease information
          leaseStartDate: toDateInput(tenant.leaseStartDate),
          leaseEndDate: toDateInput(tenant.leaseEndDate),
          leaseTerms: tenant.leaseTerms || "",
          securityDeposit: tenant.securityDeposit?.toString() || ""
        });
      } else {
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          moveInDate: "",
          notes: "",
          unitId: "",
          // Lease information
          leaseStartDate: "",
          leaseEndDate: "",
          leaseTerms: "",
          securityDeposit: ""
        });
      }
      setErrors({});
    }
  }, [tenant, isOpen]);

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

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (tenant) {
        const payload: UpdateTenantData = {
          fullName: formData.fullName,
          contact: { email: formData.email, phone: formData.phone }
        };
        if (formData.moveInDate) payload.moveInDate = new Date(formData.moveInDate).toISOString();
        if (formData.notes && formData.notes.trim().length > 0) payload.notes = formData.notes.trim();
        if (formData.unitId) payload.unitId = formData.unitId;
        // Lease information - convert back to ISO strings
        if (formData.leaseStartDate) payload.leaseStartDate = new Date(formData.leaseStartDate + 'T00:00:00').toISOString();
        if (formData.leaseEndDate) payload.leaseEndDate = new Date(formData.leaseEndDate + 'T00:00:00').toISOString();
        if (formData.leaseTerms && formData.leaseTerms.trim().length > 0) payload.leaseTerms = formData.leaseTerms.trim();
        if (formData.securityDeposit) payload.securityDeposit = Number(formData.securityDeposit);
        await onSave(payload);
      } else {
        const payload: CreateTenantData = {
          fullName: formData.fullName,
          contact: { email: formData.email, phone: formData.phone }
        };
        if (formData.moveInDate) payload.moveInDate = new Date(formData.moveInDate).toISOString();
        if (formData.notes && formData.notes.trim().length > 0) payload.notes = formData.notes.trim();
        if (formData.unitId) payload.unitId = formData.unitId;
        // Lease information - convert back to ISO strings
        if (formData.leaseStartDate) payload.leaseStartDate = new Date(formData.leaseStartDate + 'T00:00:00').toISOString();
        if (formData.leaseEndDate) payload.leaseEndDate = new Date(formData.leaseEndDate + 'T00:00:00').toISOString();
        if (formData.leaseTerms && formData.leaseTerms.trim().length > 0) payload.leaseTerms = formData.leaseTerms.trim();
        if (formData.securityDeposit) payload.securityDeposit = Number(formData.securityDeposit);
        await onSave(payload);
      }
      onClose();
    } catch (error) {
      console.error("Error saving tenant:", error);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const getUnitDisplayName = (unitId: string) => {
    const unit = units.find(u => u.id === unitId);
    if (!unit) return "";
    
    const property = properties.find(p => p.id === unit.propertyId);
    return `${unit.name} (${property?.name || "Unknown Property"})`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {tenant ? "Edit Tenant" : "Add New Tenant"}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {tenant ? "Update tenant information" : "Create a new tenant"}
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
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.fullName ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Enter tenant's full name"
                    disabled={loading}
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                  )}
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                          errors.email ? "border-red-300" : "border-gray-300"
                        }`}
                        placeholder="Enter email address"
                        disabled={loading}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                          errors.phone ? "border-red-300" : "border-gray-300"
                        }`}
                        placeholder="Enter phone number"
                        disabled={loading}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Move-in Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="moveInDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Move-in Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="date"
                        id="moveInDate"
                        name="moveInDate"
                        value={formData.moveInDate}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                {/* Unit Assignment */}
                <div>
                  <label htmlFor="unitId" className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Assignment (Optional)
                  </label>
                  <div className="relative">
                    <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      id="unitId"
                      name="unitId"
                      value={formData.unitId}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={loading}
                    >
                      <option value="">No unit assigned</option>
                      {availableUnits.map(unit => (
                        <option key={unit.id} value={unit.id}>
                          {getUnitDisplayName(unit.id)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    You can assign a unit now or do it later using drag-and-drop
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter any additional notes about the tenant"
                    disabled={loading}
                  />
                </div>

                {/* Lease Information Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Home className="w-5 h-5 mr-2 text-purple-600" />
                    Lease Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="leaseStartDate" className="block text-sm font-medium text-gray-700 mb-2">
                        Lease Start Date
                      </label>
                      <input
                        type="date"
                        id="leaseStartDate"
                        name="leaseStartDate"
                        value={formData.leaseStartDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label htmlFor="leaseEndDate" className="block text-sm font-medium text-gray-700 mb-2">
                        Lease End Date
                      </label>
                      <input
                        type="date"
                        id="leaseEndDate"
                        name="leaseEndDate"
                        value={formData.leaseEndDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label htmlFor="securityDeposit" className="block text-sm font-medium text-gray-700 mb-2">
                      Security Deposit
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 pr-2 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm font-semibold">₱</span>
                      </div>
                      <input
                        type="number"
                        id="securityDeposit"
                        name="securityDeposit"
                        value={formData.securityDeposit}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="0"
                        min="0"
                        step="0.01"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label htmlFor="leaseTerms" className="block text-sm font-medium text-gray-700 mb-2">
                      Lease Terms & Conditions
                    </label>
                    <textarea
                      id="leaseTerms"
                      name="leaseTerms"
                      value={formData.leaseTerms}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      placeholder="Enter lease terms, conditions, or special notes..."
                      disabled={loading}
                    />
                  </div>
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
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {loading ? "Saving..." : tenant ? "Update Tenant" : "Create Tenant"}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}