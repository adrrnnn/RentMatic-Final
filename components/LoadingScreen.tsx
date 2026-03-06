"use client";

import { motion } from "framer-motion";
import { Building2 } from "lucide-react";

interface LoadingScreenProps {
  text?: string;
  subtext?: string;
}

export function LoadingScreen({ 
  text = "Loading your dashboard...", 
  subtext = "Checking authentication..." 
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-50">
      <div className="text-center">
        {/* Simple Loading Spinner */}
        <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>

        {/* Loading Text */}
        <div className="space-y-2">
          <p className="text-lg font-semibold text-gray-700">{text}</p>
          <p className="text-sm text-gray-500">{subtext}</p>
        </div>
      </div>
    </div>
  );
}
