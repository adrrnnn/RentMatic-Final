"use client";

import { useState, useEffect } from "react";
import React from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { 
  Settings, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Shield, 
  Bell, 
  CreditCard,
  Save,
  Edit,
  Camera,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Key,
  Smartphone,
  Globe
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { useUserStore } from "@/store/useUserStore";

export default function SettingsPage() {
  const { user } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const settingsRef = useRef(null);
  const settingsInView = useInView(settingsRef, { once: true });

  const [profileData, setProfileData] = useState({
    name: user?.name || "Landlord Name",
    email: user?.email || "landlord@email.com",
    phone: "+63 912 345 6789",
    address: "123 Business Street, Quezon City, Philippines",
    company: "RentMatic Properties",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };


  const settingsSections = [
    {
      title: "Profile Information",
      icon: User,
      color: "from-blue-500 to-blue-600",
      fields: [
        { label: "Full Name", key: "name", type: "text", icon: User },
        { label: "Email Address", key: "email", type: "email", icon: Mail },
        { label: "Phone Number", key: "phone", type: "tel", icon: Phone },
        { label: "Business Address", key: "address", type: "text", icon: MapPin },
        { label: "Company Name", key: "company", type: "text", icon: Building2 }
      ]
    },
    {
      title: "Security Settings",
      icon: Shield,
      color: "from-red-500 to-red-600",
      fields: [
        { label: "Current Password", key: "currentPassword", type: "password", icon: Lock },
        { label: "New Password", key: "newPassword", type: "password", icon: Key },
        { label: "Confirm Password", key: "confirmPassword", type: "password", icon: Key }
      ]
    },
    {
      title: "Notification Preferences",
      icon: Bell,
      color: "from-green-500 to-green-600",
      fields: [
        { label: "Email Notifications", key: "emailNotifications", type: "checkbox", icon: Mail },
        { label: "SMS Notifications", key: "smsNotifications", type: "checkbox", icon: Smartphone },
        { label: "Push Notifications", key: "pushNotifications", type: "checkbox", icon: Bell }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {saved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center space-x-2 text-green-600"
            >
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Saved successfully!</span>
            </motion.div>
          )}
          
          {isEditing ? (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleSave}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/25"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </motion.div>
            </div>
          ) : (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-8"
      >
        <Card variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="flex items-center space-x-6">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="relative"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/25">
                  <User className="w-12 h-12 text-white" />
                </div>
                {isEditing && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </motion.button>
                )}
              </motion.div>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{profileData.name}</h2>
                <p className="text-gray-600 mb-1">{profileData.email}</p>
                <p className="text-gray-500 text-sm">{profileData.company}</p>
                <div className="flex items-center space-x-4 mt-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-1" />
                    {profileData.phone}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-1" />
                    Quezon City
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Settings Sections */}
      <section ref={settingsRef} className="space-y-8">
        {settingsSections.map((section, sectionIndex) => (
          <motion.div
            key={sectionIndex}
            initial={{ opacity: 0, y: 30 }}
            animate={settingsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.1 * sectionIndex }}
          >
            <Card variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`w-10 h-10 bg-gradient-to-br ${section.color} rounded-xl flex items-center justify-center shadow-lg`}
                  >
                    <section.icon className="w-5 h-5 text-white" />
                  </motion.div>
                  <CardTitle className="text-xl font-bold text-gray-900">{section.title}</CardTitle>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {section.fields.map((field, fieldIndex) => (
                    <motion.div
                      key={fieldIndex}
                      initial={{ opacity: 0, x: -20 }}
                      animate={settingsInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                      transition={{ duration: 0.5, delay: 0.1 * sectionIndex + 0.05 * fieldIndex }}
                      className="space-y-2"
                    >
                      <label className="block text-sm font-medium text-gray-700">
                        {field.label}
                      </label>
                      
                      {field.type === "checkbox" ? (
                        <div className="flex items-center space-x-3">
                          <motion.input
                            whileHover={{ scale: 1.05 }}
                            type="checkbox"
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-600">Enable {field.label}</span>
                        </div>
                      ) : (
                        <div className="relative">
                          <field.icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type={field.type === "password" ? (field.key === "currentPassword" ? (showPassword ? "text" : "password") : 
                                  field.key === "newPassword" ? (showNewPassword ? "text" : "password") : 
                                  (showConfirmPassword ? "text" : "password")) : field.type}
                            value={profileData[field.key as keyof typeof profileData] || ""}
                            onChange={(e) => handleInputChange(field.key, e.target.value)}
                            disabled={!isEditing}
                            className={`w-full pl-10 pr-12 py-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 ${
                              isEditing ? "bg-white" : "bg-gray-50"
                            }`}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                          />
                          
                          {field.type === "password" && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              type="button"
                              onClick={() => {
                                if (field.key === "currentPassword") setShowPassword(!showPassword);
                                if (field.key === "newPassword") setShowNewPassword(!showNewPassword);
                                if (field.key === "confirmPassword") setShowConfirmPassword(!showConfirmPassword);
                              }}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
                            >
                              {field.key === "currentPassword" ? (showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />) :
                               field.key === "newPassword" ? (showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />) :
                               (showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />)}
                            </motion.button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      {/* Additional Settings */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <Card variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-lg font-bold text-gray-900">Payment Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Auto-payment reminders</span>
                <motion.input
                  whileHover={{ scale: 1.05 }}
                  type="checkbox"
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Late payment notifications</span>
                <motion.input
                  whileHover={{ scale: 1.05 }}
                  type="checkbox"
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-lg font-bold text-gray-900">Privacy Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Public profile</span>
                <motion.input
                  whileHover={{ scale: 1.05 }}
                  type="checkbox"
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Show contact information</span>
                <motion.input
                  whileHover={{ scale: 1.05 }}
                  type="checkbox"
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
