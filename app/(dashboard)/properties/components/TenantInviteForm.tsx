"use client";

import { motion } from "framer-motion";
import { Send, X, Link, Mail, Building2, MessageSquare, Copy, Check } from "lucide-react";
import { Button } from "@/components/Button";
import type { Property } from "@/types/firestore";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useUserStore } from "@/store/useUserStore";

interface FormDataState {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  propertyId: string;
  moveInDate: string;
  rentType: "Monthly" | "Yearly" | "Custom";
  notes: string;
  // Lease information
  leaseStartDate: string;
  leaseEndDate: string;
  leaseTerms: string;
  securityDeposit: string;
}

interface TenantInviteFormProps {
  formData: FormDataState;
  onChange: (data: FormDataState) => void;
  properties: Property[];
  onSend: (email: string, message?: string) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function TenantInviteForm({ formData, onChange, properties, onSend, onCancel, saving = false }: TenantInviteFormProps) {
  const { user } = useUserStore();
  const [message, setMessage] = useState("");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [inviteMethod, setInviteMethod] = useState<"email" | "link">("email");

  const update = (patch: Partial<FormDataState>) => onChange({ ...formData, ...patch });

  const handleSendInvite = () => {
    if (!formData.email) {
      toast.error("Email is required to send an invitation.");
      return;
    }
    onSend(formData.email, message);
  };

  const handleGenerateLink = () => {
    // In a real app, this would generate a unique token and store it in the backend
    // For now, we'll simulate a link
    const baseUrl = window.location.origin;
    const params = new URLSearchParams();
    params.set('code', 'TENANTINVITE123');
    if (formData.propertyId) params.set('property', formData.propertyId);
    let landlordId = user?.id;
    if (!landlordId && typeof window !== 'undefined') {
      try { landlordId = localStorage.getItem('uid') || undefined; } catch {}
    }
    if (landlordId) params.set('landlord', landlordId);
    const link = `${baseUrl}/tenant-portal?${params.toString()}`;
    setGeneratedLink(link);
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    toast.success("Registration link copied to clipboard!");
    
    // Reset copied state after 3 seconds
    setTimeout(() => setLinkCopied(false), 3000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }} 
      animate={{ opacity: 1, y: 0, scale: 1 }} 
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-8 py-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mr-4 shadow-lg"
            >
              <Send className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <motion.h2 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-gray-900"
              >
                Send Tenant Invitation
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600"
              >
                Invite tenants to self-register and complete their profile
              </motion.p>
            </div>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button variant="ghost" size="icon" onClick={onCancel} disabled={saving} className="text-gray-500 hover:text-gray-700 hover:bg-gray-100">
              <X className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-6"
        >
          {/* Invitation Method Selection */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Invitation Method
            </label>
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  inviteMethod === "email" 
                    ? "border-purple-500 bg-purple-50" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setInviteMethod("email")}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    inviteMethod === "email" 
                      ? "border-purple-500 bg-purple-500" 
                      : "border-gray-300"
                  }`}>
                    {inviteMethod === "email" && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-purple-600" />
                      <span className="font-medium text-gray-900">Send Email</span>
                    </div>
                    <p className="text-sm text-gray-600">Direct email invitation</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  inviteMethod === "link" 
                    ? "border-purple-500 bg-purple-50" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setInviteMethod("link")}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    inviteMethod === "link" 
                      ? "border-purple-500 bg-purple-500" 
                      : "border-gray-300"
                  }`}>
                    {inviteMethod === "link" && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center">
                      <Link className="w-4 h-4 mr-2 text-purple-600" />
                      <span className="font-medium text-gray-900">Generate Link</span>
                    </div>
                    <p className="text-sm text-gray-600">Shareable registration link</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Tenant Email - Only show for email method */}
          {inviteMethod === "email" && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <Mail className="w-4 h-4 mr-2 text-purple-600" />
                Tenant Email *
              </label>
              <input 
                type="email" 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md" 
                value={formData.email} 
                onChange={(e) => update({ email: e.target.value })} 
                placeholder="tenant@example.com" 
              />
            </motion.div>
          )}

          {/* Preferred Property */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <Building2 className="w-4 h-4 mr-2 text-purple-600" />
              Preferred Property
            </label>
            <select 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md" 
              value={formData.propertyId} 
              onChange={(e) => update({ propertyId: e.target.value })}
            >
              <option value="">No preference</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </motion.div>

          {/* Personal Message */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2 text-purple-600" />
              Personal Message (Optional)
            </label>
            <textarea 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md resize-none" 
              rows={4} 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              placeholder="Hi [Tenant Name], please use this link to register and complete your tenant profile..." 
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="bg-gray-50 px-8 py-6 border-t border-gray-100">
        <div className="flex flex-wrap gap-4 justify-end">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              onClick={onCancel} 
              variant="outline" 
              className="text-gray-600 hover:bg-gray-100 border-gray-300 px-6 py-2" 
              disabled={saving}
            >
              Cancel
            </Button>
          </motion.div>
          
          {inviteMethod === "link" && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                onClick={handleGenerateLink} 
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-200" 
                disabled={saving}
              >
                <Link className="w-4 h-4 mr-2" /> 
                Generate Link
              </Button>
            </motion.div>
          )}
          
          {inviteMethod === "email" && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                onClick={handleSendInvite} 
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-200" 
                disabled={saving}
              >
                {saving ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Send className="w-4 h-4 mr-2" /> 
                    Send Email
                  </div>
                )}
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Generated Link Display */}
      {generatedLink && (
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          transition={{ duration: 0.3 }}
          className="mx-8 mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-green-800">Registration Link Generated</h4>
                <p className="text-sm text-green-600">Share this link with the tenant</p>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(generatedLink);
                  setLinkCopied(true);
                  toast.success("Link copied again!");
                  setTimeout(() => setLinkCopied(false), 2000);
                }}
                variant="outline"
                size="sm"
                className="text-green-600 border-green-300 hover:bg-green-50"
              >
                {linkCopied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                {linkCopied ? "Copied!" : "Copy"}
              </Button>
            </motion.div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600 mb-2">Registration URL:</p>
            <a 
              href={generatedLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:text-blue-800 underline break-all text-sm font-mono"
            >
              {generatedLink}
            </a>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
