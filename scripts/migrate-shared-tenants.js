const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBqJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8",
  authDomain: "rentmatic-b24ff.firebaseapp.com",
  projectId: "rentmatic-b24ff",
  storageBucket: "rentmatic-b24ff.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456789"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateSharedTenants() {
  try {
    console.log('🔄 Starting migration of shared tenants...');
    
    // Get all shared tenants
    const sharedTenantsSnapshot = await getDocs(collection(db, 'shared-tenants'));
    const sharedTenants = sharedTenantsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Found ${sharedTenants.length} shared tenants to migrate`);

    if (sharedTenants.length === 0) {
      console.log('✅ No shared tenants to migrate');
      return;
    }

    // Move each shared tenant to user collection
    for (const tenant of sharedTenants) {
      const { id, ...tenantData } = tenant;
      
      // Add to user's tenant collection
      await addDoc(collection(db, 'users/7md27d6BnZhSVcgi3eVRUgLKETM2/tenants'), {
        ...tenantData,
        migratedFrom: 'shared-tenants',
        migratedAt: new Date().toISOString()
      });

      // Delete from shared collection
      await deleteDoc(doc(db, 'shared-tenants', id));
      
      console.log(`✅ Migrated tenant: ${tenantData.fullName || tenantData.name}`);
    }

    console.log('🎉 Migration completed successfully!');
    console.log('All shared tenants have been moved to your personal collection.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrateSharedTenants();
