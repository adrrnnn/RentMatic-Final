"use client";

import { motion } from "framer-motion";
import { BarChart3, Building2, Users } from "lucide-react";
import type { Unit, Tenant } from "@/types/firestore";

interface MinimalPropertyInfo {
  id: string;
  name?: string;
}

interface PropertyDetailsTabsProps {
  activeTab: 'overview' | 'units' | 'tenants';
  onTabChange: (tab: 'overview' | 'units' | 'tenants') => void;
  property: MinimalPropertyInfo;
  units: Unit[];
  tenants: Tenant[];
}

export function PropertyDetailsTabs({ 
  activeTab, 
  onTabChange, 
  units, 
  tenants 
}: PropertyDetailsTabsProps) {
  const tabs = [
    {
      id: 'overview' as const,
      label: 'Overview',
      icon: BarChart3,
      count: null
    },
    {
      id: 'units' as const,
      label: 'Units',
      icon: Building2,
      count: units.length
    },
    {
      id: 'tenants' as const,
      label: 'Tenants',
      icon: Users,
      count: tenants.length
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="flex border-b border-gray-100">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
                isActive
                  ? 'text-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  isActive
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
              
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
