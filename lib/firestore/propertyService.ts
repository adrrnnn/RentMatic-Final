"use client";

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  runTransaction,
  increment,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase";

export interface Unit {
  id: string;
  unitNumber: string;
  status: "vacant" | "occupied";
  tenantId: string | null;
  tenantName?: string;
  rentAmount?: number;
  propertyId?: string;
  notes?: string;
}

export interface Property {
  id: string;
  buildingName: string;
  address: string;
  totalUnits: number;
  status: "Active" | "Maintenance" | "Inactive";
  occupiedUnits: number;
  description?: string;
  imageUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreatePropertyData {
  buildingName: string;
  address: string;
  totalUnits: number;
  status: "Active" | "Maintenance" | "Inactive";
  description?: string;
  imageUrl?: string;
}

export interface UpdatePropertyData extends Partial<CreatePropertyData> {
  updatedAt: Timestamp;
}

export class PropertyService {
  private static instance: PropertyService;
  private unsubscribeFunctions: (() => void)[] = [];

  static getInstance(): PropertyService {
    if (!PropertyService.instance) {
      PropertyService.instance = new PropertyService();
    }
    return PropertyService.instance;
  }

  // Get all properties for a user
  async getProperties(userId: string): Promise<Property[]> {
    try {
      const db = getClientDb();
      if (!db) throw new Error("Firestore not available on server/SSG");
      const propertiesRef = collection(db, "users", userId, "properties");
      const q = query(propertiesRef, orderBy("createdAt", "desc"));
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Property[];
    } catch (error) {
      console.error("Error fetching properties:", error);
      throw error;
    }
  }

  // Get a single property
  async getProperty(userId: string, propertyId: string): Promise<Property | null> {
    try {
      const db = getClientDb();
      if (!db) throw new Error("Firestore not available on server/SSG");
      const propertyRef = doc(db, "users", userId, "properties", propertyId);
      const propertySnap = await getDoc(propertyRef);
      
      if (propertySnap.exists()) {
        return {
          id: propertySnap.id,
          ...propertySnap.data()
        } as Property;
      }
      return null;
    } catch (error) {
      console.error("Error fetching property:", error);
      throw error;
    }
  }

