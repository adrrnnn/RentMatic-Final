// Export all property management services
export { PropertyService } from './propertyService';
export { UnitService } from './unitService';
export { TenantService } from './tenantService';

// Re-export types for convenience
export type {
  Property,
  Unit,
  Tenant,
  OccupancyAggregate,
  PropertyWithUnits,
  PropertyWithTenants,
  UnitWithTenant,
  CreatePropertyData,
  CreateUnitData,
  CreateTenantData,
  UpdatePropertyData,
  UpdateUnitData,
  UpdateTenantData,
  DragDropData,
  PropertyStats
} from '@/types/properties';























