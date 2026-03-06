"use client";

import { motion } from "framer-motion";
import { User } from "lucide-react";
import type { Tenant } from "@/types/properties";

interface DraggableTenantAvatarProps {
  tenant: Tenant;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging?: boolean;
}

export function DraggableTenantAvatar({
  tenant,
  onDragStart,
  onDragEnd,
  isDragging = false,
}: DraggableTenantAvatarProps) {
  const handleDragStart = (e: React.DragEvent) => {
    // Attach tenant id to the drag payload
    try {
      e.dataTransfer.setData('application/tenant-id', tenant.id);
      e.dataTransfer.effectAllowed = 'copyMove';
    } catch {}
    // Create animated person avatar for drag
    const dragImage = document.createElement('div');
    dragImage.style.cssText = `
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #10b981, #059669);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
      position: absolute;
      top: -1000px;
      left: -1000px;
    `;
    
    // Add animated person icon (SVG, not emoji)
    dragImage.innerHTML = `
      <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
    `;
    
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 30, 30);
    setTimeout(() => document.body.removeChild(dragImage), 0);
    
    onDragStart();
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.95 }}
      animate={isDragging ? { scale: 0.9, opacity: 0.5 } : { scale: 1, opacity: 1 }}
    >
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        className={`group cursor-grab active:cursor-grabbing bg-white rounded-xl p-4 shadow-lg border-2 transition-all duration-300 ${
          isDragging
            ? "border-green-400 border-dashed"
            : "border-green-200 hover:border-green-400 hover:shadow-xl"
        }`}
      >
      <div className="flex items-center space-x-3">
        {/* Animated Avatar */}
        <motion.div
          whileHover={{ rotate: [0, -5, 5, -5, 0], scale: 1.1 }}
          transition={{ duration: 0.5 }}
          className="relative w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg group-hover:shadow-xl"
        >
          <User className="w-6 h-6 text-white" />
          
          {/* Pulse effect on hover */}
          <motion.div
            className="absolute inset-0 rounded-full bg-green-400"
            initial={{ scale: 1, opacity: 0 }}
            whileHover={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
        </motion.div>

        {/* Tenant Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate group-hover:text-green-700 transition-colors">
            {tenant.name}
          </p>
          <p className="text-sm text-gray-600 truncate">
            ₱{(tenant.monthlyRent || 0).toLocaleString()}/mo
          </p>
        </div>

        {/* Drag Indicator */}
        <motion.div
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <circle cx="6" cy="4" r="1.5" />
            <circle cx="6" cy="10" r="1.5" />
            <circle cx="6" cy="16" r="1.5" />
            <circle cx="14" cy="4" r="1.5" />
            <circle cx="14" cy="10" r="1.5" />
            <circle cx="14" cy="16" r="1.5" />
          </svg>
        </motion.div>
      </div>

        {/* Drag instruction */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          whileHover={{ opacity: 1, height: 'auto' }}
          className="text-xs text-green-600 font-medium mt-2 text-center overflow-hidden"
        >
          Drag to assign
        </motion.div>
      </div>
    </motion.div>
  );
}

