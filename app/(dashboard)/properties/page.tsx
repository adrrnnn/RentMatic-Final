"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Building2, Users, MessageSquare } from "lucide-react";
import { Button } from "@/components/Button";
import { useUserStore } from "@/store/useUserStore";
import { PropertyService } from "@/lib/firestore/properties/propertyService";
import { UnitService } from "@/lib/firestore/properties/unitService";
import { TenantService } from "@/lib/firestore/properties/tenantService";
import { getClientDb } from "@/lib/firebase";
import type { Property, Unit, Tenant, CreatePropertyData, UpdatePropertyData, CreateUnitData, UpdateUnitData, CreateTenantData, UpdateTenantData } from "@/types/firestore";

// Extended tenant type with shared properties
type ExtendedTenant = Tenant & {
  isShared?: boolean;
  source?: 'user' | 'shared';
};
import { toast } from "react-hot-toast";

// Import tab components
import { PropertiesTab } from "./components/PropertiesTab";
import { TenantsTab } from "./components/TenantsTab";
import { PropertyDialog } from "./components/PropertyDialog";
const PropertyCreateWizard = dynamic(() => import("./components/PropertyCreateWizardV2").then(m => ({ default: m.PropertyCreateWizardV2 })), { ssr: false });
import { TenantDialog } from "./components/TenantDialog";

type TabType = "properties" | "tenants";