  // Create a new property
  async createProperty(userId: string, propertyData: CreatePropertyData): Promise<string> {
    try {
      const db = getClientDb();
      if (!db) throw new Error("Firestore not available on server/SSG");
      const propertiesRef = collection(db, "users", userId, "properties");
      const newProperty = {
        ...propertyData,
        occupiedUnits: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(propertiesRef, newProperty);

      // Automatically create empty units
      await this.createUnitsForProperty(userId, docRef.id, propertyData.totalUnits);

      return docRef.id;
    } catch (error) {
      console.error("Error creating property:", error);
      throw error;
    }
  }

  // Create units for a property
  private async createUnitsForProperty(userId: string, propertyId: string, totalUnits: number): Promise<void> {
    try {
      const db = getClientDb();
      if (!db) throw new Error("Firestore not available on server/SSG");
      const unitsRef = collection(db, "users", userId, "properties", propertyId, "units");
      
      // Create units in batches for better performance
      const unitPromises = [];
      for (let i = 1; i <= totalUnits; i++) {
        const unit = {
          unitNumber: `${i}`,
          status: "vacant",
          tenantId: null,
          tenantName: null,
          rentAmount: null,
          createdAt: Timestamp.now()
        };
        unitPromises.push(addDoc(unitsRef, unit));
      }
      
      await Promise.all(unitPromises);
    } catch (error) {
      console.error("Error creating units:", error);
      throw error;
    }
  }

  // Update a property
  async updateProperty(userId: string, propertyId: string, updateData: UpdatePropertyData): Promise<void> {
    try {
      const db = getClientDb();
      if (!db) throw new Error("Firestore not available on server/SSG");
      const propertyRef = doc(db, "users", userId, "properties", propertyId);
      await updateDoc(propertyRef, {
        ...updateData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error("Error updating property:", error);
      throw error;
    }
  }

  // Delete a property
  async deleteProperty(userId: string, propertyId: string): Promise<void> {
    try {
      const db = getClientDb();
      if (!db) throw new Error("Firestore not available on server/SSG");
      const propertyRef = doc(db, "users", userId, "properties", propertyId);
      await deleteDoc(propertyRef);
    } catch (error) {
      console.error("Error deleting property:", error);
      throw error;
    }
  }

  // Update a unit
  async updateUnit(
    userId: string,
    propertyId: string,
    unitId: string,
    updateData: Partial<Unit>
  ): Promise<void> {
    try {
      const db = getClientDb();
      if (!db) throw new Error("Firestore not available on server/SSG");
      const unitRef = doc(db, "users", userId, "properties", propertyId, "units", unitId);
      await updateDoc(unitRef, updateData);
    } catch (error) {
      console.error("Error updating unit:", error);
      throw error;
    }
  }

  // Create a unit
  async createUnit(
    userId: string,
    propertyId: string,
    data: Pick<Unit, "unitNumber"> & Partial<Pick<Unit, "rentAmount" | "notes">>
  ): Promise<string> {
    try {
      const db = getClientDb();
      if (!db) throw new Error("Firestore not available on server/SSG");
      const unitsRef = collection(db, "users", userId, "properties", propertyId, "units");
      const payload = {
        unitNumber: data.unitNumber,
        status: "vacant" as const,
        tenantId: null as string | null,
        tenantName: null as string | null,
        rentAmount: data.rentAmount ?? null,
        notes: data.notes ?? null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      const ref = await addDoc(unitsRef, payload);
      return ref.id;
    } catch (error) {
      console.error("Error creating unit:", error);
      throw error;
    }
  }

  // Delete a unit
  async deleteUnit(userId: string, propertyId: string, unitId: string): Promise<void> {
    try {
      const db = getClientDb();
      if (!db) throw new Error("Firestore not available on server/SSG");
      const unitRef = doc(db, "users", userId, "properties", propertyId, "units", unitId);
      // If occupied, adjust occupancy
      await runTransaction(db, async (trx) => {
        const snap = await trx.get(unitRef);
        if (snap.exists()) {
          const data = snap.data() as { status?: "vacant" | "occupied" };
          if (data.status === "occupied") {
            const propertyRef = doc(db, "users", userId, "properties", propertyId);
            trx.update(propertyRef, { occupiedUnits: increment(-1), updatedAt: Timestamp.now() });
          }
        }
        trx.delete(unitRef);
      });
    } catch (error) {
      console.error("Error deleting unit:", error);
      throw error;
    }
  }

  // Update property occupancy
  async updateOccupancy(userId: string, propertyId: string, occupiedUnits: number): Promise<void> {
    try {
      const db = getClientDb();
      if (!db) throw new Error("Firestore not available on server/SSG");
      const propertyRef = doc(db, "users", userId, "properties", propertyId);
      await updateDoc(propertyRef, {
        occupiedUnits,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error("Error updating occupancy:", error);
      throw error;
    }
  }

  // Listen to properties changes (real-time)
  subscribeToProperties(
    userId: string, 
    callback: (properties: Property[]) => void
  ): () => void {
    console.log("PropertyService: subscribeToProperties called for userId:", userId);
    const db = getClientDb();
    if (!db) {
      console.error("PropertyService: Firestore not available");
      throw new Error("Firestore not available on server/SSG");
    }
    console.log("PropertyService: Firestore database available");
    const propertiesRef = collection(db, "users", userId, "properties");
    const q = query(propertiesRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        console.log("PropertyService: Query snapshot received, docs count:", querySnapshot.docs.length);
        const properties = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Property[];
        callback(properties);
      },
      (error) => {
        console.error("PropertyService: Error in properties listener:", error);
        callback([]); // Return empty array on error
      }
    );

    this.unsubscribeFunctions.push(unsubscribe);
    return unsubscribe;
  }

  // Get units for a property
  async getUnits(userId: string, propertyId: string): Promise<Unit[]> {
    try {
      const db = getClientDb();
      if (!db) throw new Error("Firestore not available on server/SSG");
      const unitsRef = collection(db, "users", userId, "properties", propertyId, "units");
      const querySnapshot = await getDocs(unitsRef);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        propertyId,
        ...doc.data()
      })) as Unit[];
    } catch (error) {
      console.error("Error fetching units:", error);
      throw error;
    }
  }

  // Get a single unit
  async getUnit(userId: string, propertyId: string, unitId: string): Promise<Unit | null> {
    try {
      const db = getClientDb();
      if (!db) throw new Error("Firestore not available on server/SSG");
      const unitRef = doc(db, "users", userId, "properties", propertyId, "units", unitId);
      const unitSnap = await getDoc(unitRef);
      
      if (unitSnap.exists()) {
        return {
          id: unitSnap.id,
          propertyId,
          ...unitSnap.data()
        } as Unit;
      }
      return null;
    } catch (error) {
      console.error("Error fetching unit:", error);
      throw error;
    }
  }

  // Assign tenant to unit
  async assignTenantToUnit(
    userId: string,
    propertyId: string, 
    unitId: string, 
    tenantId: string,
    tenantName: string,
    rentAmount?: number
  ): Promise<void> {
    try {
      const db = getClientDb();
      if (!db) throw new Error("Firestore not available on server/SSG");
      const unitRef = doc(db, "users", userId, "properties", propertyId, "units", unitId);
      const propertyRef = doc(db, "users", userId, "properties", propertyId);
      const tenantRef = doc(db, "users", userId, "tenants", tenantId);
      await runTransaction(db, async (trx) => {
        const unitSnap = await trx.get(unitRef);
        const wasOccupied = unitSnap.exists() && unitSnap.data()?.status === "occupied";
        trx.update(unitRef, {
          status: "occupied",
          tenantId,
          tenantName,
          rentAmount: rentAmount || 0,
          updatedAt: Timestamp.now()
        });
        trx.update(tenantRef, {
          assignedPropertyId: propertyId,
          assignedUnitId: unitId,
          updatedAt: Timestamp.now(),
        });
        if (!wasOccupied) {
          trx.update(propertyRef, { occupiedUnits: increment(1), updatedAt: Timestamp.now() });
        }
      });
    } catch (error) {
      console.error("Error assigning tenant to unit:", error);
      throw error;
    }
  }

  // Remove tenant from unit
  async removeTenantFromUnit(userId: string, propertyId: string, unitId: string): Promise<void> {
    try {
      const db = getClientDb();
      if (!db) throw new Error("Firestore not available on server/SSG");
      const unitRef = doc(db, "users", userId, "properties", propertyId, "units", unitId);
      const propertyRef = doc(db, "users", userId, "properties", propertyId);
      // Also clear the tenant's assignment if known
      // We read unit to find tenantId for cleanup
      await runTransaction(db, async (trx) => {
        const unitSnap = await trx.get(unitRef);
        const wasOccupied = unitSnap.exists() && unitSnap.data()?.status === "occupied";
        const previousTenantId = unitSnap.exists() ? unitSnap.data()?.tenantId : null;
        trx.update(unitRef, {
          status: "vacant",
          tenantId: null,
          tenantName: null,
          rentAmount: null,
          updatedAt: Timestamp.now()
        });
        if (wasOccupied) {
          trx.update(propertyRef, { occupiedUnits: increment(-1), updatedAt: Timestamp.now() });
        }
        if (previousTenantId) {
          const tenantRef = doc(db, "users", userId, "tenants", String(previousTenantId));
          trx.update(tenantRef, {
            assignedPropertyId: null,
            assignedUnitId: null,
            updatedAt: Timestamp.now(),
          });
        }
      });
    } catch (error) {
      console.error("Error removing tenant from unit:", error);
      throw error;
    }
  }

  // Subscribe to units changes
  subscribeToUnits(
    userId: string,
    propertyId: string,
    callback: (units: Unit[]) => void
  ): () => void {
    const db = getClientDb();
    if (!db) throw new Error("Firestore not available on server/SSG");
    const unitsRef = collection(db, "users", userId, "properties", propertyId, "units");
    
    const unsubscribe = onSnapshot(unitsRef,
      (querySnapshot) => {
        const units = querySnapshot.docs.map(doc => ({
          id: doc.id,
          propertyId,
          ...doc.data()
        })) as Unit[];
        callback(units);
      },
      (error) => {
        console.error("Error in units listener:", error);
        callback([]);
      }
    );

    this.unsubscribeFunctions.push(unsubscribe);
    return unsubscribe;
  }

  // Clean up all listeners
  cleanup(): void {
    if (this.unsubscribeFunctions.length > 0) {
      console.warn(`Cleaning up ${this.unsubscribeFunctions.length} Firestore listeners (properties/units)`);
      this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
      this.unsubscribeFunctions = [];
    }
  }
}

export const propertyService = PropertyService.getInstance();
