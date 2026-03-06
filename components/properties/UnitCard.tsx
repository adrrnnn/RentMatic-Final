"use client";

import { motion } from "framer-motion";
import { Building2, User, DollarSign, Edit, Trash2, UserCheck } from "lucide-react";
import type { Unit, Tenant } from "@/types/firestore";
import { Button } from "@/components/Button";

interface UnitCardProps {
  unit: Unit;
  tenant?: Tenant | null;
  propertyId?: string;
}

export function UnitCard({ unit, tenant }: UnitCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Occupied':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Available':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Under Maintenance':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Occupied':
        return UserCheck;
      case 'Available':
        return Building2;
      case 'Under Maintenance':
        return Building2;
      default:
        return Building2;
    }
  };

  const StatusIcon = getStatusIcon(unit.status);

  const handleEdit = () => {
    // TODO: Implement edit unit functionality
    console.log("Edit unit:", unit.id);
  };

  const handleDelete = () => {
    // TODO: Implement delete unit functionality with confirmation
    console.log("Delete unit:", unit.id);
  };

  const handleAssignTenant = () => {
    // TODO: Implement assign tenant functionality
    console.log("Assign tenant to unit:", unit.id);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      className="bg-white rounded-3xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 overflow-hidden"
    >
      <div className="flex min-h-[200px]">
        {/* Left Side - Image */}
        <div className="w-64 flex-shrink-0">
          {unit.imageURL ? (
            <img 
              src={unit.imageURL} 
              alt={`${unit.name} unit`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
              <div className="text-center">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400 font-medium">No Image</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Content */}
        <div className="flex-1 p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-2xl mb-1">{unit.name}</h4>
                <p className="text-base text-gray-600">Floor {unit.floor}</p>
              </div>
            </div>
            
            <span className={`px-5 py-3 text-sm font-bold rounded-full border-2 ${getStatusColor(unit.status)}`}>
              <StatusIcon className="w-5 h-5 inline mr-2" />
              {unit.status}
            </span>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
            {/* Rent Information */}
            <div className="space-y-4">
              <h5 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Rental Details
              </h5>
              <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      ₱{unit.rentAmount.toLocaleString()}
                    </div>
                    <div className="text-base text-gray-600 font-medium">per {unit.rentType.toLowerCase()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tenant Information */}
            <div className="space-y-4">
              <h5 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center">
                <User className="w-4 h-4 mr-2" />
                Tenant Information
              </h5>
              {tenant ? (
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-lg truncate">
                        {tenant.fullName}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {tenant.contact?.email}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl border-2 border-gray-100">
                  <div className="flex items-center gap-4 text-gray-500">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                      <User className="w-6 h-6" />
                    </div>
                    <span className="font-semibold text-lg">No tenant assigned</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            {unit.status === 'Available' ? (
              <Button
                onClick={handleAssignTenant}
                className="flex-1 flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <User className="w-5 h-5" />
                Assign Tenant
              </Button>
            ) : (
              <Button
                onClick={handleAssignTenant}
                variant="outline"
                className="flex-1 flex items-center justify-center gap-3 border-2 border-green-200 text-green-700 hover:bg-green-50 font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <User className="w-5 h-5" />
                Reassign Tenant
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={handleEdit}
              className="flex items-center justify-center px-6 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Edit className="w-5 h-5" />
            </Button>
            
            <Button
              variant="outline"
              onClick={handleDelete}
              className="flex items-center justify-center px-6 border-2 border-red-200 text-red-600 hover:bg-red-50 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
