"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Home } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import type { Tenant, Unit } from "@/types/firestore";
import { TenantService } from "@/lib/firestore/properties/tenantService";
import { PropertyService } from "@/lib/firestore/properties/propertyService";

function TenantDetailContent() {
  const { user } = useUserStore();
  const params = useSearchParams();
  const tenantId = params.get("id");

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);

  useEffect(() => {
    if (!user?.id || !tenantId) return;
    (async () => {
      const t = await TenantService.getTenant(user.id, tenantId);
      if (t) {
        setTenant(t);
        if (t.propertyId && t.unitId) {
          const u = await PropertyService.getUnit(user.id, t.propertyId, t.unitId);
          if (u) setUnit(u);
        }
      }
    })();
  }, [user?.id, tenantId]);

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-green-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Tenant Not Found</h2>
          <Link href="/tenants" className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Tenants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-green-100">
        <div className="mb-6">
          <Link href="/tenants" className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Tenants</span>
          </Link>
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{tenant.fullName}</h1>
            <p className="text-gray-600">{tenant.contact.email} • {tenant.contact.phone || 'No phone'}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-green-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Assigned Unit</h3>
            {tenant.propertyId && tenant.unitId && unit ? (
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-green-100 text-green-600"><Home className="w-4 h-4" /></div>
                  <div>
                    <p className="font-medium text-gray-900">Unit #{unit.name}</p>
                    <p className="text-sm text-gray-600">Status: {unit.status}</p>
                  </div>
                </div>
                <Link href={`/properties/unit?propertyId=${tenant.propertyId}&unitId=${tenant.unitId}`} className="text-sm text-green-600 hover:text-green-700">View Unit</Link>
              </div>
            ) : (
              <div className="text-sm text-gray-600 border-2 border-dashed rounded-xl p-6 text-center bg-gray-50">Unassigned</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TenantDetailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TenantDetailContent />
    </Suspense>
  );
}



