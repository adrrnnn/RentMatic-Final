"use client";

import { useState, useEffect } from "react";
import { useUserStore } from "@/store/useUserStore";
import { PropertiesService } from "../services/propertiesService";
import type { Property, CreatePropertyData, UpdatePropertyData } from "@/types/firestore";

export function useProperties() {
  const { user } = useUserStore();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setProperties([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = PropertiesService.getPropertiesListener(
      user.id,
      (newProperties) => {
        setProperties(newProperties);
        setLoading(false);
        setError(null);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  const createProperty = async (propertyData: CreatePropertyData, imageFile?: File) => {
    if (!user?.id) throw new Error("User not authenticated");
    
    try {
      setError(null);
      return await PropertiesService.createProperty(user.id, propertyData, imageFile);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create property";
      setError(errorMessage);
      throw err;
    }
  };

  const updateProperty = async (
    propertyId: string, 
    updates: UpdatePropertyData, 
    imageFile?: File
  ) => {
    if (!user?.id) throw new Error("User not authenticated");
    
    try {
      setError(null);
      return await PropertiesService.updateProperty(user.id, propertyId, updates, imageFile);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update property";
      setError(errorMessage);
      throw err;
    }
  };

  const deleteProperty = async (propertyId: string) => {
    if (!user?.id) throw new Error("User not authenticated");
    
    try {
      setError(null);
      return await PropertiesService.deleteProperty(user.id, propertyId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete property";
      setError(errorMessage);
      throw err;
    }
  };

  return {
    properties,
    loading,
    error,
    createProperty,
    updateProperty,
    deleteProperty
  };
}


