"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, User, Mail, Phone, Calendar, CheckCircle } from "lucide-react";
import { Button } from "@/components/Button";
import { toast } from "react-hot-toast";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getClientDb } from "@/lib/firebase";
import { TenantService } from "@/lib/firestore/properties/tenantService";

function TenantInviteContent() {
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("code");
  const propertyId = searchParams.get("property");
  const landlordId = searchParams.get("landlord");
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    moveInDate: "",
    notes: ""
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    setError(null);
    
    try {
      // Create tenant registration in Firestore (anonymous collection)
      const db = getClientDb();
      if (!db) throw new Error('Firestore not initialized');

      const registrationData = {
        fullName: formData.fullName,
        contact: {
          email: formData.email,
          phone: formData.phone
        },
        moveInDate: formData.moveInDate || "",
        notes: formData.notes || "",
        propertyId: propertyId || null,
        landlordId: landlordId || null,
        inviteCode: inviteCode || null,
        status: "pending",
        createdAt: serverTimestamp()
      };

      // Store in tenant-registrations collection (allows anonymous access)
      const ref = await addDoc(collection(db, "tenant-registrations"), registrationData);
      console.log("Tenant Portal: registration created", {
        docId: ref.id,
        landlordId,
        propertyId,
        inviteCode
      });
      
      // Also prepare the actual tenant record for the landlord (to be written by landlord after approval)
      const tenantData = {
        fullName: formData.fullName,
        contact: {
          email: formData.email,
          phone: formData.phone
        },
        moveInDate: formData.moveInDate || "",
        notes: formData.notes || "",
        propertyId: propertyId || null,
        status: "pending",
        inviteCode: inviteCode || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      // IMPORTANT: Do not write into a global collection visible to all accounts.
      // We only store the registration in an anonymous collection and let the landlord
      // import it into their own `users/{landlordId}/tenants` after approval.
      
      setSubmitted(true);
      toast.success("Registration submitted successfully! Your landlord will review your application.");
    } catch (error) {
      console.error("Failed to create tenant:", error);
      setError("Failed to submit registration. Please try again.");
      toast.error("Failed to submit registration. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center p-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Registration Complete!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for registering. Your landlord will review your information and contact you soon.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <strong>What&apos;s next?</strong><br />
              Your landlord will review your application and contact you within 24-48 hours.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full border border-gray-100"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tenant Registration</h1>
          <p className="text-gray-600">
            You&apos;ve been invited to register as a tenant. Please fill out the form below.
          </p>
          
          {/* Security Notice */}
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">Tenant Portal Access</h3>
                <p className="text-sm text-amber-700 mt-1">
                  This is a secure tenant registration portal. You can only access the registration form and cannot navigate to other areas of the system.
                </p>
              </div>
            </div>
          </div>
          
          {inviteCode && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Invitation Code:</strong> {inviteCode}
              </p>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="your@email.com"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="+63 912 345 6789"
                required
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Street, City, Province"
              />
            </div>

            {/* Move-in Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Preferred Move-in Date
              </label>
              <input
                type="date"
                name="moveInDate"
                value={formData.moveInDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Information
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Any additional information you'd like to share..."
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-6 border-t border-gray-200">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
            >
              {submitting ? "Submitting..." : "Submit Registration"}
            </Button>
            <p className="text-sm text-gray-600 text-center mt-4">
              By submitting this form, you agree to the terms and conditions.
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function TenantInvitePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-4 py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading registration form...</p>
        </div>
      </div>
    }>
      <TenantInviteContent />
    </Suspense>
  );
}
