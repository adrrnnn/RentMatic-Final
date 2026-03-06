'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface PaymentMethodIconProps {
  icon: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PaymentMethodIcon({ icon, size = 'md', className = '' }: PaymentMethodIconProps) {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  // Prefer local optimized SVGs from public/payment-logos
  const getLogoUrl = (iconName: string) => {
    const normalized = String(iconName || '').toLowerCase();
    const fileMap: Record<string, string> = {
      'gcash': '/payment-logos/gcash.svg',
      'paymaya': '/payment-logos/maya.svg',
      'maya': '/payment-logos/maya.svg',
      'grabpay': '/payment-logos/grabpay.svg',
      'shopeepay': '/payment-logos/shopeepay.svg',
      'bpi': '/payment-logos/bpi.svg',
      'bdo': '/payment-logos/bdo.svg',
      'rcbc': '/payment-logos/rcbc.svg',
      'metrobank': '/payment-logos/metrobank.svg',
      '7eleven': '/payment-logos/7eleven.svg',
      'cebuana': '/payment-logos/cebuana.svg',
      'credit_card': '/payment-logos/credit-card.svg'
    };
    return fileMap[normalized] || '';
  };

  const logoUrl = getLogoUrl(icon);

  // Try to load real logo first
  if (logoUrl && !imageError) {
    return (
      <div className={`${sizeClasses[size]} ${className}`}>
        <Image
          src={logoUrl}
          alt={`${icon} logo`}
          width={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
          height={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
          className="w-full h-full object-contain rounded-lg"
          onError={() => setImageError(true)}
          unoptimized
        />
      </div>
    );
  }

  // Fallback to professional branded icons
  const getFallbackIcon = (iconName: string) => {
    const baseClasses = `${sizeClasses[size]} rounded-lg flex items-center justify-center ${className}`;
    
    switch (iconName) {
      case 'gcash':
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg`}>
            <span className="text-white font-bold text-xs">GC</span>
          </div>
        );
      case 'maya':
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg`}>
            <span className="text-white font-bold text-xs">M</span>
          </div>
        );
      case 'grabpay':
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-green-500 to-green-600 shadow-lg`}>
            <span className="text-white font-bold text-xs">G</span>
          </div>
        );
      case 'bpi':
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-red-500 to-red-600 shadow-lg`}>
            <span className="text-white font-bold text-xs">BPI</span>
          </div>
        );
      case 'bdo':
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg`}>
            <span className="text-white font-bold text-xs">BDO</span>
          </div>
        );
      case 'metrobank':
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg`}>
            <span className="text-white font-bold text-xs">MB</span>
          </div>
        );
      case '7eleven':
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-green-600 to-green-700 shadow-lg`}>
            <span className="text-white font-bold text-xs">7</span>
          </div>
        );
      case 'cebuana':
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg`}>
            <span className="text-white font-bold text-xs">C</span>
          </div>
        );
      case 'cash':
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-gray-500 to-gray-600 shadow-lg`}>
            <span className="text-white font-bold text-xs">₱</span>
          </div>
        );
      default:
        return (
          <div className={`${baseClasses} bg-gray-200 shadow-lg`}>
            <span className="text-gray-500 font-bold text-xs">?</span>
          </div>
        );
    }
  };

  return getFallbackIcon(icon);
}













