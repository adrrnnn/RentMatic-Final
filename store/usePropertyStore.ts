import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Property, Tenant } from "@/types/firestore";
import { PropertyService } from "@/lib/firestore/properties/propertyService";
import { TenantService } from "@/lib/firestore/properties/tenantService";

interface PropertyState {
  // Properties
  properties: Property[];
  propertiesLoading: boolean;
  
  // Tenants
  tenants: Tenant[];
  unassignedTenants: Tenant[];
  tenantsLoading: boolean;
  
  // Actions
  setProperties: (properties: Property[]) => void;
  setPropertiesLoading: (loading: boolean) => void;
  setTenants: (tenants: Tenant[]) => void;
  setUnassignedTenants: (tenants: Tenant[]) => void;
  setTenantsLoading: (loading: boolean) => void;
  
  // Property CRUD
  addProperty: (property: Property) => void;
  updateProperty: (propertyId: string, updates: Partial<Property>) => void;
  removeProperty: (propertyId: string) => void;
  
  // Tenant CRUD
  addTenant: (tenant: Tenant) => void;
  updateTenant: (tenantId: string, updates: Partial<Tenant>) => void;
  removeTenant: (tenantId: string) => void;
  
  // Assignment operations
  assignTenantToProperty: (tenantId: string, propertyId: string) => void;
  unassignTenantFromProperty: (tenantId: string) => void;
  
  // Initialize data
  initializeData: (userId: string) => void;
  cleanup: () => void;
}

export const usePropertyStore = create<PropertyState>()(
  persist(
    (set, get) => ({
      // Initial state
      properties: [],
      propertiesLoading: false,
      tenants: [],
      unassignedTenants: [],
      tenantsLoading: false,
      
      // Setters
      setProperties: (properties) => set({ properties }),
      setPropertiesLoading: (loading) => set({ propertiesLoading: loading }),
      setTenants: (tenants) => set({ tenants }),
      setUnassignedTenants: (tenants) => set({ unassignedTenants: tenants }),
      setTenantsLoading: (loading) => set({ tenantsLoading: loading }),
      
      // Property CRUD
      addProperty: (property) => set((state) => ({ 
        properties: [property, ...state.properties] 
      })),
      
      updateProperty: (propertyId, updates) => set((state) => ({
        properties: state.properties.map(property => 
          property.id === propertyId 
            ? { ...property, ...updates }
            : property
        )
      })),
      
      removeProperty: (propertyId) => set((state) => ({
        properties: state.properties.filter(property => property.id !== propertyId)
      })),
      
      // Tenant CRUD
      addTenant: (tenant) => set((state) => ({ 
        tenants: [tenant, ...state.tenants],
        unassignedTenants: !tenant.propertyId 
          ? [tenant, ...state.unassignedTenants]
          : state.unassignedTenants
      })),
      
      updateTenant: (tenantId, updates) => set((state) => {
        const updatedTenants = state.tenants.map(tenant => 
          tenant.id === tenantId 
            ? { ...tenant, ...updates }
            : tenant
        );
        
        // Update unassigned tenants list
        const updatedUnassignedTenants = updatedTenants.filter(tenant => !tenant.propertyId);
        
        return {
          tenants: updatedTenants,
          unassignedTenants: updatedUnassignedTenants
        };
      }),
      
      removeTenant: (tenantId) => set((state) => ({
        tenants: state.tenants.filter(tenant => tenant.id !== tenantId),
        unassignedTenants: state.unassignedTenants.filter(tenant => tenant.id !== tenantId)
      })),
      
      // Assignment operations
      assignTenantToProperty: (tenantId, propertyId) => set((state) => {
        const updatedTenants = state.tenants.map(tenant => 
          tenant.id === tenantId 
            ? { ...tenant, propertyId: propertyId }
            : tenant
        );
        
        // Remove from unassigned list and update property occupancy
        const updatedUnassignedTenants = state.unassignedTenants.filter(tenant => tenant.id !== tenantId);
        
        // Update property occupancy count
        const updatedProperties = state.properties.map(property => 
          property.id === propertyId 
            ? { ...property, numberOfUnits: property.numberOfUnits }
            : property
        );
        
        return {
          tenants: updatedTenants,
          unassignedTenants: updatedUnassignedTenants,
          properties: updatedProperties
        };
      }),
      
      unassignTenantFromProperty: (tenantId) => set((state) => {
        const tenant = state.tenants.find(t => t.id === tenantId);
        if (!tenant) return state;
        
        const updatedTenants = state.tenants.map(t => 
          t.id === tenantId 
            ? { ...t, propertyId: null }
            : t
        );
        
        // Add back to unassigned list
        const updatedUnassignedTenants = [
          { ...tenant, propertyId: null },
          ...state.unassignedTenants
        ];
        
        // Update property occupancy count
        const updatedProperties = state.properties.map(property => 
          property.id === tenant.propertyId 
            ? { ...property, numberOfUnits: property.numberOfUnits }
            : property
        );
        
        return {
          tenants: updatedTenants,
          unassignedTenants: updatedUnassignedTenants,
          properties: updatedProperties
        };
      }),
      
      // Initialize data with real-time listeners
      initializeData: (userId) => {
        const state = get();
        
        console.log("Initializing property store for user:", userId);
        
        // Set loading states
        state.setPropertiesLoading(true);
        state.setTenantsLoading(true);
        
        // Set up properties listener
        const unsubscribeProperties = PropertyService.getPropertiesListener(userId, (properties) => {
          console.log("Properties received:", properties);
          state.setProperties(properties);
          state.setPropertiesLoading(false);
        });
        
        // Set up tenants listener
        const unsubscribeTenants = TenantService.getTenantsListener(userId, (tenants) => {
          console.log("Tenants received:", tenants);
          state.setTenants(tenants);
          state.setTenantsLoading(false);
          
          // Update unassigned tenants
          const unassigned = tenants.filter(tenant => !tenant.propertyId);
          state.setUnassignedTenants(unassigned);
        });
        
        // Add fallback timeout to prevent infinite loading
        setTimeout(() => {
          const currentState = get();
          if (currentState.propertiesLoading || currentState.tenantsLoading) {
            console.log("Firestore listeners timeout - setting loading to false");
            state.setPropertiesLoading(false);
            state.setTenantsLoading(false);
          }
        }, 5000); // 5 second fallback
        
        // Store unsubscribe functions for cleanup
        set({ 
          // @ts-ignore - storing unsubscribe functions for cleanup
          _unsubscribeProperties: unsubscribeProperties,
          _unsubscribeTenants: unsubscribeTenants
        });
      },
      
      // Cleanup listeners
      cleanup: () => {
        set({ 
          properties: [], 
          tenants: [], 
          unassignedTenants: [],
          propertiesLoading: false,
          tenantsLoading: false
        });
      }
    }),
    {
      name: 'rentmatic-property-store',
      partialize: (state) => ({ 
        // Only persist essential data, not loading states or listeners
        properties: state.properties,
        tenants: state.tenants,
        unassignedTenants: state.unassignedTenants
      }),
    }
  )
);
