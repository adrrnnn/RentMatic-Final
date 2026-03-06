import { create } from "zustand";
import type { DragDropData } from '@/types/properties';

interface PropertiesUIState {
  // Modal states
  isCreatePropertyModalOpen: boolean;
  isCreateTenantModalOpen: boolean;
  isEditPropertyModalOpen: boolean;
  isEditTenantModalOpen: boolean;
  
  // Selected items
  selectedPropertyId: string | null;
  selectedTenantId: string | null;
  selectedUnitId: string | null;
  
  // Drag and drop state
  draggedTenant: DragDropData | null;
  isDragging: boolean;
  
  // UI state
  activeTab: 'overview' | 'units' | 'tenants';
  sidebarOpen: boolean;
  
  // Actions
  setCreatePropertyModalOpen: (open: boolean) => void;
  setCreateTenantModalOpen: (open: boolean) => void;
  setEditPropertyModalOpen: (open: boolean) => void;
  setEditTenantModalOpen: (open: boolean) => void;
  
  setSelectedPropertyId: (id: string | null) => void;
  setSelectedTenantId: (id: string | null) => void;
  setSelectedUnitId: (id: string | null) => void;
  
  setDraggedTenant: (tenant: DragDropData | null) => void;
  setIsDragging: (dragging: boolean) => void;
  
  setActiveTab: (tab: 'overview' | 'units' | 'tenants') => void;
  setSidebarOpen: (open: boolean) => void;
  
  // Reset functions
  resetSelection: () => void;
  resetDragState: () => void;
  resetAll: () => void;
}

export const usePropertiesStore = create<PropertiesUIState>((set) => ({
  // Initial state
  isCreatePropertyModalOpen: false,
  isCreateTenantModalOpen: false,
  isEditPropertyModalOpen: false,
  isEditTenantModalOpen: false,
  
  selectedPropertyId: null,
  selectedTenantId: null,
  selectedUnitId: null,
  
  draggedTenant: null,
  isDragging: false,
  
  activeTab: 'overview',
  sidebarOpen: false,
  
  // Actions
  setCreatePropertyModalOpen: (open) => set({ isCreatePropertyModalOpen: open }),
  setCreateTenantModalOpen: (open) => set({ isCreateTenantModalOpen: open }),
  setEditPropertyModalOpen: (open) => set({ isEditPropertyModalOpen: open }),
  setEditTenantModalOpen: (open) => set({ isEditTenantModalOpen: open }),
  
  setSelectedPropertyId: (id) => set({ selectedPropertyId: id }),
  setSelectedTenantId: (id) => set({ selectedTenantId: id }),
  setSelectedUnitId: (id) => set({ selectedUnitId: id }),
  
  setDraggedTenant: (tenant) => set({ draggedTenant: tenant }),
  setIsDragging: (dragging) => set({ isDragging: dragging }),
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  // Reset functions
  resetSelection: () => set({
    selectedPropertyId: null,
    selectedTenantId: null,
    selectedUnitId: null
  }),
  
  resetDragState: () => set({
    draggedTenant: null,
    isDragging: false
  }),
  
  resetAll: () => set({
    isCreatePropertyModalOpen: false,
    isCreateTenantModalOpen: false,
    isEditPropertyModalOpen: false,
    isEditTenantModalOpen: false,
    selectedPropertyId: null,
    selectedTenantId: null,
    selectedUnitId: null,
    draggedTenant: null,
    isDragging: false,
    activeTab: 'overview',
    sidebarOpen: false
  })
}));























