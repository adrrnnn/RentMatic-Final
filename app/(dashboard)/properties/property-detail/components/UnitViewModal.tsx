"use client";

import { motion } from "framer-motion";
import { X, Home, Building2, User, DollarSign, Calendar, FileText, Shield, Camera, Bed, Bath, Utensils, Sofa, Square, ZoomIn, Trash2 } from "lucide-react";
import { Button } from "@/components/Button";
import type { Unit, Tenant, Room } from "@/types/firestore";
import { useState } from "react";

interface UnitViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: Unit | null;
  assignedTenant?: Tenant | null;
  onRemoveTenant?: (unit: Unit) => void;
}

export function UnitViewModal({
  isOpen,
  onClose,
  unit,
  assignedTenant,
  onRemoveTenant
}: UnitViewModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedRoomName, setSelectedRoomName] = useState<string>("");
  const [showTenantInfo, setShowTenantInfo] = useState(false);

  if (!isOpen || !unit) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800 border-green-200";
      case "Occupied":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Under Maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Available":
        return "🟢";
      case "Occupied":
        return "🔵";
      case "Under Maintenance":
        return "🟡";
      default:
        return "⚪";
    }
  };

  const formatRentAmount = (amount: number, type: string) => {
    const formatted = amount.toLocaleString();
    switch (type) {
      case "Monthly":
        return `₱${formatted}/month`;
      case "Quarterly":
        return `₱${formatted}/quarter`;
      case "Yearly":
        return `₱${formatted}/year`;
      case "Nightly":
        return `₱${formatted}/night`;
      default:
        return `₱${formatted}`;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  const getRoomIcon = (type: string) => {
    switch (type) {
      case "bedroom":
        return <Bed className="w-5 h-5" />;
      case "bathroom":
        return <Bath className="w-5 h-5" />;
      case "living_room":
        return <Sofa className="w-5 h-5" />;
      case "kitchen":
        return <Utensils className="w-5 h-5" />;
      case "dining_room":
        return <Utensils className="w-5 h-5" />;
      case "balcony":
        return <Square className="w-5 h-5" />;
      default:
        return <Home className="w-5 h-5" />;
    }
  };

  const handleImageClick = (imageURL: string, roomName: string) => {
    setSelectedImage(imageURL);
    setSelectedRoomName(roomName);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    setSelectedRoomName("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999] overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{unit.name}</h2>
              <p className="text-sm text-gray-500">Unit Information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Unit Status and Basic Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-gray-600" />
                  <span className="text-lg font-medium text-gray-900">{unit.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Floor {unit.floor}</span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(unit.status)}`}>
                {getStatusIcon(unit.status)} {unit.status}
              </span>
            </div>

            {/* Rent Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Rent Amount</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatRentAmount(unit.rentAmount, unit.rentType)}
                  </p>
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-medium text-gray-500">Rent Type</h3>
                  <p className="text-lg font-semibold text-gray-900">{unit.rentType}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {unit.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                <p className="text-gray-700">{unit.description}</p>
              </div>
            )}

            {/* Unit Icon */}
            {unit.imageURL && (
              <div className="flex items-center space-x-4">
                <div 
                  className="cursor-pointer group"
                  onClick={() => handleImageClick(unit.imageURL!, `${unit.name} Unit`)}
                >
                  <img 
                    src={unit.imageURL} 
                    alt={`${unit.name} unit`}
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200 transition-transform group-hover:scale-105"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Unit Icon</h3>
                  <p className="text-xs text-gray-400">Click to view full image</p>
                </div>
              </div>
            )}

            {/* Rooms Section */}
            {unit.rooms && unit.rooms.length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Home className="w-5 h-5 mr-2 text-gray-600" />
                  Rooms ({unit.rooms.length})
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {unit.rooms.map((room: Room) => (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleImageClick(room.imageURL || '', room.name)}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Room Image */}
                        <div className="w-16 h-16 flex-shrink-0">
                          {room.imageURL ? (
                            <img
                              src={room.imageURL}
                              alt={room.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                              {getRoomIcon(room.type)}
                            </div>
                          )}
                        </div>
                        
                        {/* Room Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            {getRoomIcon(room.type)}
                            <h4 className="font-medium text-gray-900 capitalize">{room.type.replace('_', ' ')}</h4>
                          </div>
                          <p className="text-sm text-gray-500 mb-1">{room.name}</p>
                          {room.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">{room.description}</p>
                          )}
                          <p className="text-xs text-blue-600 mt-2">Click to view details</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Tenant Assignment */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-gray-600" />
                Tenant Assignment
              </h3>
              
              {assignedTenant ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {assignedTenant.fullName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{assignedTenant.fullName}</h4>
                      <p className="text-sm text-gray-600">{assignedTenant.contact.email}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-4 h-4 mr-2">📞</span>
                      {assignedTenant.contact.phone}
                    </div>
                    {assignedTenant.moveInDate && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        Move-in: {formatDate(assignedTenant.moveInDate)}
                      </div>
                    )}
                  </div>
                  
                  {assignedTenant.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Notes</label>
                      <p className="text-sm text-gray-700">{assignedTenant.notes}</p>
                    </div>
                  )}
                  
                  {/* Tenant Actions */}
                  {onRemoveTenant && (
                    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setShowTenantInfo(true)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center space-x-1"
                        >
                          <User className="w-3 h-3" />
                          <span>View Info</span>
                        </button>
                      </div>
                      
                      <button
                        onClick={() => onRemoveTenant(unit)}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        title="Remove Tenant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">No tenant assigned</p>
                  <p className="text-sm text-gray-500 mt-1">This unit is available for assignment</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-200 bg-gray-50">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>

              {/* Image Lightbox Modal */}
              {selectedImage && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[10000]">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative max-w-4xl max-h-[90vh] w-full"
                  >
                    {/* Close Button */}
                    <button
                      onClick={closeImageModal}
                      className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
                    >
                      <X className="w-8 h-8" />
                    </button>

                    {/* Image */}
                    <img
                      src={selectedImage}
                      alt={selectedRoomName}
                      className="w-full h-full object-contain rounded-lg"
                    />

                    {/* Room Name */}
                    <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg">
                      <p className="font-medium">{selectedRoomName}</p>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Tenant Info Modal */}
              {showTenantInfo && assignedTenant && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[10000]">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            {assignedTenant.fullName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">{assignedTenant.fullName}</h2>
                          <p className="text-sm text-gray-600">Tenant Information</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowTenantInfo(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                      {/* Contact Information */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h3>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="w-4 h-4">📧</span>
                            <span className="text-sm text-gray-700">{assignedTenant.contact.email}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="w-4 h-4">📞</span>
                            <span className="text-sm text-gray-700">{assignedTenant.contact.phone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Lease Information */}
                      {(assignedTenant.leaseStartDate || assignedTenant.leaseEndDate) && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-2">Lease Information</h3>
                          <div className="space-y-2">
                            {assignedTenant.leaseStartDate && (
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-700">
                                  Start: {formatDate(assignedTenant.leaseStartDate)}
                                </span>
                              </div>
                            )}
                            {assignedTenant.leaseEndDate && (
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-700">
                                  End: {formatDate(assignedTenant.leaseEndDate)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Move-in Date */}
                      {assignedTenant.moveInDate && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-2">Move-in Date</h3>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">{formatDate(assignedTenant.moveInDate)}</span>
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {assignedTenant.notes && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{assignedTenant.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-200 flex justify-end">
                      <button
                        onClick={() => setShowTenantInfo(false)}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          );
        }
