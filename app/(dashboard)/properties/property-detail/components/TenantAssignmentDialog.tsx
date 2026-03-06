"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, User, Search, Check } from "lucide-react";
import { Button } from "@/components/Button";
import type { Unit, Tenant } from "@/types/firestore";
import { TenantService } from "@/lib/firestore/properties/tenantService";

interface TenantAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (tenantId: string, unitId: string) => Promise<void>;
  unit: Unit | null;
  propertyId: string;
  userId: string;
  loading?: boolean;
}

export function TenantAssignmentDialog({
  isOpen,
  onClose,
  onAssign,
  unit,
  propertyId,
  userId,
  loading = false
}: TenantAssignmentDialogProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  // Load tenants when dialog opens
  useEffect(() => {
    if (isOpen && userId) {
      const unsubscribe = TenantService.getTenantsListener(userId, (fetchedTenants) => {
        // Treat unitId as assigned only if it is a non-empty, non-"null" string
        const isUnassigned = (u: unknown) => u === null || u === undefined || (typeof u === 'string' && u.trim() === '') || u === 'null' || u === 'undefined';
        const availableTenants = fetchedTenants.filter(tenant => isUnassigned(tenant.unitId));
        setTenants(availableTenants);
      });

      return () => unsubscribe();
    }
  }, [isOpen, userId, propertyId]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setSelectedTenantId(null);
      setAssigning(false);
    }
  }, [isOpen]);

  const filteredTenants = tenants.filter(tenant =>
    tenant.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssign = async () => {
    if (!selectedTenantId || !unit) return;
    
    try {
      setAssigning(true);
      await onAssign(selectedTenantId, unit.id);
      onClose();
    } catch (error) {
      console.error("Error assigning tenant:", error);
    } finally {
      setAssigning(false);
    }
  };

  if (!isOpen || !unit) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Assign Tenant to Unit</h2>
              <p className="text-green-100 mt-1">
                Select a tenant to assign to <strong>{unit.name}</strong>
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-green-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Unit Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Unit Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <span className="ml-2 font-medium">{unit.name}</span>
              </div>
              <div>
                <span className="text-gray-600">Floor:</span>
                <span className="ml-2 font-medium">{unit.floor}</span>
              </div>
              <div>
                <span className="text-gray-600">Rent:</span>
                <span className="ml-2 font-medium">₱{unit.rentAmount.toLocaleString()}/{unit.rentType}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 font-medium">{unit.status}</span>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tenants by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Tenants List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredTenants.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium">No available tenants</p>
                <p className="text-sm">All tenants are already assigned to units.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", tenant.id);
                      setSelectedTenantId(tenant.id);
                    }}
                    onClick={() => setSelectedTenantId(tenant.id)}
                    className={`p-4 border rounded-lg cursor-move transition-all ${
                      selectedTenantId === tenant.id
                        ? "border-green-500 bg-green-50 ring-2 ring-green-200"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          selectedTenantId === tenant.id
                            ? "border-green-500 bg-green-500"
                            : "border-gray-300"
                        }`}>
                          {selectedTenantId === tenant.id && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{tenant.fullName}</h4>
                          <p className="text-sm text-gray-600">{tenant.contact.email}</p>
                          <p className="text-xs text-gray-500">{tenant.contact.phone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tenant.unitId
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {tenant.unitId ? "Assigned" : "Available"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={assigning}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedTenantId || assigning}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {assigning ? "Assigning..." : "Assign Tenant"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
