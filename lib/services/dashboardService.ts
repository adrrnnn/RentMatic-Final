import { getClientDb } from '@/lib/firebase';
// Removed unused imports
import { PropertyService } from '@/lib/firestore/properties/propertyService';
import { TenantService } from '@/lib/firestore/properties/tenantService';
import { UnitService } from '@/lib/firestore/properties/unitService';
import { PaymentRequestService } from '@/lib/services/paymentRequestService';
import { Property, Unit } from '@/types/firestore';

export interface DashboardStats {
  totalProperties: number;
  activeTenants: number;
  monthlyRevenue: number;
  pendingRequests: number;
  occupancyRate: number;
  totalUnits: number;
  occupiedUnits: number;
}

export interface RecentActivity {
  id: string;
  type: 'property' | 'tenant' | 'payment' | 'request';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

export class DashboardService {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(userId: string): Promise<DashboardStats> {
    try {
      console.log('Fetching dashboard stats for user:', userId);
      const db = getClientDb();
      if (!db) throw new Error('Firestore not initialized');

      // Get all properties for the user
      console.log('Fetching properties...');
      const properties = await PropertyService.getProperties(userId);
      console.log('Properties found:', properties.length, properties);
      
      // Get all tenants for the user
      console.log('Fetching tenants...');
      const tenants = await TenantService.getTenants(userId);
      console.log('Tenants found:', tenants.length, tenants);
      
      // Get all units for the user
      console.log('Fetching units...');
      const units = await UnitService.getAllUnits(userId);
      console.log('Units found:', units.length, units);
      
      // Calculate stats
      const totalProperties = properties.length;
      const activeTenants = tenants.length;
      const totalUnits = units.length;
      const occupiedUnits = units.filter(unit => unit.tenantId).length;
      
      // Calculate monthly revenue from actual paid payments this month
      let monthlyRevenue = 0;
      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const payments = await PaymentRequestService.getPaymentRequests(userId);
        
        // Filter for paid payments this month
        const monthlyPayments = payments.filter(payment => {
          const paymentDate = payment.paidAt || payment.createdAt;
          const paymentDateObj = paymentDate instanceof Date 
            ? paymentDate 
            : (typeof paymentDate === 'object' && 'toDate' in paymentDate 
              ? paymentDate.toDate() 
              : new Date(paymentDate));
          return payment.status === 'paid' && paymentDateObj >= startOfMonth;
        });
        
        monthlyRevenue = monthlyPayments.reduce((sum, payment) => sum + payment.amount, 0);
      } catch (error) {
        console.warn('Error fetching payment data for monthly revenue, falling back to projected revenue:', error);
        // Fallback: Calculate projected revenue from unit rents if payment data unavailable
        for (const unit of units) {
          if (unit.rentAmount && unit.tenantId) {
            monthlyRevenue += unit.rentAmount;
          }
        }
      }
      
      // Calculate occupancy rate
      const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
      
      // For now, pending requests is 0 (we can add this later)
      const pendingRequests = 0;

      const stats = {
        totalProperties,
        activeTenants,
        monthlyRevenue,
        pendingRequests,
        occupancyRate: Math.round(occupancyRate),
        totalUnits,
        occupiedUnits
      };

      console.log('Dashboard stats calculated:', stats);
      return stats;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return default values on error
      return {
        totalProperties: 0,
        activeTenants: 0,
        monthlyRevenue: 0,
        pendingRequests: 0,
        occupancyRate: 0,
        totalUnits: 0,
        occupiedUnits: 0
      };
    }
  }

  /**
   * Get recent activity
   */
  static async getRecentActivity(userId: string): Promise<RecentActivity[]> {
    try {
      const db = getClientDb();
      if (!db) throw new Error('Firestore not initialized');

      // Get recent properties
      const properties = await PropertyService.getProperties(userId);
      const recentProperties = properties
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3)
        .map(property => ({
          id: property.id,
          type: 'property' as const,
          title: `Property "${property.name}" added`,
          description: `New property at ${property.address}`,
          timestamp: property.createdAt,
          icon: 'Building2'
        }));

      // Get recent tenants
      const tenants = await TenantService.getTenants(userId);
      const recentTenants = tenants
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 2)
        .map(tenant => ({
          id: tenant.id,
          type: 'tenant' as const,
          title: `Tenant "${tenant.fullName}" added`,
          description: `New tenant with email ${tenant.contact.email}`,
          timestamp: tenant.createdAt,
          icon: 'Users'
        }));

      // Combine and sort by timestamp
      const allActivities = [...recentProperties, ...recentTenants]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);

      return allActivities;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }

  /**
   * Get dashboard data with real-time updates
   */
  static async getDashboardData(userId: string): Promise<{
    stats: DashboardStats;
    recentActivity: RecentActivity[];
    properties: Property[];
    units: Unit[];
  }> {
    try {
      const [stats, recentActivity, properties, units] = await Promise.all([
        this.getDashboardStats(userId),
        this.getRecentActivity(userId),
        PropertyService.getProperties(userId),
        UnitService.getAllUnits(userId)
      ]);

      return {
        stats,
        recentActivity,
        properties,
        units
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return {
        stats: {
          totalProperties: 0,
          activeTenants: 0,
          monthlyRevenue: 0,
          pendingRequests: 0,
          occupancyRate: 0,
          totalUnits: 0,
          occupiedUnits: 0
        },
        recentActivity: [],
        properties: [],
        units: []
      };
    }
  }
}
