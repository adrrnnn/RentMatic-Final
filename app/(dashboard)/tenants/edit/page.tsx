"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { TenantService } from "@/lib/firestore/properties/tenantService";
import type { Tenant, UpdateTenantData } from "@/types/firestore";
import { Timestamp } from "firebase/firestore";

function EditTenantContent() {
  const { user } = useUserStore();
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    leaseStartDateInput: "",
    leaseEndDateInput: "",
    leaseTerms: "",
    securityDeposit: 0,
    notes: "",
  });

  useEffect(() => {
    if (!user?.id || !id) return;
    (async () => {
      const t = await TenantService.getTenant(user.id, id);
      if (t) {
        setTenant(t);
        setForm({
          fullName: t.fullName,
          email: t.contact.email,
          phone: t.contact.phone || "",
          leaseStartDateInput: t.leaseStartDate ? new Date(t.leaseStartDate).toISOString().slice(0,10) : "",
          leaseEndDateInput: t.leaseEndDate ? new Date(t.leaseEndDate).toISOString().slice(0,10) : "",
          leaseTerms: t.leaseTerms || "",
          securityDeposit: t.securityDeposit || 0,
          notes: t.notes || "",
        });
      }
      setLoading(false);
    })();
  }, [user?.id, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !id) return;
    setSaving(true);
    try {
      const update: UpdateTenantData = {
        fullName: form.fullName,
        contact: {
          email: form.email,
          phone: form.phone,
        },
        leaseStartDate: form.leaseStartDateInput ? new Date(form.leaseStartDateInput + 'T00:00:00').toISOString() : undefined,
        leaseEndDate: form.leaseEndDateInput ? new Date(form.leaseEndDateInput + 'T00:00:00').toISOString() : undefined,
        leaseTerms: form.leaseTerms,
        securityDeposit: form.securityDeposit,
        notes: form.notes,
      };
      await TenantService.updateTenant(user.id, id, update);
      router.push(`/dashboard/tenants/detail?id=${id}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Tenant not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-green-100">
        <div className="mb-6">
          <Link href={`/dashboard/tenants/detail?id=${id}`} className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Tenant</span>
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Tenant</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Name</label>
            <input className="w-full border rounded-lg px-3 py-2" value={form.fullName} onChange={(e)=>setForm({...form, fullName:e.target.value})} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input type="email" className="w-full border rounded-lg px-3 py-2" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Contact</label>
              <input className="w-full border rounded-lg px-3 py-2" value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Lease Start Date</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2" value={form.leaseStartDateInput} onChange={(e)=>setForm({...form, leaseStartDateInput:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Lease End Date</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2" value={form.leaseEndDateInput} onChange={(e)=>setForm({...form, leaseEndDateInput:e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Lease Terms</label>
              <input className="w-full border rounded-lg px-3 py-2" value={form.leaseTerms} onChange={(e)=>setForm({...form, leaseTerms:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Security Deposit (₱)</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2" value={form.securityDeposit} onChange={(e)=>setForm({...form, securityDeposit:Number(e.target.value)})} min={0} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Notes</label>
            <textarea className="w-full border rounded-lg px-3 py-2" rows={3} value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})} />
          </div>
          <button type="submit" disabled={saving} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            {saving?"Saving...":"Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function EditTenantPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditTenantContent />
    </Suspense>
  );
}



