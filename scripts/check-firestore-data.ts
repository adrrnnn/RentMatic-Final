import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBUZhRqTEAvJe8jhgtXFE2kLaJq07zOLTQ",
  authDomain: "rentmatic-b24ff.firebaseapp.com",
  projectId: "rentmatic-b24ff",
  storageBucket: "rentmatic-b24ff.firebasestorage.app",
  messagingSenderId: "813761726055",
  appId: "1:813761726055:web:1b3c38f34359409940b6c2",
  measurementId: "G-Y3LNX9S0S0",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkFirestoreData() {
  console.log('Checking Firestore data...');
  
  try {
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`\nChecking user: ${userId}`);
      
      // Get properties for this user
      const propertiesSnapshot = await getDocs(collection(db, `users/${userId}/properties`));
      
      console.log(`Found ${propertiesSnapshot.size} properties for user ${userId}`);
      
      for (const propertyDoc of propertiesSnapshot.docs) {
        const propertyData = propertyDoc.data();
        console.log(`Property ${propertyDoc.id}:`, {
          name: propertyData.name,
          address: propertyData.address,
          totalUnits: propertyData.totalUnits,
          occupiedCount: propertyData.occupiedCount,
          monthlyIncomeEstimate: propertyData.monthlyIncomeEstimate,
          monthlyRent: propertyData.monthlyRent, // Check if this field exists
          createdAt: propertyData.createdAt,
          updatedAt: propertyData.updatedAt
        });
        
        // Check for duplicate IDs or data issues
        if (propertyData.monthlyRent !== undefined && propertyData.monthlyIncomeEstimate === undefined) {
          console.log(`⚠️  Property ${propertyDoc.id} has monthlyRent but no monthlyIncomeEstimate`);
        }
      }
    }
  } catch (error) {
    console.error('Error checking Firestore data:', error);
  }
}

checkFirestoreData();





