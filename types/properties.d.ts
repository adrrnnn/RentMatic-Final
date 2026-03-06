export interface Property {
  id: string;
  name: string;
  address: string;
  description?: string;
  imageUrl?: string;
  totalUnits: number;
  occupiedCount: number;
  createdAt: string;
  updatedAt: string;
  monthlyIncomeEstimate: number;
}

export interface Unit {
  id: string;
  unitNumber: string;
  rentAmount: number;
  status: 'vacant' | 'occupied' | 'maintenance';
  tenantId?: string | null;
  leaseStart?: string | null;
  leaseEnd?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  assignedPropertyId?: string | null;
  assignedUnitId?: string | null;
  monthlyRent?: number | null;
  leaseStart?: string | null;
  leaseEnd?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OccupancyAggregate {
  lastUpdated: string;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  monthlyIncome: number;
}

export interface PropertyWithUnits extends Property {
  units: Unit[];
}

export interface PropertyWithTenants extends Property {
  tenants: Tenant[];
}

export interface UnitWithTenant extends Unit {
  tenant?: Tenant;
}

export interface CreatePropertyData {
  name: string;
  address: string;
  description?: string;
  imageUrl?: string;
  generateUnits?: number;
}

export interface CreateUnitData {
  unitNumber: string;
  rentAmount: number;
  status?: 'vacant' | 'occupied' | 'maintenance';
}

export interface CreateTenantData {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  monthlyRent?: number;
  leaseStart?: string;
  leaseEnd?: string;
}

export interface UpdatePropertyData {
  name?: string;
  address?: string;
  description?: string;
  imageUrl?: string;
}

export interface UpdateUnitData {
  unitNumber?: string;
  rentAmount?: number;
  status?: 'vacant' | 'occupied' | 'maintenance';
  tenantId?: string | null;
  leaseStart?: string | null;
  leaseEnd?: string | null;
}

export interface UpdateTenantData {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
  assignedPropertyId?: string | null;
  assignedUnitId?: string | null;
  monthlyRent?: number | null;
  leaseStart?: string | null;
  leaseEnd?: string | null;
}

export interface DragDropData {
  type: 'tenant';
  tenantId: string;
  tenantName: string;
}

export interface PropertyStats {
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  maintenanceUnits: number;
  occupancyRate: number;
  monthlyIncome: number;
}























