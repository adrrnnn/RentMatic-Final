"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, Building2, Camera } from "lucide-react";
import { Button } from "@/components/Button";
import { PropertyService } from "@/lib/firestore/properties/propertyService";
import type { Property, CreatePropertyData, UpdatePropertyData } from "@/types/firestore";
import { toast } from "react-hot-toast";

interface PropertyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreatePropertyData | UpdatePropertyData) => Promise<void>;
  property?: Property | null;
  loading?: boolean;
  userId?: string;
}

export function PropertyDialog({ 
  isOpen, 
  onClose, 
  onSave, 
  property, 
  loading = false,
  userId
}: PropertyDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    type: "",
    numberOfUnits: "",
    description: "",
    manager: ""
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const propertyTypes = [
    "Apartment",
    "Condo",
    "Commercial",
    "House",
    "Townhouse",
    "Studio",
    "Other"
  ];

  useEffect(() => {
    if (isOpen) {
      if (property) {
        setFormData({
          name: property.name,
          address: property.address,
          type: property.type,
          numberOfUnits: property.numberOfUnits.toString(),
          description: property.description || "",
          manager: property.manager || ""
        });
          setImagePreview(property.imageURL || null);
        } else {
          setFormData({
            name: "",
            address: "",
            type: "",
            numberOfUnits: "",
            description: "",
            manager: ""
          });
          setImagePreview(null);
        }
        setImageFile(null);
        setErrors({});
        setIsSubmitting(false);
      }
    }, [property, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setErrors({ image: "File size must be less than 5MB" });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors({ image: "File must be an image" });
        return;
      }

      setImageFile(file);
      setErrors({}); // Clear any previous errors
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Property name is required";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!formData.type.trim()) {
      newErrors.type = "Property type is required";
    }

    if (!formData.numberOfUnits.trim()) {
      newErrors.numberOfUnits = "Number of units is required";
    } else if (isNaN(Number(formData.numberOfUnits)) || Number(formData.numberOfUnits) < 1) {
      newErrors.numberOfUnits = "Number of units must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with data:", formData);
    
    // Prevent double submission
    if (isSubmitting) {
      console.log("Form already submitting, ignoring");
      return;
    }
    
    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }

    setIsSubmitting(true);
    try {
      let imageURL = property?.imageURL;

      // Skip image upload for now to prevent getting stuck
      // TODO: Implement proper image upload later
      console.log("Skipping image upload to prevent getting stuck");
      imageURL = undefined;

      const data: CreatePropertyData | UpdatePropertyData = {
        ...formData,
        numberOfUnits: Number(formData.numberOfUnits)
      };

      // Only include imageURL if it's not undefined
      if (imageURL) {
        (data as CreatePropertyData & { imageURL: string }).imageURL = imageURL;
      }

      console.log("Calling onSave with data:", data);
      await onSave(data);
      console.log("onSave completed, closing dialog");
      onClose();
    } catch (error) {
      console.error("Error saving property:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;
  
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-gray-100 bg-gradient-to-r from-green-50 to-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {property ? "Edit Property" : "Add New Property"}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {property ? "Update property information" : "Create a new property"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={loading}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8">
              <div className="space-y-6">
                {/* Property Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Image
                  </label>
                  <div className="space-y-4">
                    {imagePreview && (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Property preview"
                          className="w-full h-48 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center space-x-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        disabled={loading || uploadingImage}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading || uploadingImage}
                        className="flex items-center"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        {imagePreview ? "Change Image" : "Upload Image"}
                      </Button>
                      {uploadingImage && (
                        <span className="text-sm text-gray-500">Uploading...</span>
                      )}
                    </div>
                    {errors.image && (
                      <p className="text-red-500 text-sm">{errors.image}</p>
                    )}
                  </div>
                </div>

                {/* Property Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Property Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.name ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Enter property name"
                    disabled={loading || uploadingImage}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.address ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Enter property address"
                    disabled={loading || uploadingImage}
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                  )}
                </div>

                {/* Property Type and Number of Units */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                      Property Type *
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.type ? "border-red-300" : "border-gray-300"
                      }`}
                      disabled={loading || uploadingImage}
                    >
                      <option value="">Select property type</option>
                      {propertyTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    {errors.type && (
                      <p className="text-red-500 text-sm mt-1">{errors.type}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="numberOfUnits" className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Units *
                    </label>
                    <input
                      type="number"
                      id="numberOfUnits"
                      name="numberOfUnits"
                      value={formData.numberOfUnits}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.numberOfUnits ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="Enter number of units"
                      min="1"
                      disabled={loading || uploadingImage}
                    />
                    {errors.numberOfUnits && (
                      <p className="text-red-500 text-sm mt-1">{errors.numberOfUnits}</p>
                    )}
                  </div>
                </div>

                {/* Manager */}
                <div>
                  <label htmlFor="manager" className="block text-sm font-medium text-gray-700 mb-2">
                    Manager (Optional)
                  </label>
                  <input
                    type="text"
                    id="manager"
                    name="manager"
                    value={formData.manager}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter manager name"
                    disabled={loading || uploadingImage}
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter property description"
                    disabled={loading || uploadingImage}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-8 border-t border-gray-100 mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || uploadingImage || isSubmitting}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {loading || uploadingImage || isSubmitting ? "Saving..." : property ? "Update Property" : "Create Property"}
                </Button>
              </div>
            </form>
          </motion.div>
    </div>
  );
}