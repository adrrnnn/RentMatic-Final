import { PropertyService } from "@/lib/firestore/properties/propertyService";
import type { Property, CreatePropertyData, UpdatePropertyData } from "@/types/firestore";

export class PropertiesService {
  /**
   * Get all properties for a user with real-time updates
   */
  static getPropertiesListener(
    userId: string,
    callback: (properties: Property[]) => void
  ): () => void {
    return PropertyService.getPropertiesListener(userId, callback);
  }

  /**
   * Create a new property
   */
  static async createProperty(
    userId: string,
    propertyData: CreatePropertyData,
    imageFile?: File
  ): Promise<string> {
    return PropertyService.createProperty(userId, propertyData, { imageFile });
  }

  /**
   * Update an existing property
   */
  static async updateProperty(
    userId: string,
    propertyId: string,
    updates: UpdatePropertyData,
    imageFile?: File
  ): Promise<void> {
    // If there's a new image file, upload it first
    if (imageFile) {
      const imageUrl = await PropertyService.uploadPropertyImage(userId, propertyId, imageFile);
      updates.imageURL = imageUrl;
    }

    return PropertyService.updateProperty(userId, propertyId, updates);
  }

  /**
   * Delete a property
   */
  static async deleteProperty(userId: string, propertyId: string): Promise<void> {
    return PropertyService.deleteProperty(userId, propertyId);
  }

  /**
   * Get a single property
   */
  static async getProperty(userId: string, propertyId: string): Promise<Property | null> {
    return PropertyService.getProperty(userId, propertyId);
  }
}


