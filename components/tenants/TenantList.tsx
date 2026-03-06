"use client";

import { motion } from "framer-motion";
import { Users, Edit, Trash2, Mail, Phone, MapPin, User, Building2 } from "lucide-react";
import { Button } from "@/components/Button";
import type { Tenant } from "@/types/firestore";

interface TenantListProps {
  tenants: Tenant[];
  loading: boolean;
  onEdit: (tenant: Tenant) => void;
  onDelete: (tenantId: string) => void;
}

export function TenantList({ tenants, loading, onEdit, onDelete }: TenantListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <p className="ml-3 text-gray-600">Loading tenants...</p>
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No tenants found</h3>
        <p className="text-gray-500">Get started by adding your first tenant.</p>
      </div>
    );
  }


  return (
    <div className="space-y-4">
      {tenants.map((tenant, index) => (
        <motion.div
          key={tenant.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -2, scale: 1.01 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-green-100 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-start justify-between">
            {/* Tenant Info */}
            <div className="flex items-start space-x-4 flex-1">
              {/* Avatar */}
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              
              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900 truncate">{tenant.fullName}</h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${tenant.unitId ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                    {tenant.unitId ? "Assigned" : "Unassigned"}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{tenant.contact?.email}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{tenant.contact?.phone || 'No phone'}</span>
                  </div>
                  
                  {/* Monthly rent not in canonical type; omit or compute elsewhere */}
                  
                  {tenant.propertyId && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="truncate">Assigned to property</span>
                    </div>
                  )}
                  
                  {tenant.unitId && (
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span>Unit {tenant.unitId}</span>
                    </div>
                  )}
                </div>
                
                {tenant.notes && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                      <strong>Notes:</strong> {tenant.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex space-x-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(tenant)}
                className="text-gray-500 hover:text-green-600 hover:bg-green-50"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(tenant.id)}
                className="text-gray-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
