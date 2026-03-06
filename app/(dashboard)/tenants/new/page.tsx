"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { TenantService } from "@/lib/firestore/properties/tenantService";
import type { CreateTenantData } from "@/types/firestore";

export default function NewTenantPage() {
  const { user } = useUserStore();
  const router = useRouter();
  const [form, setForm] = useState<CreateTenantData & {
    leaseStartDateInput?: string;
    leaseEndDateInput?: string;
  }>({
    fullName: "",
    contact: { email: "", phone: "" },
    notes: "",
    leaseStartDateInput: "",
    leaseEndDateInput: "",
    leaseTerms: "",
    securityDeposit: undefined
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    try {
      const payload: CreateTenantData = {
        fullName: form.fullName,
        contact: { email: form.contact.email, phone: form.contact.phone },
        notes: form.notes,
        leaseTerms: form.leaseTerms,
        securityDeposit: form.securityDeposit,
        leaseStartDate: form.leaseStartDateInput ? new Date(form.leaseStartDateInput + 'T00:00:00').toISOString() : undefined,
        leaseEndDate: form.leaseEndDateInput ? new Date(form.leaseEndDateInput + 'T00:00:00').toISOString() : undefined,
      };
      await TenantService.createTenant(user.id, payload);
      router.push("/tenants");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-green-100">
        <div className="mb-6">
          <Link href="/tenants" className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Tenants</span>
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Add Tenant</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Full Name</label>
            <input className="w-full border rounded-lg px-3 py-2" value={form.fullName} onChange={(e)=>setForm({...form, fullName:e.target.value})} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input type="email" className="w-full border rounded-lg px-3 py-2" value={form.contact.email} onChange={(e)=>setForm({...form, contact: { ...form.contact, email: e.target.value }})} required />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Contact</label>
              <input className="w-full border rounded-lg px-3 py-2" value={form.contact.phone} onChange={(e)=>setForm({...form, contact: { ...form.contact, phone: e.target.value }})} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Notes</label>
            <textarea className="w-full border rounded-lg px-3 py-2" rows={3} value={form.notes || ""} onChange={(e)=>setForm({...form, notes:e.target.value})} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Lease Start Date</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2" value={form.leaseStartDateInput || ""} onChange={(e)=>setForm({...form, leaseStartDateInput: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Lease End Date</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2" value={form.leaseEndDateInput || ""} onChange={(e)=>setForm({...form, leaseEndDateInput: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Lease Terms</label>
              <input className="w-full border rounded-lg px-3 py-2" value={form.leaseTerms || ""} onChange={(e)=>setForm({...form, leaseTerms: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Security Deposit (₱)</label>
              <input type="number" min={0} className="w-full border rounded-lg px-3 py-2" value={form.securityDeposit ?? ""} onChange={(e)=>setForm({...form, securityDeposit: e.target.value === '' ? undefined : Number(e.target.value)})} />
            </div>
          </div>
          <button type="submit" disabled={saving} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            {saving?"Saving...":"Create Tenant"}
          </button>
        </form>
      </div>
    </div>
  );
}


