"use client";

import { motion } from "framer-motion";
import { Users, Edit, Trash2, User, Mail, Phone, DollarSign, Plus } from "lucide-react";
import { Button } from "./Button";
import type { Tenant } from "@/types/properties";

interface DragDropTenantPoolProps {
  tenants: Tenant[];
  loading: boolean;
  onDragStart: (tenant: Tenant) => void;
  onEdit: (tenant: Tenant) => void;
  onDelete: (tenantId: string) => void;
}

export function DragDropTenantPool({ tenants, loading, onDragStart, onEdit, onDelete }: DragDropTenantPoolProps) {
  const getRentStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Unpaid":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-green-100">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          <p className="ml-3 text-gray-600">Loading tenants...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-green-100"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Tenant Pool</h3>
            <p className="text-sm text-gray-600">Drag to assign</p>
          </div>
        </div>
        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
          {tenants.length} available
        </span>
      </div>

      {/* Tenants List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {tenants.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No unassigned tenants</p>
            <p className="text-gray-400 text-xs">Add tenants to get started</p>
          </div>
        ) : (
          tenants.map((tenant, index) => (
            <motion.div
              key={tenant.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                delay: index * 0.1,
                duration: 0.4,
                ease: "easeOut"
              }}
              draggable
              onDragStart={() => onDragStart(tenant)}
              whileHover={{ 
                scale: 1.03, 
                y: -3,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.97 }}
              whileDrag={{ 
                scale: 1.1, 
                rotate: 5,
                z: 1000,
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
              }}
              className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-4 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all duration-200 hover:border-green-300"
            >
              <div className="flex items-start justify-between">
                {/* Tenant Info */}
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  
                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-bold text-gray-900 truncate">{tenant.name}</h4>
                    </div>
                    
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{tenant.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3 h-3" />
                        <span>{tenant.phone || 'No phone'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-3 h-3" />
                        <span>₱{(tenant.monthlyRent || 0).toLocaleString()}/month</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex space-x-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(tenant)}
                    className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(tenant.id)}
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              {/* Drag Hint */}
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-600 font-medium text-center">
                  Drag to assign to a building unit
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Tenant Button */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <Button
          onClick={() => {/* This will be handled by parent */}}
          variant="outline"
          className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Tenant
        </Button>
      </div>
    </motion.div>
  );
}
