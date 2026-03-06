import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { storage } from '@/lib/firebase';

export class ImageUploadService {
  /**
   * Upload a unit image to Firebase Storage
   */
  static async uploadUnitImage(
    userId: string, 
    unitId: string, 
    file: File,
    retryCount: number = 0
  ): Promise<string> {
    const maxRetries = 3;
    
    try {
      console.log(`Starting image upload (attempt ${retryCount + 1}/${maxRetries + 1}):`, { userId, unitId, fileName: file.name, fileSize: file.size });
      
      if (!storage) {
        throw new Error('Firebase Storage not initialized');
      }

      // Create a unique filename with timestamp
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storagePath = `users/${userId}/units/${unitId}/${fileName}`;
      
      console.log('Storage path:', storagePath);
      
      const storageRef = ref(storage, storagePath);
      console.log('Uploading bytes...');
      
      // Add timeout to upload with shorter timeout for retries
      const timeoutDuration = retryCount > 0 ? 15000 : 30000; // Shorter timeout on retries
      const uploadPromise = uploadBytes(storageRef, file);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Upload timeout after ${timeoutDuration/1000} seconds`)), timeoutDuration)
      );
      
      const snapshot = await Promise.race([uploadPromise, timeoutPromise]) as Awaited<ReturnType<typeof uploadBytes>>;
      console.log('Upload complete, getting download URL...');
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL obtained:', downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error(`Upload attempt ${retryCount + 1} failed:`, error);
      
      // Retry logic
      if (retryCount < maxRetries) {
        console.log(`Retrying upload in 2 seconds... (attempt ${retryCount + 2}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
        return this.uploadUnitImage(userId, unitId, file, retryCount + 1);
      }
      
      throw new Error(`Failed to upload image after ${maxRetries + 1} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload a property image to Firebase Storage
   */
  static async uploadPropertyImage(
    userId: string, 
    propertyId: string, 
    file: File
  ): Promise<string> {
    try {
      if (!storage) {
        throw new Error('Firebase Storage not initialized');
      }

      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storagePath = `users/${userId}/properties/${propertyId}/${fileName}`;
      
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading property image:', error);
      throw new Error('Failed to upload image. Please try again.');
    }
  }

  /**
   * Delete an image from Firebase Storage
   */
  static async deleteImage(imageURL: string): Promise<void> {
    try {
      if (!storage) {
        console.warn('Firebase Storage not initialized, cannot delete image');
        return;
      }

      const imageRef = ref(storage, imageURL);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
      // Don't throw error for delete failures - image might not exist
    }
  }

  /**
   * Validate image file
   */
  static validateImageFile(file: File): { isValid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Please upload a valid image file (JPEG, PNG, or WebP)'
      };
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'Image size must be less than 5MB'
      };
    }

    return { isValid: true };
  }

  /**
   * Compress image before upload with aggressive compression for faster uploads
   */
  static async compressImage(file: File, maxWidth: number = 800, quality: number = 0.6): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      // Set timeout for compression
      const timeout = setTimeout(() => {
        console.warn('Image compression timeout, using original file');
        resolve(file);
      }, 10000); // 10 second timeout

      img.onerror = () => {
        console.error('Error loading image for compression');
        clearTimeout(timeout);
        resolve(file);
      };

      img.onload = () => {
        try {
          // Calculate new dimensions with more aggressive resizing
          let { width, height } = img;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          // Further reduce size for very large images
          if (width > 600) {
            height = (height * 600) / width;
            width = 600;
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress with lower quality for faster uploads
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob(
              (blob) => {
                clearTimeout(timeout);
                if (blob) {
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                  });
                  console.log(`Image compressed: ${file.size} -> ${compressedFile.size} bytes (${Math.round((1 - compressedFile.size / file.size) * 100)}% reduction)`);
                  resolve(compressedFile);
                } else {
                  console.warn('Canvas toBlob failed, using original file');
                  resolve(file);
                }
              },
              'image/jpeg',
              quality
            );
          } else {
            console.warn('Canvas context not available, using original file');
            clearTimeout(timeout);
            resolve(file);
          }
        } catch (error) {
          console.error('Error during image compression:', error);
          clearTimeout(timeout);
          resolve(file);
        }
      };

      img.src = URL.createObjectURL(file);
    });
  }
}
