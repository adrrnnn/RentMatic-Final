import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs,
  onSnapshot, 
  query, 
  orderBy,
  runTransaction,
  increment
} from 'firebase/firestore';
import { getClientDb } from '@/lib/firebase';
import type {
  Unit,
  CreateUnitData,
  UpdateUnitData
} from '@/types/firestore';
import { PropertyService } from './propertyService';

export class UnitService {
  private static getUnitsCollectionPath(userId: string, propertyId: string) {
    return `users/${userId}/properties/${propertyId}/units`;
  }

  /**
   * Create a new unit
   */
  static async createUnit(
    userId: string, 
    propertyId: string, 
    unitData: CreateUnitData
  ): Promise<string> {
    const db = getClientDb();
    if (!db) throw new Error('Firestore not initialized');

    const unitRef = await addDoc(
      collection(db, this.getUnitsCollectionPath(userId, propertyId)), 
      {
        ...unitData,
        status: unitData.status || 'Available',
        tenantId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    );

    // Update property totalUnits count
    await PropertyService.updateProperty(userId, propertyId, {
      // This would need to be done with increment in a real implementation
    });

    return unitRef.id;
  }

  /**
   * Update unit data
   */
  static async updateUnit(
    userId: string, 
    propertyId: string, 
    unitId: string, 
    updates: UpdateUnitData
  ): Promise<void> {
    const db = getClientDb();
    if (!db) throw new Error('Firestore not initialized');

    const unitRef = doc(db, this.getUnitsCollectionPath(userId, propertyId), unitId);
    await updateDoc(unitRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Delete a unit
   */
  static async deleteUnit(
    userId: string, 
    propertyId: string, 
    unitId: string
  ): Promise<void> {
    const db = getClientDb();
    if (!db) throw new Error('Firestore not initialized');

    // First unassign any tenant
    await this.unassignTenantFromUnit(userId, propertyId, unitId);

    // Delete the unit
    const unitRef = doc(db, this.getUnitsCollectionPath(userId, propertyId), unitId);
    await deleteDoc(unitRef);

    // Update property totalUnits count
    // This would need to be done with increment in a real implementation
  }

  /**
   * Assign tenant to unit using transaction
   */
  static async assignTenantToUnit(
    userId: string, 
    propertyId: string, 
    unitId: string, 
    tenantId: string
  ): Promise<void> {
    const db = getClientDb();
    if (!db) throw new Error('Firestore not initialized');

    await runTransaction(db, async (transaction) => {
      const unitRef = doc(db, this.getUnitsCollectionPath(userId, propertyId), unitId);
      const tenantRef = doc(db, `users/${userId}/tenants`, tenantId);
      const propertyRef = doc(db, `users/${userId}/properties`, propertyId);

      // Get current unit data
      const unitSnap = await transaction.get(unitRef);
      if (!unitSnap.exists()) {
        throw new Error('Unit not found');
      }

      const unitData = unitSnap.data() as Unit;
      
      // Check if unit is vacant
      if (unitData.status !== 'Available') {
        throw new Error('Unit is not vacant');
      }

      // Get tenant data
      const tenantSnap = await transaction.get(tenantRef);
      if (!tenantSnap.exists()) {
        throw new Error('Tenant not found');
      }

      // Update unit
      transaction.update(unitRef, {
        tenantId,
        status: 'Occupied',
        updatedAt: new Date().toISOString()
      });

      // Update tenant
      transaction.update(tenantRef, {
        propertyId: propertyId,
        unitId: unitId,
        updatedAt: new Date().toISOString()
      });

      // Increment property occupied count
      transaction.update(propertyRef, {
        occupiedCount: increment(1),
        updatedAt: new Date().toISOString()
      });
    });
  }

  /**
   * Unassign tenant from unit using transaction
   */
  static async unassignTenantFromUnit(
    userId: string, 
    propertyId: string, 
    unitId: string
  ): Promise<void> {
    const db = getClientDb();
    if (!db) throw new Error('Firestore not initialized');

    await runTransaction(db, async (transaction) => {
      const unitRef = doc(db, this.getUnitsCollectionPath(userId, propertyId), unitId);
      const propertyRef = doc(db, `users/${userId}/properties`, propertyId);

      // Get current unit data
      const unitSnap = await transaction.get(unitRef);
      if (!unitSnap.exists()) {
        return; // Unit doesn't exist, nothing to do
      }

      const unitData = unitSnap.data() as Unit;
      
      if (unitData.tenantId) {
        // Update tenant to remove assignment
        const tenantRef = doc(db, `users/${userId}/tenants`, unitData.tenantId);
        transaction.update(tenantRef, {
          propertyId: null,
          unitId: null,
          updatedAt: new Date().toISOString()
        });

        // Decrement property occupied count
        transaction.update(propertyRef, {
          occupiedCount: increment(-1),
          updatedAt: new Date().toISOString()
        });
      }

      // Update unit to vacant
      transaction.update(unitRef, {
        tenantId: null,
        status: 'Available',
        updatedAt: new Date().toISOString()
      });
    });
  }

  /**
   * Get a single unit
   */
  static async getUnit(
    userId: string, 
    propertyId: string, 
    unitId: string
  ): Promise<Unit | null> {
    const db = getClientDb();
    if (!db) throw new Error('Firestore not initialized');

    const unitRef = doc(db, this.getUnitsCollectionPath(userId, propertyId), unitId);
    const unitSnap = await getDoc(unitRef);
    
    if (unitSnap.exists()) {
      return { id: unitSnap.id, ...unitSnap.data() } as Unit;
    }
    
    return null;
  }

  /**
   * Get all units for a property
   */
  static async getUnits(
    userId: string, 
    propertyId: string
  ): Promise<Unit[]> {
    const db = getClientDb();
    if (!db) throw new Error('Firestore not initialized');

    const unitsQuery = query(
      collection(db, this.getUnitsCollectionPath(userId, propertyId)),
      orderBy('name', 'asc')
    );

    const snapshot = await getDocs(unitsQuery);
    const units: Unit[] = [];
    snapshot.forEach((doc) => {
      units.push({ id: doc.id, ...doc.data() } as Unit);
    });
    
    return units;
  }

  /**
   * Get all units across all properties for a user
   */
  static async getAllUnits(userId: string): Promise<Unit[]> {
    const db = getClientDb();
    if (!db) throw new Error('Firestore not initialized');

    // Get all properties first
    const propertiesRef = collection(db, `users/${userId}/properties`);
    const propertiesSnap = await getDocs(propertiesRef);
    
    const allUnits: Unit[] = [];
    
    // Get units from each property
    for (const propertyDoc of propertiesSnap.docs) {
      const propertyId = propertyDoc.id;
      const unitsRef = collection(db, this.getUnitsCollectionPath(userId, propertyId));
      const unitsSnap = await getDocs(unitsRef);
      
      const units = unitsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Unit));
      
      allUnits.push(...units);
    }
    
    return allUnits;
  }

  /**
   * Listen to all units across all properties for a user
   */
  static getAllUnitsListener(
    userId: string,
    callback: (units: Unit[]) => void
  ): () => void {
    const db = getClientDb();
    if (!db) throw new Error('Firestore not initialized');

    // Get all properties first
    const propertiesRef = collection(db, `users/${userId}/properties`);
    
    let allUnits: Unit[] = [];
    const unsubscribes: (() => void)[] = [];

    // Listen to properties changes to update unit listeners
    const unsubscribeProperties = onSnapshot(propertiesRef, (propertiesSnap) => {
      // Unsubscribe from old property unit listeners
      unsubscribes.forEach(unsub => unsub());
      unsubscribes.length = 0;
      
      allUnits = [];
      
      // Set up listeners for each property's units
      propertiesSnap.docs.forEach(propertyDoc => {
        const propertyId = propertyDoc.id;
        const unitsRef = collection(db, this.getUnitsCollectionPath(userId, propertyId));
        
        const unsubscribeUnits = onSnapshot(unitsRef, (unitsSnap) => {
          // Update allUnits array with units from this property
          const propertyUnits = unitsSnap.docs.map(doc => ({
            id: doc.id,
            propertyId: propertyId,
            ...doc.data()
          } as Unit));
          
          // Remove old units from this property and add new ones
          allUnits = allUnits.filter(unit => unit.propertyId !== propertyId);
          allUnits.push(...propertyUnits);
          
          callback([...allUnits]);
        });
        
        unsubscribes.push(unsubscribeUnits);
      });
    });

    return () => {
      unsubscribeProperties();
      unsubscribes.forEach(unsub => unsub());
    };
  }

  /**
   * Listen to all units for a property
   */
  static getUnitsListener(
    userId: string, 
    propertyId: string, 
    callback: (units: Unit[]) => void
  ): () => void {
    const db = getClientDb();
    if (!db) {
      console.error('Firestore not initialized');
      return () => {};
    }

    const unitsQuery = query(
      collection(db, this.getUnitsCollectionPath(userId, propertyId)),
      orderBy('name', 'asc')
    );

    return onSnapshot(unitsQuery, (snapshot) => {
      const units: Unit[] = [];
      snapshot.forEach((doc) => {
        units.push({ id: doc.id, ...doc.data() } as Unit);
      });
      callback(units);
    });
  }
}

