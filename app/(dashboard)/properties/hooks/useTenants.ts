"use client";

import { useState, useEffect } from "react";
import { useUserStore } from "@/store/useUserStore";
import { TenantsService } from "../services/tenantsService";
import type { Tenant, CreateTenantData, UpdateTenantData } from "@/types/firestore";

export function useTenants(filterByProperty?: string) {
  const { user } = useUserStore();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setTenants([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let unsubscribe: () => void;

    if (filterByProperty) {
      // Listen to tenants for a specific property
      unsubscribe = TenantsService.getPropertyTenantsListener(
        user.id,
        filterByProperty,
        (newTenants) => {
          setTenants(newTenants);
          setLoading(false);
          setError(null);
        }
      );
    } else {
      // Listen to all tenants
      unsubscribe = TenantsService.getTenantsListener(
        user.id,
        (newTenants) => {
          setTenants(newTenants);
          setLoading(false);
          setError(null);
        }
      );
    }

    return () => {
      unsubscribe();
    };
  }, [user?.id, filterByProperty]);

  const createTenant = async (tenantData: CreateTenantData) => {
    if (!user?.id) throw new Error("User not authenticated");
    
    try {
      setError(null);
      return await TenantsService.createTenant(user.id, tenantData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create tenant";
      setError(errorMessage);
      throw err;
    }
  };

  const updateTenant = async (tenantId: string, updates: UpdateTenantData) => {
    if (!user?.id) throw new Error("User not authenticated");
    
    try {
      setError(null);
      return await TenantsService.updateTenant(user.id, tenantId, updates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update tenant";
      setError(errorMessage);
      throw err;
    }
  };

  const deleteTenant = async (tenantId: string) => {
    if (!user?.id) throw new Error("User not authenticated");
    
    try {
      setError(null);
      return await TenantsService.deleteTenant(user.id, tenantId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete tenant";
      setError(errorMessage);
      throw err;
    }
  };

  return {
    tenants,
    loading,
    error,
    createTenant,
    updateTenant,
    deleteTenant
  };
}


