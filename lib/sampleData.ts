import { PropertyService } from "@/lib/firestore/properties/propertyService";
import { TenantService } from "@/lib/firestore/properties/tenantService";
import type { CreatePropertyData, CreateTenantData } from "@/types/firestore";

export const sampleProperties: CreatePropertyData[] = [
  {
    name: "Greenfield Tower",
    address: "123 Green Street, Makati City",
    type: "Apartment",
    numberOfUnits: 20,
    description: "Modern high-rise apartment building with excellent amenities"
  },
  {
    name: "Sunset Apartments",
    address: "456 Sunset Boulevard, Quezon City",
    type: "Apartment",
    numberOfUnits: 15,
    description: "Cozy apartment complex with garden views"
  },
  {
    name: "Riverside Residences",
    address: "789 River Road, Pasig City",
    type: "Condo",
    numberOfUnits: 30,
    description: "Luxury condominium with river views"
  },
  {
    name: "Garden Villas",
    address: "321 Garden Avenue, Taguig City",
    type: "Townhouse",
    numberOfUnits: 10,
    description: "Spacious townhouses with private gardens"
  }
];

export const sampleTenants: CreateTenantData[] = [
  {
    fullName: "John Smith",
    contact: {
      email: "john.smith@email.com",
      phone: "+63 912 345 6789"
    },
    notes: "Sample tenant data"
  },
  {
    fullName: "Maria Garcia",
    contact: {
      email: "maria.garcia@email.com",
      phone: "+63 917 234 5678"
    },
    notes: "Sample tenant data"
  },
  {
    fullName: "David Johnson",
    contact: {
      email: "david.johnson@email.com",
      phone: "+63 918 345 6789"
    },
    notes: "Sample tenant data"
  },
  {
    fullName: "Sarah Wilson",
    contact: {
      email: "sarah.wilson@email.com",
      phone: "+63 919 456 7890"
    },
    notes: "Sample tenant data"
  },
  {
    fullName: "Michael Brown",
    contact: {
      email: "michael.brown@email.com",
      phone: "+63 920 567 8901"
    },
    notes: "Sample tenant data"
  },
  {
    fullName: "Lisa Davis",
    contact: {
      email: "lisa.davis@email.com",
      phone: "+63 921 678 9012"
    },
    notes: "Sample tenant data"
  },
  {
    fullName: "Robert Miller",
    contact: {
      email: "robert.miller@email.com",
      phone: "+63 922 789 0123"
    },
    notes: "Sample tenant data"
  },
  {
    fullName: "Jennifer Taylor",
    contact: {
      email: "jennifer.taylor@email.com",
      phone: "+63 923 890 1234"
    },
    notes: "Sample tenant data"
  }
];

export async function createSampleData(userId: string) {
  try {
    console.log("Creating sample data for user:", userId);
    
    // Create sample properties
    const propertyIds: string[] = [];
    for (const propertyData of sampleProperties) {
      const propertyId = await PropertyService.createProperty(userId, propertyData);
      propertyIds.push(propertyId);
      console.log("Created property:", propertyData.name);
    }
    
    // Create sample tenants
    for (const tenantData of sampleTenants) {
      const tenantId = await TenantService.createTenant(userId, tenantData);
      console.log("Created tenant:", tenantData.fullName);
    }
    
    console.log("Sample data created successfully!");
    return { propertyIds, tenantCount: sampleTenants.length };
  } catch (error) {
    console.error("Error creating sample data:", error);
    throw error;
  }
}
