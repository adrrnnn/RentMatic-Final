"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Home, Building2, DollarSign, Calendar, FileText, MapPin, Users, Camera, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/Button";
import type { Unit, CreateUnitData, UpdateUnitData, Room } from "@/types/firestore";
import { ImageUploadService } from "@/lib/services/imageUploadService";
import { RoomManager } from "./RoomManager";

interface UnitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateUnitData | UpdateUnitData) => void;
  onSaveAddAnother?: (data: CreateUnitData) => void;
  unit?: Unit | null;
  propertyId: string;
  loading?: boolean;
  suggestedName?: string;
  userId?: string;
}

export function UnitDialog({
  isOpen,
  onClose,
  onSave,
  onSaveAddAnother,
  unit,
  propertyId,
  loading = false,
  suggestedName,
  userId
}: UnitDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    floor: "",
    rentType: "Monthly" as "Monthly" | "Quarterly" | "Yearly" | "Nightly",
    rentAmount: "",
    status: "Available" as "Available" | "Occupied" | "Under Maintenance",
    description: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageURL, setImageURL] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);

  // Reset form when dialog opens/closes or unit changes
  useEffect(() => {
    if (isOpen) {
      if (unit) {
        setFormData({
          name: unit.name || "",
          floor: unit.floor?.toString() || "",
          rentType: unit.rentType || "Monthly",
          rentAmount: unit.rentAmount?.toString() || "",
          status: unit.status || "Available",
          description: unit.description || ""
        });
        setImageURL(unit.imageURL || "");
        setRooms(unit.rooms || []);
      } else {
        setFormData({
          name: suggestedName || "",
          floor: "",
          rentType: "Monthly",
          rentAmount: "",
          status: "Available",
          description: ""
        });
        setImageURL("");
        setRooms([]);
      }
      setImageFile(null);
      setErrors({});
    }
  }, [isOpen, unit, suggestedName]);

  const validateForm = () => {
    console.log("validateForm called with formData:", formData);
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Unit name is required";
    }

    if (!formData.floor.trim()) {
      newErrors.floor = "Floor is required";
    }

    if (!formData.rentAmount.trim()) {
      newErrors.rentAmount = "Rent amount is required";
    } else if (isNaN(Number(formData.rentAmount)) || Number(formData.rentAmount) <= 0) {
      newErrors.rentAmount = "Rent amount must be a positive number";
    }

    console.log("Validation errors:", newErrors);
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log("Form is valid:", isValid);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    console.log("UnitDialog handleSubmit called");
    e.preventDefault();
    
    console.log("Form validation starting...");
    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }
    console.log("Form validation passed");

    const data: CreateUnitData | UpdateUnitData = {
      name: formData.name.trim(),
      floor: formData.floor.trim(),
      rentType: formData.rentType,
      rentAmount: Number(formData.rentAmount),
      status: formData.status,
      description: formData.description.trim(),
      imageURL: imageURL || undefined,
      rooms: rooms.length > 0 ? rooms : undefined,
      propertyId: propertyId
    };

    console.log("Calling onSave with data:", data);
    onSave(data);
  };

  const handleSubmitAndAddAnother = () => {
    if (!validateForm()) return;

    const data: CreateUnitData | UpdateUnitData = {
      name: formData.name.trim(),
      floor: formData.floor.trim(),
      rentType: formData.rentType,
      rentAmount: Number(formData.rentAmount),
      status: formData.status,
      description: formData.description.trim(),
      imageURL: imageURL || undefined,
      rooms: rooms.length > 0 ? rooms : undefined,
      propertyId: propertyId
    };

    if (onSaveAddAnother) {
      onSaveAddAnother(data);
      // Reset form for next entry; keep suggestedName base if provided
      setFormData({
        name: suggestedName || "",
        floor: "",
        rentType: "Monthly",
        rentAmount: "",
        status: "Available",
        description: ""
      });
    } else {
      onSave(data);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) {
      console.log('No file or userId:', { file: !!file, userId: !!userId });
      return;
    }

    console.log('Starting image upload process:', { fileName: file.name, fileSize: file.size });

    // Validate file
    const validation = ImageUploadService.validateImageFile(file);
    if (!validation.isValid) {
      console.log('File validation failed:', validation.error);
      setErrors(prev => ({ ...prev, image: validation.error || "Invalid file" }));
      return;
    }

    setUploadingImage(true);
    setErrors(prev => ({ ...prev, image: "" }));

    // INSTANT UPLOAD: Skip Firebase Storage entirely and use data URL
    console.log('Using instant data URL upload (bypassing Firebase Storage)...');
    
    try {
      let fileToProcess = file;
      
      // Only compress if file is larger than 100KB
      if (file.size > 100000) {
        console.log('Compressing image for data URL...');
        const compressedFile = await ImageUploadService.compressImage(file);
        console.log('Image compressed:', { originalSize: file.size, compressedSize: compressedFile.size });
        fileToProcess = compressedFile;
        setImageFile(compressedFile);
      } else {
        console.log('File is small, using original for data URL:', { fileSize: file.size });
        setImageFile(file);
      }

      // Convert to data URL instantly
      const dataURL = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(fileToProcess);
      });
      
      console.log('Data URL created successfully, size:', dataURL.length);
      setImageURL(dataURL);
      console.log('Instant upload complete!');
      
    } catch (error) {
      console.error('Data URL creation failed:', error);
      setErrors(prev => ({ ...prev, image: `Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}` }));
    } finally {
      console.log('Upload process finished');
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImageURL("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-[9999] overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl border border-gray-100 my-4 max-h-[95vh] overflow-hidden flex flex-col"
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {unit ? "Edit Unit" : "Add New Unit"}
              </h2>
              <p className="text-sm text-gray-600 font-medium">Configure unit details and rental information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-3 hover:bg-gray-100 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} onClick={() => console.log("Form clicked")} className="p-6 space-y-6">
          {/* Unit Name */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-gray-700">
              <Building2 className="w-4 h-4 mr-2 text-green-600" />
              Unit Name/Number *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                errors.name ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400"
              }`}
              placeholder="e.g., Unit 101, Apartment A"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                {errors.name}
              </p>
            )}
          </div>

          {/* Floor */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-gray-700">
              <MapPin className="w-4 h-4 mr-2 text-blue-600" />
              Floor *
            </label>
            <input
              type="text"
              value={formData.floor}
              onChange={(e) => handleInputChange("floor", e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                errors.floor ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400"
              }`}
              placeholder="e.g., 1, 2, 3, Ground Floor"
            />
            {errors.floor && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                {errors.floor}
              </p>
            )}
          </div>

          {/* Rent Type and Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700">
                <Calendar className="w-4 h-4 mr-2 text-purple-600" />
                Rent Type *
              </label>
              <select
                value={formData.rentType}
                onChange={(e) => handleInputChange("rentType", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Yearly">Yearly</option>
                <option value="Nightly">Nightly</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700">
                <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                Rent Amount *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 pr-2 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-lg font-bold">₱</span>
                </div>
                <input
                  type="number"
                  value={formData.rentAmount}
                  onChange={(e) => handleInputChange("rentAmount", e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                    errors.rentAmount ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400"
                  }`}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
              {errors.rentAmount && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                  {errors.rentAmount}
                </p>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-gray-700">
              <Users className="w-4 h-4 mr-2 text-orange-600" />
              Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange("status", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
            >
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Under Maintenance">Under Maintenance</option>
            </select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-gray-700">
              <FileText className="w-4 h-4 mr-2 text-gray-600" />
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none hover:border-gray-400"
              placeholder="Optional description of the unit..."
            />
          </div>

          {/* Unit Image */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-gray-700">
              <Camera className="w-4 h-4 mr-2 text-purple-600" />
              Unit Image
            </label>
            
            {imageURL ? (
              <div className="relative inline-block">
                <img 
                  src={imageURL} 
                  alt="Unit preview" 
                  className="w-24 h-24 object-cover rounded-xl border border-gray-200"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="unit-image-upload"
                  disabled={uploadingImage}
                />
                <label 
                  htmlFor="unit-image-upload" 
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  {uploadingImage ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-600">Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Upload unit image</p>
                        <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
                      </div>
                    </>
                  )}
                </label>
              </div>
            )}
            
            {errors.image && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                {errors.image}
              </p>
            )}
          </div>

          {/* Room Management */}
          <div className="space-y-4">
            <RoomManager 
              rooms={rooms} 
              onRoomsChange={setRooms} 
            />
          </div>

          </form>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex space-x-3 p-6 pt-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 px-6 py-3 font-semibold"
              disabled={loading}
            >
              Cancel
            </Button>
            {!unit && (
              <Button
                type="button"
                onClick={handleSubmitAndAddAnother}
                className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save & Add Another"}
              </Button>
            )}
            <Button
              type="button"
              onClick={(e) => {
                console.log("Update Unit button clicked - calling handleSubmit directly");
                e.preventDefault();
                handleSubmit(e as React.FormEvent);
              }}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={loading}
            >
              {loading ? "Saving..." : unit ? "Update Unit" : "Add Unit"}
            </Button>
          </div>
      </motion.div>
    </div>
  );
}
