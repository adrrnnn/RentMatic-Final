"use client";

import { useState, useMemo, useEffect } from "react";
// import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Users, Home, Building2, Edit, Trash2, Phone, Calendar, Send, Search, MessageSquare, FileText } from "lucide-react";
import { Button } from "@/components/Button";
import { getClientDb } from "@/lib/firebase";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { useUserStore } from "@/store/useUserStore";
import type { Tenant, Unit, Property } from "@/types/firestore";

// Extended tenant type with shared properties
type ExtendedTenant = Tenant & {
  isShared?: boolean;
  source?: 'user' | 'shared';
};
import { TenantManualForm } from "./TenantManualForm";
import { TenantInviteForm } from "./TenantInviteForm";
import { TenantPreviewCard } from "./TenantPreviewCard";

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

interface TenantsTabProps {
  tenants: ExtendedTenant[];
  properties: Property[];
  onEdit: (tenant: ExtendedTenant) => void;
  onDelete: (tenant: ExtendedTenant) => void;
  onAssignTenant: (tenantId: string, propertyId: string, unitId: string) => void;
  onUnassignTenant: (tenantId: string, unitId: string) => void;
  onCreate?: () => void;
  onSaveTenant?: (data: FormDataState) => void;
  onInviteTenant?: (email: string, message?: string) => void;
  loading?: boolean;
}