export default function PropertiesPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<TabType>("properties");
  
  // Data state
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<ExtendedTenant[]>([]);
  const [userTenantsState, setUserTenantsState] = useState<ExtendedTenant[]>([]);
  const [sharedTenantsState, setSharedTenantsState] = useState<ExtendedTenant[]>([]);
  const [hiddenSharedTenants, setHiddenSharedTenants] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [showPropertyDialog, setShowPropertyDialog] = useState(false);
  const [showTenantDialog, setShowTenantDialog] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteTenant, setConfirmDeleteTenant] = useState<ExtendedTenant | null>(null);


  // Disable hidden shared tenant mechanics (we no longer load shared tenants)
  useEffect(() => { setHiddenSharedTenants(new Set()); }, [user?.id]);

  const addHiddenSharedTenant = async (tenantId: string) => {
    if (!user?.id) return;
    const db = getClientDb();
    if (!db) return;
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    const ref = doc(db, `users/${user.id}/hiddenSharedTenants`, tenantId);
    console.log('PropertiesPage.addHiddenSharedTenant - Hiding shared tenant:', { userId: user.id, tenantId });
    await setDoc(ref, { hiddenAt: serverTimestamp() }, { merge: true });
    console.log('PropertiesPage.addHiddenSharedTenant - Hide write completed:', { tenantId });
  };

  // Disable loading of global shared tenants to avoid cross-account leakage
  const loadSharedTenants = async () => undefined;

  // Load data
  useEffect(() => {
    if (!user?.id) {
      setProperties([]);
      setTenants([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Listen to properties
    const unsubscribeProperties = PropertyService.getPropertiesListener(
      user.id,
      (newProperties) => {
        setProperties(newProperties);
        setLoading(false);
      }
    );

    // Listen to all units across all properties
    const unsubscribeUnits = UnitService.getAllUnitsListener(
      user.id,
      (newUnits) => {
        setUnits(newUnits);
      }
    );

    // Listen to tenants from both user's collection and shared collection
    const unsubscribeUserTenants = TenantService.getTenantsListener(
      user.id,
      (userTenants) => {
        // store user tenants; merging is handled in separate effect
        const marked = userTenants.map(t => ({ ...t, isShared: false as const, source: 'user' as const }));
        setUserTenantsState(marked as ExtendedTenant[]);
      }
    );

    // Do not subscribe to shared tenants anymore
    let unsubscribeShared: (() => void) | undefined;

    return () => {
      unsubscribeProperties();
      unsubscribeUnits();
      unsubscribeUserTenants();
      if (unsubscribeShared) unsubscribeShared();
    };
  }, [user?.id]);

  // Only use the authenticated user's tenants
  useEffect(() => {
    setTenants(userTenantsState);
  }, [userTenantsState]);

  // Tab configuration
  const tabs = [
    {
      id: "properties" as TabType,
      label: "Properties",
      icon: Building2,
      count: properties.length
    },
    {
      id: "tenants" as TabType,
      label: "Tenants",
      icon: Users,
      count: tenants.length
    }
  ];

  // Property handlers
  const handleCreateProperty = () => {
    setEditingProperty(null);
    setShowPropertyDialog(true);
  };

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setShowPropertyDialog(true);
  };

  const handleViewProperty = (property: Property) => {
    router.push(`/properties/property-detail?id=${property.id}`);
  };

  const handleSaveProperty = async (data: CreatePropertyData | UpdatePropertyData) => {
    if (!user?.id) {
      console.error("No user ID available");
      return;
    }
    
    console.log("Starting to save property:", { data, editingProperty: !!editingProperty });
    setSaving(true);
    
    try {
      if (editingProperty) {
        console.log("Updating existing property...");
        await PropertyService.updateProperty(user.id, editingProperty.id, data as UpdatePropertyData);
        toast.success("Property updated successfully!");
      } else {
        console.log("Creating new property...");
        await PropertyService.createProperty(user.id, data as CreatePropertyData);
        toast.success("Property created successfully!");
      }
      
      console.log("Property saved successfully, closing dialog");
      setShowPropertyDialog(false);
      setEditingProperty(null);
    } catch (error) {
      console.error("Failed to save property:", error);
      toast.error("Failed to save property. Please try again.");
    } finally {
      console.log("Setting saving to false");
      setSaving(false);
    }
  };

  const handleDeleteProperty = async (property: Property) => {
    if (!user?.id) return;
    try {
      await PropertyService.deleteProperty(user.id, property.id);
      toast.success("Property deleted successfully!");
    } catch (error) {
      console.error("Failed to delete property:", error);
      toast.error("Failed to delete property. Please try again.");
    }
  };


  // Tenant handlers
  const handleCreateTenant = () => {
    setEditingTenant(null);
    setShowTenantDialog(true);
  };

  const handleCreateTenantFromForm = async (data: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    propertyId: string;
    moveInDate: string;
    rentType: string;
    notes: string;
    // Lease fields from TenantsTab form
    leaseStartDate?: string;
    leaseEndDate?: string;
    leaseTerms?: string;
    securityDeposit?: string;
  }) => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      const tenantData: CreateTenantData = {
        fullName: data.fullName,
        contact: {
          email: data.email,
          phone: data.phone
        },
        moveInDate: data.moveInDate || undefined,
        notes: data.notes || undefined,
        propertyId: data.propertyId || undefined,
        // Persist lease fields (dates as ISO strings)
        leaseStartDate: data.leaseStartDate ? new Date(data.leaseStartDate + 'T00:00:00').toISOString() : undefined,
        leaseEndDate: data.leaseEndDate ? new Date(data.leaseEndDate + 'T00:00:00').toISOString() : undefined,
        leaseTerms: data.leaseTerms || undefined,
        securityDeposit: data.securityDeposit !== undefined && data.securityDeposit !== '' ? Number(data.securityDeposit) : undefined,
      };

      await TenantService.createTenant(user.id, tenantData);
      toast.success("Tenant created successfully!");
    } catch (error) {
      console.error("Error creating tenant:", error);
      toast.error("Failed to create tenant");
    } finally {
      setSaving(false);
    }
  };

  const handleInviteTenant = async (email: string, message?: string) => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      // Generate registration link
      const baseUrl = window.location.origin;
      // Include landlordId so registration is scoped correctly; optional property prefill
      const registrationLink = `${baseUrl}/tenant-portal?code=TENANTINVITE123&landlord=${encodeURIComponent(user.id)}`;
      
      // Import email service dynamically to avoid SSR issues
      const { emailService } = await import('@/lib/services/emailService');
      
      const success = await emailService.sendTenantInvitation({
        email,
        message,
        registrationLink,
        landlordName: user.name || 'Property Manager',
        landlordEmail: user.email || 'noreply@rentmatic.com'
      });
      
      if (success) {
        toast.success(`Invitation sent to ${email}`);
      } else {
        toast.error("Failed to send invitation. Please try again.");
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("Failed to send invitation. Please check your email configuration.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditTenant = (tenant: ExtendedTenant) => {
    setEditingTenant(tenant);
    setShowTenantDialog(true);
  };

  const handleSaveTenant = async (data: CreateTenantData | UpdateTenantData) => {
    if (!user?.id) return;
    
    // Debug: Log what we're trying to save
    console.log('PropertiesPage.handleSaveTenant - Saving tenant data:', {
      editingTenant: editingTenant?.id,
      data,
      leaseStartDate: (data as UpdateTenantData).leaseStartDate,
      leaseEndDate: (data as UpdateTenantData).leaseEndDate,
      leaseTerms: (data as UpdateTenantData).leaseTerms,
      securityDeposit: (data as UpdateTenantData).securityDeposit
    });
    
    // Debug: Check if this tenant is in shared collection
    const currentTenants = tenants;
    const isInShared = currentTenants.some(t => t.id === editingTenant?.id && t.propertyId === null);
    console.log('PropertiesPage.handleSaveTenant - Tenant source check:', { 
      tenantId: editingTenant?.id, 
      isInShared,
      currentTenantData: currentTenants.find(t => t.id === editingTenant?.id)
    });
    
    setSaving(true);
    try {
      if (editingTenant) {
        // Check if this is a shared tenant that needs to be moved to user collection
        const isSharedTenant = tenants.some(t => t.id === editingTenant.id && t.propertyId === null);
        
        if (isSharedTenant) {
          console.log('PropertiesPage.handleSaveTenant - Moving shared tenant to user collection');
          // Create new tenant in user collection with updated data
          // Filter out undefined values to avoid Firestore validation errors
          const updateData = data as UpdateTenantData;
          const tenantData: CreateTenantData = {
            fullName: updateData.fullName || '',
            contact: updateData.contact || { email: '', phone: '' }
          };
          
          // Only add fields that have values
          if (updateData.moveInDate) tenantData.moveInDate = updateData.moveInDate;
          if (updateData.notes) tenantData.notes = updateData.notes;
          if (updateData.leaseStartDate) tenantData.leaseStartDate = updateData.leaseStartDate;
          if (updateData.leaseEndDate) tenantData.leaseEndDate = updateData.leaseEndDate;
          if (updateData.leaseTerms) tenantData.leaseTerms = updateData.leaseTerms;
          if (updateData.securityDeposit) tenantData.securityDeposit = updateData.securityDeposit;
          if (updateData.unitId) tenantData.unitId = updateData.unitId;
          if (updateData.propertyId) tenantData.propertyId = updateData.propertyId;
          
          await TenantService.createTenant(user.id, tenantData);
          
          // Note: We can't delete from shared-tenants due to permissions
          // Instead, we'll filter out duplicates in the UI
          console.log('PropertiesPage.handleSaveTenant - Created tenant in user collection, shared tenant will be filtered out');
          
          toast.success("Tenant moved to your collection and updated successfully!");
        } else {
          // Regular update for user tenants
          await TenantService.updateTenant(user.id, editingTenant.id, data as UpdateTenantData);
          toast.success("Tenant updated successfully!");
        }
      } else {
        await TenantService.createTenant(user.id, data as CreateTenantData);
        toast.success("Tenant created successfully!");
      }
      setShowTenantDialog(false);
      setEditingTenant(null);
    } catch (error) {
      console.error("Failed to save tenant:", error);
      toast.error("Failed to save tenant. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTenant = async (tenant: ExtendedTenant) => {
    console.log('PropertiesPage.handleDeleteTenant - Starting deletion:', {
      tenantId: tenant.id,
      tenantName: tenant.fullName,
      isShared: tenant.isShared,
      userId: user?.id,
      tenantType: typeof tenant
    });

    if (!user?.id) {
      console.error('PropertiesPage.handleDeleteTenant - No user ID');
      return;
    }

    try {
      // If tenant is assigned to a unit, unassign first so the unit becomes Available
      try {
        const assignedPropertyId = tenant.propertyId ?? undefined;
        const assignedUnitId = tenant.unitId ?? undefined;
        if (assignedPropertyId && assignedUnitId) {
          console.log('PropertiesPage.handleDeleteTenant - Unassigning tenant from unit before delete', {
            tenantId: tenant.id,
            propertyId: assignedPropertyId,
            unitId: assignedUnitId
          });
          await UnitService.unassignTenantFromUnit(user.id, assignedPropertyId, assignedUnitId);
        } else {
          // Fallback: units are now handled per-property in property detail view
          console.log('PropertiesPage.handleDeleteTenant - No unit assignment found, tenant will be deleted without unassignment');
        }
      } catch (e) {
        console.warn('PropertiesPage.handleDeleteTenant - Unassign step failed (continuing with delete):', e);
      }
      // Note: shared tenants no longer exist since tenants are scoped per user
      // ALWAYS try to delete from the user's collection first
      console.log('PropertiesPage.handleDeleteTenant - Attempting to delete tenant from user collection:', tenant.id);
      await TenantService.deleteTenant(user.id, tenant.id);
      console.log('PropertiesPage.handleDeleteTenant - Tenant deleted successfully from user collection');
      
      // Force refresh the tenant list by removing the deleted tenant from local state
      setTenants(prevTenants => {
        const updatedTenants = prevTenants.filter(t => t.id !== tenant.id);
        console.log('PropertiesPage.handleDeleteTenant - Updated local tenant list:', {
          before: prevTenants.length,
          after: updatedTenants.length,
          deletedTenantId: tenant.id
        });
        return updatedTenants;
      });
      // Note: shared-tenants collection removed - no longer needed since tenants are scoped per user
      
      toast.success("Tenant deleted successfully!");
    } catch (error) {
      console.error("PropertiesPage.handleDeleteTenant - Failed to delete tenant:", error);
      
      toast.error("Failed to delete tenant. Please try again.");
    }
  };

  // Drag and drop handlers
  const handleAssignTenant = async (tenantId: string, propertyId: string, unitId: string) => {
    if (!user?.id) return;
    try {
      await UnitService.assignTenantToUnit(user.id, tenantId, propertyId, unitId);
      toast.success("Tenant assigned to unit successfully!");
    } catch (error) {
      console.error("Failed to assign tenant:", error);
      toast.error("Failed to assign tenant. Please try again.");
    }
  };

  const handleUnassignTenant = async (tenantId: string, unitId: string) => {
    if (!user?.id) return;
    try {
      // Find the propertyId from the tenant data
      const tenant = tenants.find(t => t.id === tenantId);
      if (!tenant?.propertyId) {
        throw new Error("Tenant not found or missing propertyId");
      }
      await UnitService.unassignTenantFromUnit(user.id, tenant.propertyId, unitId);
      toast.success("Tenant unassigned successfully!");
    } catch (error) {
      console.error("Failed to unassign tenant:", error);
      toast.error("Failed to unassign tenant. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 h-48"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-10">
          <h3 className="text-xl font-semibold text-red-600 mb-2">Error Loading Data</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Version marker for deployment verification
  console.log('PropertiesPage - Build version:', 'wiz-maplibre-geo-accuracy-2025-10-16-02');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Property Management</h1>
          <p className="text-gray-600 mt-1">Manage your properties, units, and tenants · v wiz-maplibre-geo-accuracy-2025-10-16-02</p>
        </div>
            <div className="flex space-x-3">
              {activeTab === "properties" && (
                <Button onClick={handleCreateProperty} className="bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="w-4 h-4 mr-2" /> Add Property
                </Button>
              )}
            </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === "properties" && (
          <PropertiesTab
            properties={properties}
            units={units}
            onEdit={handleEditProperty}
            onDelete={handleDeleteProperty}
            onView={handleViewProperty}
            onCreate={handleCreateProperty}
            loading={loading}
          />
        )}
        
        {activeTab === "tenants" && (
          <TenantsTab
            tenants={tenants}
            properties={properties}
            onEdit={handleEditTenant}
            onDelete={(tenant) => setConfirmDeleteTenant(tenant)}
            onAssignTenant={handleAssignTenant}
            onUnassignTenant={handleUnassignTenant}
            onCreate={handleCreateTenant}
            onSaveTenant={handleCreateTenantFromForm}
            onInviteTenant={handleInviteTenant}
            loading={loading}
          />
        )}
        
      </motion.div>

      {/* Dialogs */}
      {/* New PH-focused property creation wizard (replaces simple dialog when creating) */}
      {showPropertyDialog && !editingProperty && (
        <PropertyCreateWizard
          isOpen={showPropertyDialog}
          onClose={() => {
            setShowPropertyDialog(false);
            setEditingProperty(null);
          }}
          onCreate={async (data) => {
            if (!user?.id) return;
            setSaving(true);
            try {
              await PropertyService.createProperty(user.id, data);
              toast.success("Property created successfully!");
              setShowPropertyDialog(false);
            } catch (e) {
              console.error(e);
              toast.error("Failed to create property");
            } finally {
              setSaving(false);
            }
          }}
        />
      )}

      {/* Keep existing dialog for editing properties */}
      {showPropertyDialog && editingProperty && (
        <PropertyDialog
          isOpen={showPropertyDialog}
          onClose={() => {
            setShowPropertyDialog(false);
            setEditingProperty(null);
          }}
          onSave={handleSaveProperty}
          property={editingProperty}
          loading={saving}
          userId={user?.id}
        />
      )}


          {showTenantDialog && (
            <TenantDialog
              isOpen={showTenantDialog}
              onClose={() => {
                setShowTenantDialog(false);
                setEditingTenant(null);
              }}
              onSave={handleSaveTenant}
              tenant={editingTenant}
              units={[]}
              properties={properties}
              loading={saving}
              userId={user?.id}
            />
          )}

      {/* Global Delete Confirmation Dialog for Tenants */}
      {confirmDeleteTenant && (
        <div data-testid="delete-dialog" className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]" onClick={() => setConfirmDeleteTenant(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Tenant</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete &quot;{confirmDeleteTenant.fullName}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmDeleteTenant(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  const t = confirmDeleteTenant;
                  setConfirmDeleteTenant(null);
                  if (t) await handleDeleteTenant(t);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

        </motion.div>
      );
    }