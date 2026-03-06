"use client";

import { motion } from "framer-motion";
import { Users, X, Plus, User, Mail, Phone, MapPin, Building2, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/Button";
import type { Property } from "@/types/firestore";

interface FormDataState {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  propertyId: string;
  moveInDate: string;
  rentType: "Monthly" | "Yearly" | "Custom";
  notes: string;
  // Lease information
  leaseStartDate: string;
  leaseEndDate: string;
  leaseTerms: string;
  securityDeposit: string;
}

interface TenantManualFormProps {
  formData: FormDataState;
  onChange: (data: FormDataState) => void;
  properties: Property[];
  onSubmit: () => void;
  onCancel: () => void;
  saving?: boolean;
}

export function TenantManualForm({ formData, onChange, properties, onSubmit, onCancel, saving = false }: TenantManualFormProps) {
  const update = (patch: Partial<FormDataState>) => onChange({ ...formData, ...patch });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }} 
      animate={{ opacity: 1, y: 0, scale: 1 }} 
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-4 shadow-lg"
            >
              <Users className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <motion.h2 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-gray-900"
              >
                Manual Tenant Entry
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600"
              >
                Enter tenant details directly into the system
              </motion.p>
            </div>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button variant="ghost" size="icon" onClick={onCancel} disabled={saving} className="text-gray-500 hover:text-gray-700 hover:bg-gray-100">
              <X className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Full Name */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="md:col-span-2"
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <User className="w-4 h-4 mr-2 text-blue-600" />
              Full Name *
            </label>
            <input 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md" 
              value={formData.fullName} 
              onChange={(e) => update({ fullName: e.target.value })} 
              placeholder="Enter full name" 
            />
          </motion.div>

          {/* Email */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <Mail className="w-4 h-4 mr-2 text-blue-600" />
              Email *
            </label>
            <input 
              type="email" 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md" 
              value={formData.email} 
              onChange={(e) => update({ email: e.target.value })} 
              placeholder="Enter email address" 
            />
          </motion.div>

          {/* Phone */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <Phone className="w-4 h-4 mr-2 text-blue-600" />
              Phone *
            </label>
            <input 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md" 
              value={formData.phone} 
              onChange={(e) => update({ phone: e.target.value })} 
              placeholder="Enter phone number" 
            />
          </motion.div>

          {/* Address */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
            className="md:col-span-2"
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-blue-600" />
              Address
            </label>
            <input 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md" 
              value={formData.address} 
              onChange={(e) => update({ address: e.target.value })} 
              placeholder="Street, City, State" 
            />
          </motion.div>

          {/* Preferred Property */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <Building2 className="w-4 h-4 mr-2 text-blue-600" />
              Preferred Property
            </label>
            <select 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md" 
              value={formData.propertyId} 
              onChange={(e) => update({ propertyId: e.target.value })}
            >
              <option value="">No preference</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </motion.div>

          {/* Move-In Date */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.1 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-blue-600" />
              Move-In Date
            </label>
            <input 
              type="date" 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md" 
              value={formData.moveInDate} 
              onChange={(e) => update({ moveInDate: e.target.value })} 
            />
          </motion.div>

          {/* Rent Type */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-blue-600" />
              Rent Type
            </label>
            <select 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md" 
              value={formData.rentType} 
              onChange={(e) => update({ rentType: e.target.value as ("Monthly"|"Yearly"|"Custom") })}
            >
              <option>Monthly</option>
              <option>Yearly</option>
              <option>Custom</option>
            </select>
          </motion.div>

          {/* Notes */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.3 }}
            className="md:col-span-2"
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-blue-600" />
              Notes
            </label>
            <textarea 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md resize-none" 
              rows={3} 
              value={formData.notes} 
              onChange={(e) => update({ notes: e.target.value })} 
              placeholder="Optional notes about the tenant..." 
            />
          </motion.div>

          {/* Lease Information Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.4 }}
            className="md:col-span-2 border-t border-gray-200 pt-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              Lease Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.5 }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                  Lease Start Date
                </label>
                <input 
                  type="date" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md" 
                  value={formData.leaseStartDate} 
                  onChange={(e) => update({ leaseStartDate: e.target.value })} 
                />
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.6 }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                  Lease End Date
                </label>
                <input 
                  type="date" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md" 
                  value={formData.leaseEndDate} 
                  onChange={(e) => update({ leaseEndDate: e.target.value })} 
                />
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.7 }}
              className="mt-6"
            >
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-blue-600" />
                Security Deposit
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 pr-2 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm font-semibold">₱</span>
                </div>
                <input 
                  type="number" 
                  className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md" 
                  value={formData.securityDeposit} 
                  onChange={(e) => update({ securityDeposit: e.target.value })} 
                  placeholder="0" 
                  min="0" 
                  step="0.01"
                />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.8 }}
              className="mt-6"
            >
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-blue-600" />
                Lease Terms & Conditions
              </label>
              <textarea 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md resize-none" 
                rows={3} 
                value={formData.leaseTerms} 
                onChange={(e) => update({ leaseTerms: e.target.value })} 
                placeholder="Optional lease terms, conditions, or special notes..." 
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="bg-gray-50 px-8 py-6 border-t border-gray-100">
        <div className="flex gap-4 justify-end">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              onClick={onCancel} 
              variant="outline" 
              className="text-gray-600 hover:bg-gray-100 border-gray-300 px-6 py-2" 
              disabled={saving}
            >
              Cancel
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              onClick={onSubmit} 
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-200" 
              disabled={saving}
            >
              {saving ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating...
                </div>
              ) : (
                <div className="flex items-center">
                  <Plus className="w-4 h-4 mr-2" /> 
                  Create Tenant
                </div>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
