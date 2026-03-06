"use client";

import { motion } from "framer-motion";
import { User, Mail, Phone, Calendar, MapPin, FileText } from "lucide-react";
import type { Property } from "@/types/firestore";

interface FormDataState {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  propertyId: string;
  moveInDate: string;
  rentType: "Monthly" | "Yearly" | "Custom";
  notes: string;
}

interface TenantPreviewCardProps {
  formData: FormDataState;
  selectedProperty?: Property;
}

export function TenantPreviewCard({ formData, selectedProperty }: TenantPreviewCardProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mt-6"
    >
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mr-4">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Tenant Preview</h3>
          <p className="text-sm text-gray-600">Review tenant information</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center text-sm text-gray-600">
          <User className="w-4 h-4 mr-3 text-gray-400" />
          <span className="font-medium">Name:</span>
          <span className="ml-2">{formData.fullName || "Not provided"}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <Mail className="w-4 h-4 mr-3 text-gray-400" />
          <span className="font-medium">Email:</span>
          <span className="ml-2">{formData.email || "Not provided"}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <Phone className="w-4 h-4 mr-3 text-gray-400" />
          <span className="font-medium">Phone:</span>
          <span className="ml-2">{formData.phone || "Not provided"}</span>
        </div>
        
        {formData.address && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-3 text-gray-400" />
            <span className="font-medium">Address:</span>
            <span className="ml-2">{formData.address}</span>
          </div>
        )}
        
        {selectedProperty && (
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium">Property:</span>
            <span className="ml-2 text-green-600 font-medium">{selectedProperty.name}</span>
          </div>
        )}
        
        {formData.moveInDate && (
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-3 text-gray-400" />
            <span className="font-medium">Move-in Date:</span>
            <span className="ml-2">{formatDate(formData.moveInDate)}</span>
          </div>
        )}
        
        {formData.rentType && (
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium">Rent Type:</span>
            <span className="ml-2 text-blue-600 font-medium">{formData.rentType}</span>
          </div>
        )}
        
        {formData.notes && (
          <div className="flex items-start text-sm text-gray-600">
            <FileText className="w-4 h-4 mr-3 text-gray-400 mt-0.5" />
            <div>
              <span className="font-medium">Notes:</span>
              <p className="ml-2 mt-1 text-gray-700">{formData.notes}</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}


