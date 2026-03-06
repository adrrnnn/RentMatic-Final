"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { Tenant } from "@/types/firestore";
import { TenantCard } from "./TenantCard";
import { Users, Search, Filter } from "lucide-react";

interface TenantPoolProps {
  tenants: Tenant[];
  loading?: boolean;
  onTenantDragStart?: (tenant: Tenant) => void;
  onTenantDragEnd?: () => void;
  className?: string;
}

export function TenantPool({ 
  tenants, 
  loading = false,
  onTenantDragStart,
  onTenantDragEnd,
  className = ""
}: TenantPoolProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const filteredTenants = tenants.filter(tenant => {
    const nameMatch = tenant.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = tenant.contact?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const phoneMatch = tenant.contact?.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    return Boolean(nameMatch || emailMatch || phoneMatch);
  });

  const handleDragStart = (e: React.DragEvent, tenant: Tenant) => {
    e.dataTransfer.setData("application/json", JSON.stringify(tenant));
    e.dataTransfer.effectAllowed = "move";
    onTenantDragStart?.(tenant);
  };

  const handleDragEnd = () => {
    onTenantDragEnd?.();
  };

  if (loading) {
    return (
      <div className={`bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-green-100 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-green-100 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Tenant Pool</h3>
          <p className="text-sm text-gray-600">{tenants.length} available tenants</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search tenants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white/50 backdrop-blur-sm text-sm"
          />
        </div>
        
      </div>

      {/* Tenants List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {filteredTenants.length > 0 ? (
            filteredTenants.map((tenant, index) => (
              <motion.div
                key={tenant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <TenantCard
                  tenant={tenant}
                  onDragStart={(e) => handleDragStart(e, tenant)}
                  onDragEnd={handleDragEnd}
                  className="cursor-grab active:cursor-grabbing"
                />
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h4 className="text-sm font-medium text-gray-600 mb-1">
                {searchTerm ? "No tenants found" : "No tenants available"}
              </h4>
              <p className="text-xs text-gray-500">
                {searchTerm 
                  ? "Try adjusting your search" 
                  : "All tenants are currently assigned to properties"
                }
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-3 bg-green-50 rounded-lg border border-green-200">
        <p className="text-xs text-green-700">
          <strong>💡 Tip:</strong> Drag tenants from this pool and drop them onto property units to assign them.
        </p>
      </div>
    </div>
  );
}

