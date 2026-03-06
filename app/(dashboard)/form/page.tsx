"use client";

import { useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { 
  FileText, 
  Copy, 
  Share2, 
  QrCode,
  Eye,
  Settings,
  Link,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/Animations/FadeIn";

export default function TenantFormPage() {
  const [formUrl, setFormUrl] = useState("https://rentmatic.com/tenant-form/abc123");
  const [isActive, setIsActive] = useState(true);
  const [submissions, setSubmissions] = useState(12);
  
  const formRef = useRef(null);
  const formInView = useInView(formRef, { once: true });

  const recentSubmissions = [
    {
      id: 1,
      tenant: "John Doe",
      property: "Greenwood Apartments - Unit 2A",
      type: "Maintenance Request",
      priority: "High",
      status: "Pending",
      date: "2024-10-03",
      time: "2:30 PM"
    },
    {
      id: 2,
      tenant: "Sarah Wilson",
      property: "Sunset Villa - Unit 1B",
      type: "General Inquiry",
      priority: "Low",
      status: "Completed",
      date: "2024-10-02",
      time: "10:15 AM"
    },
    {
      id: 3,
      tenant: "Mike Johnson",
      property: "Riverside Complex - Unit 5C",
      type: "Maintenance Request",
      priority: "Medium",
      status: "In Progress",
      date: "2024-10-01",
      time: "4:45 PM"
    }
  ];

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(formUrl);
    alert("Form URL copied to clipboard!");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "RentMatic Tenant Form",
        text: "Submit your property requests through our secure form",
        url: formUrl
      });
    } else {
      alert("Sharing not supported on this device");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <FadeIn direction="up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tenant Request Form</h1>
            <p className="text-gray-600">Shareable form for tenant requests with AI categorization and automated processing</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span>{isActive ? 'Form Active' : 'Form Inactive'}</span>
            </div>
            <Button
              onClick={() => setIsActive(!isActive)}
              variant="outline"
              size="sm"
            >
              {isActive ? 'Deactivate' : 'Activate'}
            </Button>
            <Button
              onClick={() => window.open('/tenant-requests', '_blank')}
              variant="default"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              View Requests
            </Button>
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Management */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form URL Card */}
          <FadeIn direction="up" delay={0.1}>
            <Card variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <Link className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Form URL</CardTitle>
                    <CardDescription>Share this link with your tenants</CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center space-x-3 mb-4">
                  <input
                    type="text"
                    value={formUrl}
                    readOnly
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopyUrl}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </motion.button>
                </div>
                
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleShare}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="font-medium">Share Form</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors"
                  >
                    <QrCode className="w-4 h-4" />
                    <span className="font-medium">QR Code</span>
                  </motion.button>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Form Settings */}
          <FadeIn direction="up" delay={0.2}>
            <Card variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Form Settings</CardTitle>
                    <CardDescription>Configure your tenant request form</CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Form Title
                      </label>
                      <input
                        type="text"
                        defaultValue="Property Maintenance Request"
                        className="w-full px-4 py-2 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        defaultValue="Please describe your maintenance request or property concern in detail."
                        rows={3}
                        className="w-full px-4 py-2 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Auto-categorization
                      </label>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-600">Enable AI categorization</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Notifications
                      </label>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-600">Notify on new submissions</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300"
                  >
                    Save Settings
                  </motion.button>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </div>

        {/* Recent Submissions */}
        <div className="space-y-6">
          <FadeIn direction="up" delay={0.3}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Recent Submissions</h2>
              <div className="text-sm text-gray-600">{submissions} total</div>
            </div>
          </FadeIn>
          
          <div className="space-y-4">
            {recentSubmissions.map((submission, index) => (
              <FadeIn
                key={submission.id}
                direction="up"
                delay={0.4 + 0.1 * index}
                className="group"
              >
                <Card variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{submission.tenant}</h3>
                        <p className="text-sm text-gray-600">{submission.property}</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </motion.button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Type:</span>
                        <span className="text-sm font-medium text-gray-900">{submission.type}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Priority:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(submission.priority)}`}>
                          {submission.priority}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                          {submission.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{submission.date}</span>
                        <span>{submission.time}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>

          {/* Form Statistics */}
          <FadeIn direction="up" delay={0.7}>
            <Card variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Form Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Submissions</span>
                    <span className="font-semibold text-gray-900">{submissions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">This Month</span>
                    <span className="font-semibold text-gray-900">8</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pending Review</span>
                    <span className="font-semibold text-orange-600">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="font-semibold text-green-600">9</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
