import { create } from "zustand";
import { onAuthStateChanged, User as FirebaseUser, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getClientAuth, getClientDb } from "@/lib/firebase";

interface User {
  id: string;
  email: string;
  name: string;
  role: "tenant" | "landlord" | "admin";
  lastLogin?: string;
}

interface UserState {
  user: User | null;
  authLoading: boolean;
  initialized: boolean;
  unsubscribe: (() => void) | null;
  setUser: (user: User | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setUnsubscribe: (unsubscribe: (() => void) | null) => void;
  logout: () => Promise<void>;
  initializeAuth: () => void;
  clearCache: () => void;
  loadUserData: (firebaseUser: any) => Promise<void>;
}

export const useUserStore = create<UserState>()((set, get) => ({
  user: null,
  authLoading: true,
  initialized: false,
  unsubscribe: null,
  
  setUser: (user) => set({ user }),
  setAuthLoading: (authLoading) => set({ authLoading }),
  setInitialized: (initialized) => set({ initialized }),
  setUnsubscribe: (unsubscribe) => set({ unsubscribe }),
  
  logout: async () => {
    try {
      // Clean up auth listener
      const { unsubscribe } = get();
      if (unsubscribe) {
        unsubscribe();
      }
      
      // Sign out from Firebase
      const auth = getClientAuth();
      if (auth) {
        await signOut(auth);
      }
      
      set({ 
        user: null, 
        authLoading: false, 
        initialized: false,
        unsubscribe: null 
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  },
  
  clearCache: () => {
    set({ user: null, authLoading: true, initialized: false });
  },
  
  loadUserData: async (firebaseUser: any) => {
    try {
      const db = getClientDb();
      if (!db) {
        console.log("Firestore not available");
        set({ authLoading: false });
        return;
      }
      
      console.log("Loading user data from Firestore for:", firebaseUser.uid);
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      const userData = userDoc.data();
      
      console.log("Firestore user data:", userData);
      
      if (userData) {
        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          name: userData.name || firebaseUser.displayName || 'User',
          role: userData.role || 'landlord',
          lastLogin: userData.lastLogin || new Date().toISOString()
        };
        
        console.log("Setting user in store:", user);
        set({ user, authLoading: false });
      } else {
        console.log("No user data found in Firestore");
        set({ authLoading: false });
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      set({ authLoading: false });
    }
  },
  
  initializeAuth: () => {
    const state = get();
    if (state.initialized) {
      console.log("Auth already initialized");
      return;
    }
    
    console.log("Initializing auth store...");
    
    if (state.unsubscribe) {
      state.unsubscribe();
    }
    
    set({ initialized: true, authLoading: true });
    
    const auth = getClientAuth();
    const db = getClientDb();
    
    if (!auth || !db) {
      console.log("Firebase not available");
      set({ authLoading: false });
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log("Auth state changed:", firebaseUser ? `User: ${firebaseUser.uid}` : "No user");
      
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          const userData = userDoc.data();
          
          if (userData) {
            const user: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              name: userData.name || firebaseUser.displayName || 'User',
              role: userData.role || 'landlord',
              lastLogin: new Date().toISOString()
            };
            
            set({ user, authLoading: false });
          } else {
            const newUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              name: firebaseUser.displayName || 'User',
              role: 'landlord',
              lastLogin: new Date().toISOString()
            };
            
            await setDoc(doc(db, "users", firebaseUser.uid), {
              name: newUser.name,
              email: newUser.email,
              role: newUser.role,
              createdAt: new Date().toISOString()
            });
            
            set({ user: newUser, authLoading: false });
          }
        } catch (error) {
          console.error("Error in auth listener:", error);
          set({ authLoading: false });
        }
      } else {
        set({ user: null, authLoading: false });
      }
    });
    
    set({ unsubscribe });
    
    setTimeout(() => {
      const currentState = get();
      if (currentState.authLoading) {
        console.log("Auth timeout - stopping loading");
        set({ authLoading: false });
      }
    }, 5000);
  }
}));