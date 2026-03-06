import { getClientDb } from '../lib/firebase';
import { doc, getDocs, collection, addDoc, deleteDoc } from 'firebase/firestore';

async function migrateSharedTenants(userId: string) {
  const db = getClientDb();
  if (!db) {
    console.error('No database connection');
    return;
  }

  try {
    // Get all shared tenants
    const sharedTenantsSnapshot = await getDocs(collection(db, 'shared-tenants'));
    const sharedTenants = sharedTenantsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Found ${sharedTenants.length} shared tenants to migrate`);

    // Move each shared tenant to user collection
    for (const tenant of sharedTenants) {
      const { id, ...tenantData } = tenant;
      
      // Add to user's tenant collection
      await addDoc(collection(db, `users/${userId}/tenants`), {
        ...tenantData,
        migratedFrom: 'shared-tenants',
        migratedAt: new Date().toISOString()
      });

      // Delete from shared collection
      await deleteDoc(doc(db, 'shared-tenants', id));
      
      console.log(`Migrated tenant: ${(tenantData as any).fullName || (tenantData as any).name}`);
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Usage: Call this function with your user ID
// migrateSharedTenants('7md27d6BnZhSVcgi3eVRUgLKETM2');
