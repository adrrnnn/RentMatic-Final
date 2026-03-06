import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  setDoc,
  deleteDoc, 
  getDoc, 
  getDocs,
  onSnapshot, 
  query, 
  orderBy,
  where
} from 'firebase/firestore';
import { getClientDb } from '@/lib/firebase';
import type {
  Tenant,
  CreateTenantData,
  UpdateTenantData
} from '@/types/firestore';

export class TenantService {
  private static getCollectionPath(userId: string) {
    return `users/${userId}/tenants`;
  }

  /**
   * Create a new tenant
   */
  static async createTenant(
    userId: string, 
    tenantData: CreateTenantData
  ): Promise<string> {
    const db = getClientDb();
    if (!db) throw new Error('Firestore not initialized');

    const tenantRef = await addDoc(collection(db, this.getCollectionPath(userId)), {
      ...tenantData,
      propertyId: null,
      unitId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return tenantRef.id;
  }

  /**
   * Update tenant data
   */
  static async updateTenant(
    userId: string, 
    tenantId: string, 
    updates: UpdateTenantData
  ): Promise<void> {
    const db = getClientDb();
    if (!db) throw new Error('Firestore not initialized');

    const tenantRef = doc(db, this.getCollectionPath(userId), tenantId);
    
    // Debug: Log what we're trying to save
    console.log('TenantService.updateTenant - Saving updates:', {
      tenantId,
      updates,
      leaseStartDate: updates.leaseStartDate,
      leaseEndDate: updates.leaseEndDate,
      leaseTerms: updates.leaseTerms,
      securityDeposit: updates.securityDeposit
    });
    
    await setDoc(tenantRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }

  /**
   * Delete a tenant
   */
  static async deleteTenant(userId: string, tenantId: string): Promise<void> {
    const db = getClientDb();
    if (!db) throw new Error('Firestore not initialized');

    // First unassign from any unit
    const tenant = await this.getTenant(userId, tenantId);
    if (tenant?.unitId && tenant?.propertyId) {
      // Import here to avoid circular dependency
      const { UnitService } = await import('./unitService');
      await UnitService.unassignTenantFromUnit(
        userId,
        tenant.propertyId,
        tenant.unitId
      );
    }

    // Delete the tenant
    const tenantRef = doc(db, this.getCollectionPath(userId), tenantId);
    await deleteDoc(tenantRef);
  }

  /**
   * Get a single tenant
   */
  static async getTenant(userId: string, tenantId: string): Promise<Tenant | null> {
    const db = getClientDb();
    if (!db) throw new Error('Firestore not initialized');

    const tenantRef = doc(db, this.getCollectionPath(userId), tenantId);
    const tenantSnap = await getDoc(tenantRef);
    
    if (tenantSnap.exists()) {
      const data = tenantSnap.data();
      
      // Debug: Log what we're retrieving
      console.log('TenantService.getTenant - Retrieved data:', {
        tenantId,
        rawData: data,
        leaseStartDate: data.leaseStartDate,
        leaseEndDate: data.leaseEndDate,
        leaseTerms: data.leaseTerms,
        securityDeposit: data.securityDeposit
      });
      
      return {
        id: tenantSnap.id,
        fullName: data.fullName || data.name, // Handle both field names for compatibility
        contact: {
          email: data.email || data.contact?.email,
          phone: data.phone || data.contact?.phone
        },
        unitId: data.unitId || data.assignedUnitId,
        propertyId: data.propertyId || data.assignedPropertyId,
        leaseStartDate: data.leaseStartDate,
        leaseEndDate: data.leaseEndDate,
        leaseTerms: data.leaseTerms,
        securityDeposit: data.securityDeposit,
        moveInDate: data.moveInDate,
        notes: data.notes,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      } as Tenant;
    }
    
    return null;
  }

  /**
   * Get all tenants for a user
   */
  static async getTenants(userId: string): Promise<Tenant[]> {
    const db = getClientDb();
    if (!db) throw new Error('Firestore not initialized');

    const tenantsQuery = query(
      collection(db, this.getCollectionPath(userId)),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(tenantsQuery);
    const tenants: Tenant[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      tenants.push({
        id: doc.id,
        fullName: data.fullName || data.name,
        contact: {
          email: data.email || data.contact?.email,
          phone: data.phone || data.contact?.phone
        },
        unitId: data.unitId || data.assignedUnitId,
        propertyId: data.propertyId || data.assignedPropertyId,
        leaseStartDate: data.leaseStartDate,
        leaseEndDate: data.leaseEndDate,
        leaseTerms: data.leaseTerms,
        securityDeposit: data.securityDeposit,
        moveInDate: data.moveInDate,
        notes: data.notes,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      } as Tenant);
    });
    
    return tenants;
  }

  /**
   * Get tenants assigned to a specific property
   */
  static async getTenantsByProperty(userId: string, propertyId: string): Promise<Tenant[]> {
    const db = getClientDb();
    if (!db) throw new Error('Firestore not initialized');

    const tenantsQuery = query(
      collection(db, this.getCollectionPath(userId)),
      where('propertyId', '==', propertyId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(tenantsQuery);
    const tenants: Tenant[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      tenants.push({
        id: doc.id,
        fullName: data.fullName || data.name,
        contact: {
          email: data.email || data.contact?.email,
          phone: data.phone || data.contact?.phone
        },
        unitId: data.unitId || data.assignedUnitId,
        propertyId: data.propertyId || data.assignedPropertyId,
        leaseStartDate: data.leaseStartDate,
        leaseEndDate: data.leaseEndDate,
        leaseTerms: data.leaseTerms,
        securityDeposit: data.securityDeposit,
        moveInDate: data.moveInDate,
        notes: data.notes,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      } as Tenant);
    });
    
    return tenants;
  }

  /**
   * Get unassigned tenants
   */
  static async getUnassignedTenants(userId: string): Promise<Tenant[]> {
    const db = getClientDb();
    if (!db) throw new Error('Firestore not initialized');

    const tenantsQuery = query(
      collection(db, this.getCollectionPath(userId)),
      where('unitId', '==', null),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(tenantsQuery);
    const tenants: Tenant[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      tenants.push({
        id: doc.id,
        fullName: data.fullName || data.name,
        contact: {
          email: data.email || data.contact?.email,
          phone: data.phone || data.contact?.phone
        },
        unitId: data.unitId || data.assignedUnitId,
        propertyId: data.propertyId || data.assignedPropertyId,
        leaseStartDate: data.leaseStartDate,
        leaseEndDate: data.leaseEndDate,
        leaseTerms: data.leaseTerms,
        securityDeposit: data.securityDeposit,
        moveInDate: data.moveInDate,
        notes: data.notes,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      } as Tenant);
    });
    
    return tenants;
  }

  /**
   * Listen to all tenants for a user
   */
  static getTenantsListener(
    userId: string, 
    callback: (tenants: Tenant[]) => void
  ): () => void {
    const db = getClientDb();
    if (!db) {
      console.error('Firestore not initialized');
      return () => {};
    }

    const tenantsQuery = query(
      collection(db, this.getCollectionPath(userId)),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(tenantsQuery, (snapshot) => {
      const tenants: Tenant[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        tenants.push({
          id: doc.id,
          fullName: data.fullName || data.name,
          contact: {
            email: data.email || data.contact?.email,
            phone: data.phone || data.contact?.phone
          },
          unitId: data.unitId || data.assignedUnitId,
          propertyId: data.propertyId || data.assignedPropertyId,
          leaseStartDate: data.leaseStartDate,
          leaseEndDate: data.leaseEndDate,
          leaseTerms: data.leaseTerms,
          securityDeposit: data.securityDeposit,
          moveInDate: data.moveInDate,
          notes: data.notes,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        } as Tenant);
      });
      callback(tenants);
    });
  }

  /**
   * Listen to unassigned tenants only
   */
  static getUnassignedTenantsListener(
    userId: string, 
    callback: (tenants: Tenant[]) => void
  ): () => void {
    const db = getClientDb();
    if (!db) {
      console.error('Firestore not initialized');
      return () => {};
    }

    const tenantsQuery = query(
      collection(db, this.getCollectionPath(userId)),
      where('unitId', '==', null),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(tenantsQuery, (snapshot) => {
      const tenants: Tenant[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        tenants.push({
          id: doc.id,
          fullName: data.fullName || data.name,
          contact: {
            email: data.email || data.contact?.email,
            phone: data.phone || data.contact?.phone
          },
          unitId: data.unitId || data.assignedUnitId,
          propertyId: data.propertyId || data.assignedPropertyId,
          leaseStartDate: data.leaseStartDate,
          leaseEndDate: data.leaseEndDate,
          leaseTerms: data.leaseTerms,
          securityDeposit: data.securityDeposit,
          moveInDate: data.moveInDate,
          notes: data.notes,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        } as Tenant);
      });
      callback(tenants);
    });
  }

  /**
   * Listen to tenants assigned to a specific property
   */
  static getPropertyTenantsListener(
    userId: string, 
    propertyId: string, 
    callback: (tenants: Tenant[]) => void
  ): () => void {
    const db = getClientDb();
    if (!db) {
      console.error('Firestore not initialized');
      return () => {};
    }

    const tenantsQuery = query(
      collection(db, this.getCollectionPath(userId)),
      where('propertyId', '==', propertyId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(tenantsQuery, (snapshot) => {
      const tenants: Tenant[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        tenants.push({
          id: doc.id,
          fullName: data.fullName || data.name,
          contact: {
            email: data.email || data.contact?.email,
            phone: data.phone || data.contact?.phone
          },
          unitId: data.unitId || data.assignedUnitId,
          propertyId: data.propertyId || data.assignedPropertyId,
          leaseStartDate: data.leaseStartDate,
          leaseEndDate: data.leaseEndDate,
          leaseTerms: data.leaseTerms,
          securityDeposit: data.securityDeposit,
          moveInDate: data.moveInDate,
          notes: data.notes,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        } as Tenant);
      });
      callback(tenants);
    });
  }
}

