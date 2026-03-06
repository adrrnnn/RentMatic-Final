"use client";

import { motion } from "framer-motion";
import { User, Phone, Mail } from "lucide-react";
import type { Tenant } from "@/types/firestore";

interface TenantCardProps {
  tenant: Tenant;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  className?: string;
}

export function TenantCard({ 
  tenant, 
  isDragging = false, 
  onDragStart, 
  onDragEnd,
  className = "" 
}: TenantCardProps) {
  const getAssignmentStatus = () => {
    return tenant.unitId
      ? { text: "Assigned", color: "text-green-600 bg-green-100" }
      : { text: "Unassigned", color: "text-gray-600 bg-gray-100" };
  };

  const assignmentStatus = getAssignmentStatus();

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`
        bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-green-100 
        cursor-grab active:cursor-grabbing transition-all duration-200
        hover:shadow-xl hover:border-green-200 hover:scale-105
        ${isDragging ? 'z-50 shadow-2xl scale-110 rotate-1' : ''}
        ${className}
      `}
    >
      {/* Avatar and Name */}
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-md">
          <User className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{tenant.fullName}</h3>
          <p className="text-sm text-gray-500 truncate">{tenant.contact?.email}</p>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-3">
        {tenant.contact?.phone && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="w-4 h-4" />
            <span className="truncate">{tenant.contact?.phone}</span>
          </div>
        )}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Mail className="w-4 h-4" />
          <span className="truncate">{tenant.contact?.email}</span>
        </div>
      </div>

      {/* Assignment Status */}
      <div className="flex items-center justify-between">
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${assignmentStatus.color}`}>
          <span>{assignmentStatus.text}</span>
        </div>
        
        {/* Drag indicator */}
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
