"use client";

import { motion } from "framer-motion";
import { User, Mail, Phone, MapPin, Edit, Trash2, UserCheck } from "lucide-react";
import type { Tenant } from "@/types/firestore";
import { Button } from "@/components/Button";

interface TenantCardProps {
  tenant: Tenant;
  propertyId: string;
  isAssigned: boolean;
}

export function TenantCard({ tenant, isAssigned }: TenantCardProps) {
  const handleEdit = () => {
    // TODO: Implement edit tenant functionality
    console.log("Edit tenant:", tenant.id);
  };

  const handleDelete = () => {
    // TODO: Implement delete tenant functionality with confirmation
    console.log("Delete tenant:", tenant.id);
  };

  const handleAssign = () => {
    // TODO: Implement assign tenant functionality
    console.log("Assign tenant:", tenant.id);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`bg-white rounded-xl p-4 shadow-sm border transition-all duration-300 ${
        isAssigned 
          ? 'border-green-200 bg-green-50/30' 
          : 'border-gray-100 hover:shadow-md'
      }`}
    >
      {/* Tenant Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isAssigned ? 'bg-green-100' : 'bg-blue-100'
          }`}>
            <User className={`w-4 h-4 ${isAssigned ? 'text-green-600' : 'text-blue-600'}`} />
          </div>
          <h4 className="font-semibold text-gray-900 truncate">{tenant.fullName}</h4>
        </div>
        
        {isAssigned && (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full border border-green-200">
            <UserCheck className="w-3 h-3 inline mr-1" />
            Assigned
          </span>
        )}
      </div>

      {/* Tenant Details */}
      <div className="space-y-2">
        {/* Email */}
        <div className="flex items-center gap-2">
          <Mail className="w-3 h-3 text-gray-400" />
          <span className="text-sm text-gray-600 truncate">{tenant.contact?.email}</span>
        </div>

        {/* Phone */}
        {tenant.contact?.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3 h-3 text-gray-400" />
            <span className="text-sm text-gray-600">{tenant.contact?.phone}</span>
          </div>
        )}

        {/* Monthly rent omitted; not part of canonical tenant schema */}

        {/* Lease Info */}
        {tenant.leaseStartDate && tenant.leaseEndDate && (
          <div className="text-xs text-gray-500">
            <p>Lease: {new Date(tenant.leaseStartDate).toLocaleDateString()} - {new Date(tenant.leaseEndDate).toLocaleDateString()}</p>
          </div>
        )}

        {/* Notes */}
        {tenant.notes && (
          <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">
            <p className="line-clamp-2">{tenant.notes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        {!isAssigned ? (
          <Button
            onClick={handleAssign}
            size="sm"
            className="flex-1 flex items-center justify-center gap-1"
          >
            <MapPin className="w-3 h-3" />
            Assign
          </Button>
        ) : (
          <Button
            onClick={handleAssign}
            variant="outline"
            size="sm"
            className="flex-1 flex items-center justify-center gap-1"
          >
            <MapPin className="w-3 h-3" />
            Reassign
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleEdit}
          className="flex items-center justify-center"
        >
          <Edit className="w-3 h-3" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          className="flex items-center justify-center text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </motion.div>
  );
}
