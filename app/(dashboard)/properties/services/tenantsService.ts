import { TenantService } from "@/lib/firestore/properties/tenantService";
import type { Tenant, CreateTenantData, UpdateTenantData } from "@/types/firestore";

export class TenantsService {
  /**
   * Get all tenants for a user with real-time updates
   */
  static getTenantsListener(
    userId: string,
    callback: (tenants: Tenant[]) => void
  ): () => void {
    return TenantService.getTenantsListener(userId, callback);
  }

  /**
   * Get tenants assigned to a specific property
   */
  static getPropertyTenantsListener(
    userId: string,
    propertyId: string,
    callback: (tenants: Tenant[]) => void
  ): () => void {
    return TenantService.getPropertyTenantsListener(userId, propertyId, callback);
  }

  /**
   * Create a new tenant
   */
  static async createTenant(
    userId: string,
    tenantData: CreateTenantData
  ): Promise<string> {
    return TenantService.createTenant(userId, tenantData);
  }

  /**
   * Update an existing tenant
   */
  static async updateTenant(
    userId: string,
    tenantId: string,
    updates: UpdateTenantData
  ): Promise<void> {
    return TenantService.updateTenant(userId, tenantId, updates);
  }

  /**
   * Delete a tenant
   */
  static async deleteTenant(userId: string, tenantId: string): Promise<void> {
    return TenantService.deleteTenant(userId, tenantId);
  }

  /**
   * Get a single tenant
   */
  static async getTenant(userId: string, tenantId: string): Promise<Tenant | null> {
    return TenantService.getTenant(userId, tenantId);
  }

  /**
   * Get all tenants for a user
   */
  static async getTenants(userId: string): Promise<Tenant[]> {
    return TenantService.getTenants(userId);
  }

  /**
   * Get tenants assigned to a specific property
   */
  static async getTenantsByProperty(userId: string, propertyId: string): Promise<Tenant[]> {
    return TenantService.getTenantsByProperty(userId, propertyId);
  }

  /**
   * Get unassigned tenants
   */
  static async getUnassignedTenants(userId: string): Promise<Tenant[]> {
    return TenantService.getUnassignedTenants(userId);
  }
}


