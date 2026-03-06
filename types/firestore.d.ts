// RentMatic Property Management System Data Types

export interface Property {
  id: string;
  name: string;
  address: string;
  type: string; // Apartment, Condo, Commercial, etc.
  numberOfUnits: number;
  description?: string;
  imageURL?: string;
  manager?: string;
  createdAt: string;
  updatedAt: string;
  // PH-focused optional fields
  addressPH?: {
    province?: string;
    city?: string;
    barangay?: string;
    subdivision?: string;
    street?: string;
    zip?: string;
    lat?: number;
    lng?: number;
  };
  association?: {
    name?: string;
    duesPayer?: 'Landlord' | 'Tenant';
  };
  compliance?: {
    dhsudRef?: string;
    occupancyPermitNo?: string;
    fsicExpiry?: string; // ISO date
  };
  management?: {
    managerName?: string;
    email?: string;
    phone?: string;
    viber?: boolean;
    whatsapp?: boolean;
    issueOR?: boolean;
    orSeries?: string;
    nextOrNo?: string;
    acceptsEWT?: boolean;
    vatRegistered?: boolean;
    percentageTaxRegistered?: boolean;
  };
  payments?: {
    wallets?: { type: 'GCash' | 'Maya'; accountName?: string; accountNo?: string; qrUrl?: string }[];
    banks?: { bank: string; accountName?: string; accountNo?: string }[];
    currency?: 'PHP';
  };
  paymentMethods?: {
    id: string;
    type: 'ewallet' | 'bank' | 'card' | 'retail' | 'cash';
    name: string;
    description: string;
    icon: string;
    enabled: boolean;
    fees?: {
      percentage?: number;
      fixed?: number;
    };
  }[];
  billingDefaults?: {
    dueDay?: number; // 1-31
    graceDays?: number;
    lateFeeType?: 'flat' | 'percent';
    lateFeeValue?: number;
    reminderDaysBefore?: number[]; // e.g., [3,1]
  };
  amenities?: string[];
  policies?: { pets?: string; smoking?: string; guest?: string; curfew?: string; noise?: string; parking?: string };
  tags?: string[];
}

export interface Room {
  id: string;
  name: string; // e.g., "Bedroom 1", "Living Room", "Kitchen"
  type: "bedroom" | "bathroom" | "living_room" | "kitchen" | "dining_room" | "balcony" | "other";
  imageURL?: string;
  description?: string;
}

export interface Unit {
  id: string;
  name: string; // Unit number/name
  propertyId: string;
  floor: string;
  rentType: "Monthly" | "Quarterly" | "Yearly" | "Nightly";
  rentAmount: number;
  status: "Available" | "Occupied" | "Under Maintenance";
  description?: string;
  imageURL?: string; // Profile image for the unit
  rooms?: Room[]; // Array of rooms with their images
  tenantId?: string | null;
  createdAt: string;
  updatedAt: string;
  // Unit-specific billing settings
  billingSettings?: {
    dueDay: number; // Day of month when rent is due (1-31)
    graceDays: number; // Days after due date before late fee applies
    lateFeeType: 'flat' | 'percent'; // Type of late fee
    lateFeeValue: number; // Amount or percentage of late fee
    reminderDaysBefore: number[]; // Days before due date to send reminders
    autoSendReminders: boolean;
    currency: 'PHP';
    customDueDate?: string; // For non-monthly rent types
  };
}

export interface Tenant {
  id: string;
  fullName: string;
  contact: {
    email: string;
    phone: string;
  };
  moveInDate?: string;
  notes?: string;
  unitId?: string | null;
  propertyId?: string | null;
  // Lease information
  leaseStartDate?: string;
  leaseEndDate?: string;
  leaseTerms?: string;
  securityDeposit?: number;
  createdAt: string;
  updatedAt: string;
}

// Create/Update data types
export interface CreatePropertyData {
  name: string;
  address: string;
  type: string;
  numberOfUnits: number;
  description?: string;
  imageURL?: string;
  manager?: string;
  // Optional PH fields
  addressPH?: Property['addressPH'];
  association?: Property['association'];
  compliance?: Property['compliance'];
  management?: Property['management'];
  payments?: Property['payments'];
  billingDefaults?: Property['billingDefaults'];
  amenities?: Property['amenities'];
  policies?: Property['policies'];
  tags?: Property['tags'];
}

export interface UpdatePropertyData {
  name?: string;
  address?: string;
  type?: string;
  numberOfUnits?: number;
  description?: string;
  imageURL?: string;
  manager?: string;
  // Optional PH fields
  addressPH?: Property['addressPH'];
  association?: Property['association'];
  compliance?: Property['compliance'];
  management?: Property['management'];
  payments?: Property['payments'];
  paymentMethods?: Property['paymentMethods'];
  billingDefaults?: Property['billingDefaults'];
  amenities?: Property['amenities'];
  policies?: Property['policies'];
  tags?: Property['tags'];
}

export interface CreateUnitData {
  name: string;
  propertyId: string;
  floor: string;
  rentType: "Monthly" | "Quarterly" | "Yearly" | "Nightly";
  rentAmount: number;
  status?: "Available" | "Occupied" | "Under Maintenance";
  description?: string;
  imageURL?: string;
  rooms?: Room[];
  billingSettings?: Unit['billingSettings'];
}

export interface UpdateUnitData {
  name?: string;
  floor?: string;
  rentType?: "Monthly" | "Quarterly" | "Yearly" | "Nightly";
  rentAmount?: number;
  status?: "Available" | "Occupied" | "Under Maintenance";
  description?: string;
  imageURL?: string;
  rooms?: Room[];
  tenantId?: string | null;
  billingSettings?: Unit['billingSettings'];
}

export interface CreateTenantData {
  fullName: string;
  contact: {
    email: string;
    phone: string;
  };
  moveInDate?: string;
  notes?: string;
  unitId?: string | null;
  propertyId?: string | null;
  // Lease information
  leaseStartDate?: string;
  leaseEndDate?: string;
  leaseTerms?: string;
  securityDeposit?: number;
}

export interface UpdateTenantData {
  fullName?: string;
  contact?: {
    email: string;
    phone: string;
  };
  moveInDate?: string;
  notes?: string;
  unitId?: string | null;
  propertyId?: string | null;
  // Lease information
  leaseStartDate?: string;
  leaseEndDate?: string;
  leaseTerms?: string;
  securityDeposit?: number;
}

// Extended types for UI
export interface PropertyWithUnits extends Property {
  units: Unit[];
}

export interface UnitWithTenant extends Unit {
  tenant?: Tenant | null;
}

export interface TenantWithAssignment extends Tenant {
  assignedUnit?: Unit | null;
  assignedProperty?: Property | null;
}

// Drag and drop types
export interface DragDropData {
  type: 'tenant';
  tenantId: string;
  tenantName: string;
}

// Assignment result
export interface AssignmentResult {
  success: boolean;
  message: string;
  unitId?: string;
  tenantId?: string;
}

  type: 'tenant';
  tenantId: string;
  tenantName: string;
}

// Assignment result
export interface AssignmentResult {
  success: boolean;
  message: string;
  unitId?: string;
  tenantId?: string;
}