export function TenantsTab({ 
  tenants, 
  properties,
  onEdit,
  onDelete,
  onAssignTenant,
  onUnassignTenant,
  onCreate,
  onSaveTenant,
  onInviteTenant,
  loading = false
}: TenantsTabProps) {
  const { user } = useUserStore();
  // Local delete dialog removed; handled globally by parent page
  const [creationMode, setCreationMode] = useState<'manual' | 'invite' | 'view' | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<FormDataState>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    propertyId: "",
    moveInDate: "",
    rentType: "Monthly",
    notes: "",
    // Lease information
    leaseStartDate: "",
    leaseEndDate: "",
    leaseTerms: "",
    securityDeposit: ""
  });

  // Active tab for View Tenants
  const [activeTab, setActiveTab] = useState<'assigned' | 'unassigned' | 'registrations'>('assigned');

  // Filter tenants based on search query
  const filteredTenants = useMemo(() => {
    if (!searchQuery.trim()) return tenants;
    
    return tenants.filter((tenant: ExtendedTenant) =>
      tenant.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.contact.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tenant.notes && tenant.notes.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [tenants, searchQuery]);

  // Live registrations from tenant-registrations for this landlord
  const [registrations, setRegistrations] = useState<ExtendedTenant[]>([]);

  useEffect(() => {
    const db = getClientDb();
    if (!db || !user?.id) return;
    console.log('Registrations listener init for uid:', user.id);
    const q = query(
      collection(db, "tenant-registrations"),
      where("landlordId", "==", user.id)
    );
    const unsub = onSnapshot(q, (snap) => {
      console.log('Registrations snapshot for uid', user.id, 'count:', snap.size);
      const items: any[] = snap.docs.map((doc) => {
        const data: any = doc.data();
        return {
          id: doc.id,
          fullName: data.fullName,
          contact: data.contact,
          notes: data.notes,
          moveInDate: data.moveInDate,
          propertyId: data.propertyId || undefined,
          status: data.status,
          createdAt: data.createdAt,
        };
      });
      const filtered = items.filter((i) => !i.status || i.status === 'pending' || i.status === 'new');
      setRegistrations(filtered as ExtendedTenant[]);
    });
    return () => unsub();
  }, [user?.id]);

  // Helper function to check if lease data is missing
  const isMissing = (v?: string | null) => !v || v === "" || v === "null" || v === "undefined";

  // Group tenants by assignment status + lease
  const { assignedTenants, unassignedTenants, noLeaseTenants } = useMemo(() => {
    const assigned: ExtendedTenant[] = [];
    const unassigned: ExtendedTenant[] = [];
    const noLease: ExtendedTenant[] = [];

    filteredTenants.forEach((tenant: ExtendedTenant) => {
      const hasUnit = !!tenant.unitId;
      const missingLease = isMissing(tenant.leaseStartDate) || isMissing(tenant.leaseEndDate);

      // Debug: Log tenant categorization
      console.log('TenantsTab - Categorizing tenant:', {
        tenantId: tenant.id,
        fullName: tenant.fullName,
        hasUnit,
        leaseStartDate: tenant.leaseStartDate,
        leaseEndDate: tenant.leaseEndDate,
        missingLease,
        isMissingStart: isMissing(tenant.leaseStartDate),
        isMissingEnd: isMissing(tenant.leaseEndDate)
      });

      if (hasUnit) {
        assigned.push(tenant);
      } else if (missingLease) {
        noLease.push(tenant);
      } else {
        unassigned.push(tenant);
      }
    });

    return { assignedTenants: assigned, unassignedTenants: unassigned, noLeaseTenants: noLease };
  }, [filteredTenants]);

  // Helper function to get unit and property info for a tenant
  const getTenantAssignmentInfo = (tenant: ExtendedTenant) => {
    // Since units are now handled per-property, we'll need to get this info differently
    // For now, return null values - this will be handled in the property detail view
    const unit = null;
    const property = tenant.propertyId ? properties.find(p => p.id === tenant.propertyId) : null;
    return { unit, property };
  };

  const handleDelete = (tenant: Tenant) => {
    console.log('TenantsTab.handleDelete - Delete button clicked for tenant:', {
      tenantId: tenant.id,
      tenantName: tenant.fullName,
      isShared: (tenant as ExtendedTenant).isShared
    });
    onDelete(tenant as ExtendedTenant);
  };

  // confirmDelete removed; deletion handled by parent dialog

  // cancelDelete removed

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  const handleCreateTenant = () => {
    if (onSaveTenant) {
      onSaveTenant(formData);
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        propertyId: "",
        moveInDate: "",
        rentType: "Monthly",
        notes: "",
        // Lease information
        leaseStartDate: "",
        leaseEndDate: "",
        leaseTerms: "",
        securityDeposit: ""
      });
      setCreationMode(null);
    }
  };

  const handleInviteTenant = (email: string, message?: string) => {
    if (onInviteTenant) {
      onInviteTenant(email, message);
      setCreationMode(null);
    }
  };

  const selectedProperty = properties.find(p => p.id === formData.propertyId);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-pulse">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!loading && !creationMode) {
    return (
      <>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tenant Management</h1>
            <p className="text-lg text-gray-600">Add tenants manually or invite them to self-register</p>
            {/* Quick stats – subtle, in-line with current style */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-200">Total: {tenants.length}</span>
              <span className="px-2.5 py-1 rounded-full text-xs bg-green-50 text-green-700 border border-green-200">Assigned: {assignedTenants.length}</span>
              <span className="px-2.5 py-1 rounded-full text-xs bg-orange-50 text-orange-700 border border-orange-200">Unassigned: {unassignedTenants.length}</span>
              <span className="px-2.5 py-1 rounded-full text-xs bg-yellow-50 text-yellow-800 border border-yellow-200">Registrations: {noLeaseTenants.length}</span>
            </div>
          </div>
          
          {/* Tenant Request Actions */}
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => window.location.href = '/tenant-requests'}
              variant="outline"
              icon={<MessageSquare className="w-5 h-5" />}
              className="border-green-300 text-green-600 hover:bg-green-50"
            >
              View Requests
            </Button>
          </div>
        </div>

        {/* Action Options - Dashboard Style Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Manual Entry Card */}
          <motion.div
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.99 }}
            className="p-3 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
            onClick={() => setCreationMode('manual')}
          >
            <Users className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-medium text-gray-900">Manual Entry</h3>
            <p className="text-sm text-gray-600">Add tenant information directly to the system</p>
          </motion.div>

          {/* Send Invitation Card */}
          <motion.div
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.99 }}
            className="p-3 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-colors cursor-pointer"
            onClick={() => setCreationMode('invite')}
          >
            <Send className="w-8 h-8 text-purple-600 mb-2" />
            <h3 className="font-medium text-gray-900">Send Invitation</h3>
            <p className="text-sm text-gray-600">Email invitation for self-registration</p>
          </motion.div>

          {/* View Tenants Card */}
          <motion.div
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.99 }}
            className="p-3 border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-colors cursor-pointer"
            onClick={() => setCreationMode('view')}
          >
            <Users className="w-8 h-8 text-green-600 mb-2" />
            <h3 className="font-medium text-gray-900">View Tenants</h3>
            <p className="text-sm text-gray-600">Browse and manage tenant records</p>
            {/* Small counters row */}
            <div className="mt-2 flex gap-1.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-green-100 text-green-700 border border-green-200">Assigned {assignedTenants.length}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-orange-100 text-orange-700 border border-orange-200">Unassigned {unassignedTenants.length}</span>
            </div>
          </motion.div>

          {/* View Registrations Card */}
          <motion.div
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.99 }}
            className="p-3 border border-gray-200 rounded-xl hover:border-yellow-300 hover:bg-yellow-50 transition-colors cursor-pointer"
            onClick={() => { setCreationMode('view'); setActiveTab('registrations'); }}
          >
            <Users className="w-8 h-8 text-yellow-600 mb-2" />
            <h3 className="font-medium text-gray-900">View Registrations</h3>
            <p className="text-sm text-gray-600">Approve self-registrations and add leases</p>
            <div className="mt-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-yellow-100 text-yellow-800 border border-yellow-200">Pending {registrations.length + noLeaseTenants.length}</span>
            </div>
          </motion.div>

          {/* Tenant Request Form Card */}
          <motion.div
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.99 }}
            className="p-3 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-colors cursor-pointer"
            onClick={() => window.location.href = '/form'}
          >
            <FileText className="w-8 h-8 text-orange-600 mb-2" />
            <h3 className="font-medium text-gray-900">Request Form</h3>
            <p className="text-sm text-gray-600">Configure tenant request collection form</p>
          </motion.div>
        </div>

      </>
    );
  }

  // View Tenants Mode
  if (!loading && creationMode === 'view') {
    // use outer activeTab state
    return (
      <>
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">View Tenants</h1>
            <p className="text-lg text-gray-600">Browse and manage your tenants</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setCreationMode(null)}
            className="text-gray-600 hover:bg-gray-50"
          >
            ← Back to Options
          </Button>
        </div>

        {/* Search Bar */}
        {tenants.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tenants by name, email, phone, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>
        )}

        {/* Empty State */}
        {tenants.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tenants yet</h3>
            <p className="text-gray-500 mb-6">Add your first tenant using the options above</p>
            <Button
              onClick={() => setCreationMode(null)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              ← Back to Options
            </Button>
          </div>
        )}

        {/* Enhanced Tabs */}
        <div className="mb-6">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {[
              { key: 'assigned', label: `Assigned`, count: assignedTenants.length, color: 'green' },
              { key: 'unassigned', label: `Unassigned`, count: unassignedTenants.length, color: 'orange' },
              { key: 'registrations', label: `Registrations`, count: registrations.length + noLeaseTenants.length, color: 'yellow' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'assigned' | 'unassigned' | 'registrations')}
                className={`flex-1 px-6 py-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeTab === tab.key 
                    ? `bg-white text-${tab.color}-700 shadow-sm border border-${tab.color}-200` 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === tab.key 
                      ? `bg-${tab.color}-100 text-${tab.color}-800` 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tenant List Section */}
        {tenants.length > 0 && (
          <div className="space-y-8">
            {/* Unassigned Tenants */}
              {activeTab === 'unassigned' && unassignedTenants.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-orange-600" />
                    Unassigned Tenants ({unassignedTenants.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {unassignedTenants.map((tenant, index) => (
                      <motion.div
                        key={tenant.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow"
                      >
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-lg font-semibold">
                              {tenant.fullName.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900">{tenant.fullName}</h4>
                              {(isMissing(tenant.leaseStartDate) || isMissing(tenant.leaseEndDate)) && (
                                <span className="px-2 py-0.5 text-[10px] rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">No lease</span>
                              )}
                              {tenant.isShared && (
                                <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-100 text-blue-800 border border-blue-200">Shared</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{tenant.contact.email}</p>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-4 h-4 mr-2" />
                            {tenant.contact.phone}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            Move-in: {formatDate(tenant.moveInDate)}
                          </div>
                        </div>

                        {tenant.notes && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <p className="text-sm text-gray-700">{tenant.notes}</p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(tenant)}
                            className="flex-1 text-yellow-600 hover:bg-yellow-50"
                          >
                            <Edit className="w-4 h-4 mr-1" /> Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(tenant)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assigned Tenants */}
              {activeTab === 'assigned' && assignedTenants.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Home className="w-5 h-5 mr-2 text-green-600" />
                    Assigned Tenants ({assignedTenants.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assignedTenants.map((tenant, index) => {
                      const { unit, property } = getTenantAssignmentInfo(tenant);

                      return (
                        <motion.div
                          key={tenant.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow"
                        >
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-lg font-semibold">
                                {tenant.fullName.charAt(0)}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-900">{tenant.fullName}</h4>
                                {(isMissing(tenant.leaseStartDate) || isMissing(tenant.leaseEndDate)) && (
                                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">No lease</span>
                                )}
                                {tenant.isShared && (
                                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-100 text-blue-800 border border-blue-200">Shared</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{tenant.contact.email}</p>
                            </div>
                          </div>

                          {/* Assignment Info */}
                          {unit && property && (
                            <div className="bg-green-50 rounded-lg p-3 mb-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <Building2 className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-green-800">{property.name}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Home className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-green-700">Unit assignment details available in property view</span>
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-sm text-green-700">Rent details available in property view</span>
                              </div>
                            </div>
                          )}

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="w-4 h-4 mr-2" />
                              {tenant.contact.phone}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="w-4 h-4 mr-2" />
                              Move-in: {formatDate(tenant.moveInDate)}
                            </div>
                          </div>

                          {tenant.notes && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                              <p className="text-sm text-gray-700">{tenant.notes}</p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEdit(tenant)}
                              className="flex-1 text-yellow-600 hover:bg-yellow-50"
                            >
                              <Edit className="w-4 h-4 mr-1" /> Edit
                            </Button>
                            {unit && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onUnassignTenant(tenant.id, '')}
                                className="text-orange-600 hover:bg-orange-50"
                              >
                                <Home className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(tenant)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Registrations (No Lease / Needs Lease) */}
              {activeTab === 'registrations' && (registrations.length > 0 || noLeaseTenants.length > 0) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-yellow-600" />
                    Registrations ({registrations.length + noLeaseTenants.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...registrations, ...noLeaseTenants].map((tenant, index) => (
                      <motion.div
                        key={tenant.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow"
                      >
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-lg font-semibold">
                              {tenant.fullName.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900">{tenant.fullName}</h4>
                              <span className="px-2 py-0.5 text-[10px] rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">Needs lease</span>
                            </div>
                            <p className="text-sm text-gray-600">{tenant.contact.email}</p>
                          </div>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-4 h-4 mr-2" />
                            {tenant.contact.phone}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            Move-in: {formatDate(tenant.moveInDate)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(tenant)}
                            className="flex-1 text-yellow-600 hover:bg-yellow-50"
                          >
                            <Edit className="w-4 h-4 mr-1" /> Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(tenant)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}

        {/* Delete Confirmation handled globally */}
      </>
    );
  }

  return (
    <>
      {/* Creation Mode Forms */}
      {creationMode === 'manual' && (
        <TenantManualForm
          formData={formData}
          onChange={setFormData}
          properties={properties}
          onSubmit={handleCreateTenant}
          onCancel={() => setCreationMode(null)}
          saving={loading}
        />
      )}

      {creationMode === 'invite' && (
        <TenantInviteForm
          formData={formData}
          onChange={setFormData}
          properties={properties}
          onSend={handleInviteTenant}
          onCancel={() => setCreationMode(null)}
          saving={loading}
        />
      )}

      {/* Preview Card */}
      {(creationMode === 'manual' || creationMode === 'invite') && (
        <TenantPreviewCard
          formData={formData}
          selectedProperty={selectedProperty}
        />
      )}

      {/* Only show tenant lists when not in creation mode */}
      {!creationMode && (
        <>
          {/* Search Bar */}
          {tenants.length > 0 && (
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search tenants by name, email, phone, or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>
          )}

          <div className="space-y-8">
        {/* Unassigned Tenants */}
        {unassignedTenants.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-orange-600" />
              Unassigned Tenants ({unassignedTenants.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {unassignedTenants.map((tenant, index) => (
                <motion.div
                  key={tenant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg font-semibold">
                        {tenant.fullName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{tenant.fullName}</h4>
                      <p className="text-sm text-gray-600">{tenant.contact.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {tenant.contact.phone}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      Move-in: {formatDate(tenant.moveInDate)}
                    </div>
                  </div>

                  {tenant.notes && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-700">{tenant.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(tenant)}
                      className="flex-1 text-yellow-600 hover:bg-yellow-50"
                    >
                      <Edit className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(tenant)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Assigned Tenants */}
        {assignedTenants.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Home className="w-5 h-5 mr-2 text-green-600" />
              Assigned Tenants ({assignedTenants.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignedTenants.map((tenant, index) => {
                const { unit, property } = getTenantAssignmentInfo(tenant);
                
                return (
                  <motion.div
                    key={tenant.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-lg font-semibold">
                          {tenant.fullName.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{tenant.fullName}</h4>
                        <p className="text-sm text-gray-600">{tenant.contact.email}</p>
                      </div>
                    </div>

                    {/* Assignment Info */}
                    {unit && property && (
                      <div className="bg-green-50 rounded-lg p-3 mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Building2 className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">{property.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">   
                          <Home className="w-4 h-4 text-green-600" />   
                          <span className="text-sm text-green-700">Unit assignment details available in property view</span>                                         
                        </div>
                        <div className="flex items-center space-x-2 mt-1">                                                                              
                          <span className="text-sm text-green-700">Rent details available in property view</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        {tenant.contact.phone}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        Move-in: {formatDate(tenant.moveInDate)}
                      </div>
                    </div>

                    {tenant.notes && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <p className="text-sm text-gray-700">{tenant.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(tenant)}
                        className="flex-1 text-yellow-600 hover:bg-yellow-50"
                      >
                        <Edit className="w-4 h-4 mr-1" /> Edit
                      </Button>
                      {unit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUnassignTenant(tenant.id, '')}
                          className="text-orange-600 hover:bg-orange-50"
                        >
                          <Home className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(tenant)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Lease Tenants */}
        {noLeaseTenants.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-yellow-600" />
              No Lease Tenants ({noLeaseTenants.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {noLeaseTenants.map((tenant, index) => (
                <motion.div
                  key={tenant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg font-semibold">
                        {tenant.fullName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{tenant.fullName}</h4>
                      <p className="text-sm text-gray-600">{tenant.contact.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {tenant.contact.phone}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      Move-in: {formatDate(tenant.moveInDate)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(tenant)}
                      className="flex-1 text-yellow-600 hover:bg-yellow-50"
                    >
                      <Edit className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(tenant)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
          </div>
        </>
      )}

      {/* Delete Confirmation now handled globally in page.tsx */}
    </>
  );
}