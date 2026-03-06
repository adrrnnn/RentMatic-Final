"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Home, MapPin, DollarSign, Users, Camera, Eye } from "lucide-react";
import { Button } from "@/components/Button";
import type { Unit, Property } from "@/types/firestore";

interface TenantUnitViewerProps {
  property: Property;
  units: Unit[];
  onClose: () => void;
}

export function TenantUnitViewer({ property, units, onClose }: TenantUnitViewerProps) {
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  const availableUnits = units.filter(unit => unit.status === "Available");

  const formatRentAmount = (amount: number, type: string) => {
    return `₱${amount.toLocaleString()}/${type.toLowerCase()}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999] overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Available Units</h2>
              <p className="text-sm text-gray-600 font-medium">{property.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-3 hover:bg-gray-100 rounded-xl"
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {selectedUnit ? (
            /* Unit Detail View */
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setSelectedUnit(null)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← Back to Units
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Unit Images */}
                <div className="space-y-4">
                  {selectedUnit.imageURL && (
                    <div className="aspect-video rounded-xl overflow-hidden">
                      <img
                        src={selectedUnit.imageURL}
                        alt={selectedUnit.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Room Images */}
                  {selectedUnit.rooms && selectedUnit.rooms.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Rooms</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedUnit.rooms.map((room) => (
                          <div key={room.id} className="space-y-2">
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                              {room.imageURL ? (
                                <img
                                  src={room.imageURL}
                                  alt={room.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Home className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-900">{room.name}</p>
                            {room.description && (
                              <p className="text-xs text-gray-600">{room.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Unit Details */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedUnit.name}</h3>
                    <p className="text-gray-600">Floor {selectedUnit.floor}</p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-2">
                      <DollarSign className="w-6 h-6 text-green-600" />
                      <span className="text-2xl font-bold text-green-800">
                        {formatRentAmount(selectedUnit.rentAmount, selectedUnit.rentType)}
                      </span>
                    </div>
                    <p className="text-green-700">Available for immediate move-in</p>
                  </div>

                  {selectedUnit.description && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                      <p className="text-gray-600">{selectedUnit.description}</p>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h4 className="font-semibold text-blue-900 mb-2">Interested in this unit?</h4>
                    <p className="text-blue-700 text-sm mb-4">
                      Contact the property manager to schedule a viewing or apply for this unit.
                    </p>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      Contact Property Manager
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Units List View */
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {availableUnits.length} Available Units
                </h3>
                <p className="text-gray-600">
                  Click on any unit to view details, room photos, and rental information.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableUnits.map((unit) => (
                  <motion.div
                    key={unit.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    onClick={() => setSelectedUnit(unit)}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer"
                  >
                    <div className="aspect-video rounded-lg overflow-hidden mb-4 bg-gray-100">
                      {unit.imageURL ? (
                        <img
                          src={unit.imageURL}
                          alt={unit.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900">{unit.name}</h4>
                      <p className="text-sm text-gray-600">Floor {unit.floor}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-600">
                          {formatRentAmount(unit.rentAmount, unit.rentType)}
                        </span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Available
                        </span>
                      </div>
                      {unit.rooms && unit.rooms.length > 0 && (
                        <p className="text-xs text-gray-500">
                          {unit.rooms.length} room{unit.rooms.length > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {availableUnits.length === 0 && (
                <div className="text-center py-12">
                  <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Available Units</h3>
                  <p className="text-gray-600">All units are currently occupied.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}















