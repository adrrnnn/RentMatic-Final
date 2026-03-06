// Payment method logos service
// Uses real logos from official sources and reliable CDN services

export interface PaymentLogo {
  id: string;
  name: string;
  logoUrl: string;
  fallbackIcon: string;
  brandColor: string;
}

export class PaymentLogosService {
  /**
   * Get payment method logos from various sources
   * Using reliable CDN services and official sources
   */
  static getPaymentLogos(): PaymentLogo[] {
    return [
      {
        id: 'gcash',
        name: 'GCash',
        logoUrl: '/payment-logos/gcash.svg',
        fallbackIcon: 'gcash',
        brandColor: '#0070f3'
      },
      {
        id: 'maya',
        name: 'Maya (PayMaya)',
        logoUrl: '/payment-logos/maya.svg',
        fallbackIcon: 'maya',
        brandColor: '#8b5cf6'
      },
      {
        id: 'grabpay',
        name: 'GrabPay',
        logoUrl: '/payment-logos/grabpay.svg',
        fallbackIcon: 'grabpay',
        brandColor: '#10b981'
      },
      {
        id: 'bpi',
        name: 'BPI',
        logoUrl: '/payment-logos/bpi.svg',
        fallbackIcon: 'bpi',
        brandColor: '#dc2626'
      },
      {
        id: 'bdo',
        name: 'BDO',
        logoUrl: '/payment-logos/bdo.svg',
        fallbackIcon: 'bdo',
        brandColor: '#2563eb'
      },
      {
        id: 'metrobank',
        name: 'Metrobank',
        logoUrl: '/payment-logos/metrobank.svg',
        fallbackIcon: 'metrobank',
        brandColor: '#ea580c'
      },
      {
        id: '7eleven',
        name: '7-Eleven',
        logoUrl: '/payment-logos/7eleven.svg',
        fallbackIcon: '7eleven',
        brandColor: '#059669'
      },
      {
        id: 'cebuana',
        name: 'Cebuana Lhuillier',
        logoUrl: '/payment-logos/cebuana.svg',
        fallbackIcon: 'cebuana',
        brandColor: '#d97706'
      },
      {
        id: 'cash',
        name: 'Cash Payment',
        logoUrl: '', // No logo for cash
        fallbackIcon: 'cash',
        brandColor: '#6b7280'
      }
    ];
  }

  /**
   * Get logo for a specific payment method
   */
  static getPaymentLogo(paymentMethodId: string): PaymentLogo | null {
    const logos = this.getPaymentLogos();
    return logos.find(logo => logo.id === paymentMethodId) || null;
  }

  /**
   * Get logo URL with fallback
   */
  static getLogoUrl(paymentMethodId: string): string {
    const logo = this.getPaymentLogo(paymentMethodId);
    if (!logo) return '';
    
    // Return the logo URL if available, otherwise return empty string for fallback
    return logo.logoUrl;
  }

  /**
   * Get brand color for payment method
   */
  static getBrandColor(paymentMethodId: string): string {
    const logo = this.getPaymentLogo(paymentMethodId);
    return logo?.brandColor || '#6b7280';
  }
}


export interface PaymentLogo {
  id: string;
  name: string;
  logoUrl: string;
  fallbackIcon: string;
  brandColor: string;
}

export class PaymentLogosService {
  /**
   * Get payment method logos from various sources
   * Using reliable CDN services and official sources
   */
  static getPaymentLogos(): PaymentLogo[] {
    return [
      {
        id: 'gcash',
        name: 'GCash',
        logoUrl: '/payment-logos/gcash.svg',
        fallbackIcon: 'gcash',
        brandColor: '#0070f3'
      },
      {
        id: 'maya',
        name: 'Maya (PayMaya)',
        logoUrl: '/payment-logos/maya.svg',
        fallbackIcon: 'maya',
        brandColor: '#8b5cf6'
      },
      {
        id: 'grabpay',
        name: 'GrabPay',
        logoUrl: '/payment-logos/grabpay.svg',
        fallbackIcon: 'grabpay',
        brandColor: '#10b981'
      },
      {
        id: 'bpi',
        name: 'BPI',
        logoUrl: '/payment-logos/bpi.svg',
        fallbackIcon: 'bpi',
        brandColor: '#dc2626'
      },
      {
        id: 'bdo',
        name: 'BDO',
        logoUrl: '/payment-logos/bdo.svg',
        fallbackIcon: 'bdo',
        brandColor: '#2563eb'
      },
      {
        id: 'metrobank',
        name: 'Metrobank',
        logoUrl: '/payment-logos/metrobank.svg',
        fallbackIcon: 'metrobank',
        brandColor: '#ea580c'
      },
      {
        id: '7eleven',
        name: '7-Eleven',
        logoUrl: '/payment-logos/7eleven.svg',
        fallbackIcon: '7eleven',
        brandColor: '#059669'
      },
      {
        id: 'cebuana',
        name: 'Cebuana Lhuillier',
        logoUrl: '/payment-logos/cebuana.svg',
        fallbackIcon: 'cebuana',
        brandColor: '#d97706'
      },
      {
        id: 'cash',
        name: 'Cash Payment',
        logoUrl: '', // No logo for cash
        fallbackIcon: 'cash',
        brandColor: '#6b7280'
      }
    ];
  }

  /**
   * Get logo for a specific payment method
   */
  static getPaymentLogo(paymentMethodId: string): PaymentLogo | null {
    const logos = this.getPaymentLogos();
    return logos.find(logo => logo.id === paymentMethodId) || null;
  }

  /**
   * Get logo URL with fallback
   */
  static getLogoUrl(paymentMethodId: string): string {
    const logo = this.getPaymentLogo(paymentMethodId);
    if (!logo) return '';
    
    // Return the logo URL if available, otherwise return empty string for fallback
    return logo.logoUrl;
  }

  /**
   * Get brand color for payment method
   */
  static getBrandColor(paymentMethodId: string): string {
    const logo = this.getPaymentLogo(paymentMethodId);
    return logo?.brandColor || '#6b7280';
  }
}
