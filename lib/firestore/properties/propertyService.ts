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
  writeBatch,
  runTransaction,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getClientDb, getClientStorage } from '@/lib/firebase';
import type {
  Property,
  CreatePropertyData,
  UpdatePropertyData,
  CreateUnitData,
  Unit
} from '@/types/firestore';

export class PropertyService {
  private static getCollectionPath(userId: string) {
    return `users/${userId}/properties`;
  }

  private static getUnitsCollectionPath(userId: string, propertyId: string) {
    return `users/${userId}/properties/${propertyId}/units`;
  }

  /**
   * Upload property image to Firebase Storage
   */
  static async uploadPropertyImage(
    userId: string, 
    propertyId: string, 
    imageFile: File
  ): Promise<string> {
    const storage = getClientStorage();
    if (!storage) throw new Error('Firebase Storage not initialized');

    const imageRef = ref(storage, `properties/${userId}/${propertyId}/${Date.now()}_${imageFile.name}`);
    const snapshot = await uploadBytes(imageRef, imageFile);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  }

  /**
   * Delete property image from Firebase Storage
   */
  static async deletePropertyImage(imageUrl: string): Promise<void> {
    const storage = getClientStorage();
    if (!storage) return;

    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.warn('Failed to delete image:', error);
    }
  }

  /**
   * Create a new property with optional unit generation
   */
  static async createProperty(
    userId: string, 
    propertyData: CreatePropertyData,
    options: { generateUnits?: number; imageFile?: File } = {}
  ): Promise<string> {
    const db = getClientDb();
    if (!db) throw new Error('Firestore not initialized');

    const { generateUnits = 0, imageFile } = options;
    
    // Upload image first if provided
    let imageUrl = propertyData.imageURL || '';
    if (imageFile) {
      // Create a temporary property ref to get the ID for image upload
      const tempPropertyRef = doc(collection(db, this.getCollectionPath(userId)));
      imageUrl = await this.uploadPropertyImage(userId, tempPropertyRef.id, imageFile);
    }
    
    if (generateUnits > 0) {
      // Use transaction for property + units creation
      return await runTransaction(db, async (transaction) => {
        const propertyRef = doc(collection(db, this.getCollectionPath(userId)));
        
        const newProperty = {
          name: propertyData.name,
          address: propertyData.address,
          type: propertyData.type || 'Apartment',
          numberOfUnits: generateUnits,
          description: propertyData.description || '',
          imageURL: imageUrl,
          manager: propertyData.manager || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        console.log("Creating property with data:", newProperty);

        transaction.set(propertyRef, newProperty);

        // Create units
        const unitsCollection = collection(db, this.getUnitsCollectionPath(userId, propertyRef.id));
        for (let i = 1; i <= generateUnits; i++) {
          const unitRef = doc(unitsCollection);
          const unitData: Omit<import('@/types/properties').Unit, 'id'> = {
            unitNumber: `Unit ${i}`,
            rentAmount: 0,
            status: 'vacant',
            tenantId: null,
            leaseStart: null,
            leaseEnd: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          transaction.set(unitRef, unitData);
        }

        return propertyRef.id;
      });
    } else {
      // Simple property creation
        const propertyDataToSave = {
        ...propertyData,
        type: propertyData.type || 'Apartment',
        numberOfUnits: 0,
        imageURL: imageUrl,
        manager: propertyData.manager || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log("Creating property with data:", propertyDataToSave);
      
      const propertyRef = await addDoc(collection(db, this.getCollectionPath(userId)), propertyDataToSave);
      
      return propertyRef.id;
    }
  }

  /**
   * Update property data
   */
  static async updateProperty(
    userId: string, 
    propertyId: string, 
    updates: UpdatePropertyData
  ): Promise<void> {
    const db = getClientDb();
    if (!db) throw new Error('Firestore not initialized');

    const propertyRef = doc(db, this.getCollectionPath(userId), propertyId);
    await updateDoc(propertyRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Delete property and all its units
   */
  static async deleteProperty(userId: string, propertyId: string): Promise<void> {
    const db = getClientDb();
    if (!db) throw new Error('Firestore not initialized');

    // Get property first to delete associated image
    const property = await this.getProperty(userId, propertyId);
    if (property?.imageURL) {
      await this.deletePropertyImage(property.imageURL);
    }

    // Use batch to delete property and all units
    const batch = writeBatch(db);
    
    // Delete property
    const propertyRef = doc(db, this.getCollectionPath(userId), propertyId);
    batch.delete(propertyRef);

    // Note: In a real implementation, you'd want to:
    // 1. Get all units first
    // 2. Unassign any tenants from those units
    // 3. Delete all units
    // For now, we'll rely on Firestore security rules to handle this

    await batch.commit();
  }

  /**
   * Get a single property
   */
  static async getProperty(userId: string, propertyId: string): Promise<Property | null> {
    const db = getClientDb();
    if (!db) throw new Error('Firestore not initialized');

    try {
      console.log('🔍 [PROPERTY-SERVICE] Getting property:', {
        userId,
        propertyId,
        collectionPath: this.getCollectionPath(userId)
      });
      
      const propertyRef = doc(db, this.getCollectionPath(userId), propertyId);
      const propertySnap = await getDoc(propertyRef);
      
      console.log('✅ [PROPERTY-SERVICE] Property fetched:', {
        exists: propertySnap.exists(),
        id: propertySnap.id
      });
      
      if (propertySnap.exists()) {
        return { id: propertySnap.id, ...propertySnap.data() } as Property;
      }
      
      return null;
    } catch (error: any) {
      console.error('❌ [PROPERTY-SERVICE] Error getting property:', {
        code: error?.code,
        message: error?.message,
        userId,
        propertyId,
        errorType: error?.constructor?.name,
        stack: error?.stack?.substring(0, 500)
      });
      throw error;
    }
  }

  /**
   * Get all properties for a user
   */
  static async getProperties(userId: string): Promise<Property[]> {
    const db = getClientDb();
    if (!db) throw new Error('Firestore not initialized');

    const propertiesRef = collection(db, this.getCollectionPath(userId));
    const propertiesSnap = await getDocs(propertiesRef);
    
    return propertiesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Property));
  }

  /**
   * Get a single unit
   */
  static async getUnit(userId: string, propertyId: string, unitId: string): Promise<import('@/types/firestore').Unit | null> {
    const db = getClientDb();
    if (!db) throw new Error('Firestore not initialized');

    const unitRef = doc(db, this.getUnitsCollectionPath(userId, propertyId), unitId);
    const unitSnap = await getDoc(unitRef);
    
    if (unitSnap.exists()) {
      const raw = { id: unitSnap.id, ...(unitSnap.data() as Record<string, unknown>) };
      // Normalize to '@/types/firestore'.Unit shape
      const statusRaw = (raw as Record<string, unknown>).status ? String((raw as Record<string, unknown>).status) : '';
      const statusMap: Record<string, import('@/types/firestore').Unit['status']> = {
        'vacant': 'Available',
        'available': 'Available',
        'occupied': 'Occupied',
        'under maintenance': 'Under Maintenance',
        'under_maintenance': 'Under Maintenance',
        'maintenance': 'Under Maintenance',
      };
      const normalizedStatus = statusMap[statusRaw.toLowerCase()] || (statusRaw as import('@/types/firestore').Unit['status']) || 'Available';

      const r = raw as Record<string, unknown>;
      const unit: import('@/types/firestore').Unit = {
        id: String(r.id),
        name: (r.name as string) ?? (r.unitNumber as string) ?? `Unit ${String(r.id)}`,
        propertyId: (r.propertyId as string) ?? propertyId,
        floor: (r.floor as string) ?? '',
        rentType: (r.rentType as import('@/types/firestore').Unit['rentType']) ?? 'Monthly',
        rentAmount: typeof r.rentAmount === 'number' ? (r.rentAmount as number) : 0,
        status: normalizedStatus,
        description: (r.description as string) ?? '',
        tenantId: (r.tenantId as string | null) ?? null,
        createdAt: (r.createdAt as string) ?? new Date().toISOString(),
        updatedAt: (r.updatedAt as string) ?? new Date().toISOString(),
      };
      return unit;
    }
    
    return null;
  }

  /**
   * Listen to all properties for a user
   */
  static getPropertiesListener(
    userId: string, 
    callback: (properties: Property[]) => void
  ): () => void {
    const db = getClientDb();
    if (!db) {
      console.error('Firestore not initialized');
      return () => {};
    }

    const collectionPath = this.getCollectionPath(userId);
    console.log("Properties collection path:", collectionPath);
    
    const propertiesQuery = query(
      collection(db, collectionPath),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(propertiesQuery, (snapshot) => {
      console.log("Properties snapshot received:", snapshot.size, "documents");
      const properties: Property[] = [];
      snapshot.forEach((doc) => {
        const propertyData = { id: doc.id, ...doc.data() } as Property;
        console.log("Processing property:", doc.id, propertyData);
        properties.push(propertyData);
      });
      console.log("Properties processed:", properties.length);
      console.log("All properties:", properties);
      callback(properties);
    }, (error) => {
      console.error("Error in properties listener:", error);
      // Call callback with empty array on error
      callback([]);
    });
  }

  /**
   * Update property occupancy count atomically
   */
  static async updateOccupancyCount(
    userId: string, 
    propertyId: string, 
    delta: number
  ): Promise<void> {
    const db = getClientDb();
    if (!db) throw new Error('Firestore not initialized');

    const propertyRef = doc(db, this.getCollectionPath(userId), propertyId);
    await updateDoc(propertyRef, {
      occupiedCount: increment(delta),
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Recalculate monthly income estimate
   */
  static async recalculateMonthlyIncome(
    userId: string, 
    propertyId: string
  ): Promise<void> {
    const db = getClientDb();
    if (!db) throw new Error('Firestore not initialized');

    // This would typically be done by getting all units and summing their rent
    // For now, we'll implement a simple version
    const propertyRef = doc(db, this.getCollectionPath(userId), propertyId);
    await updateDoc(propertyRef, {
      updatedAt: new Date().toISOString()
      // monthlyIncomeEstimate would be calculated from units
    });
  }
}
