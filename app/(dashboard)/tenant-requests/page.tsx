"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useUserStore } from "@/store/useUserStore";
import { 
  FileText, 
  Bot, 
  Filter, 
  Search, 
  Edit, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  MessageSquare,
  User,
  Calendar,
  Tag,
  Eye,
  Save,
  X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/Animations/FadeIn";
import { doc, collection, addDoc, updateDoc, getDocs, query, orderBy, where } from "firebase/firestore";
import { getClientDb } from "@/lib/firebase";

interface TenantRequest {
  id: string;
  tenantName: string;
  tenantEmail: string;
  propertyName: string;
  unit: string;
  subject: string;
  description: string;
  category: "maintenance" | "payment" | "general" | "emergency";
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
  aiConfidence: number;
}

export default function TenantRequestsPage() {
  const { user } = useUserStore();
  const [requests, setRequests] = useState<TenantRequest[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<TenantRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<"all" | "maintenance" | "payment" | "general" | "emergency">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "in_progress" | "completed" | "cancelled">("all");
  const [loading, setLoading] = useState(true);
  
  const requestsRef = useRef(null);
  const inView = useInView(requestsRef, { once: true });

  const [formData, setFormData] = useState({
    tenantName: "",
    tenantEmail: "",
    propertyName: "",
    unit: "",
    subject: "",
    description: "",
    category: "general" as "maintenance" | "payment" | "general" | "emergency",
    priority: "medium" as "low" | "medium" | "high",
    status: "pending" as "pending" | "in_progress" | "completed" | "cancelled"
  });

  useEffect(() => {
    if (user?.id) {
      fetchRequests();
    }
  }, [user?.id]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const db = getClientDb();
      if (!db) throw new Error("Firestore not available");
      const requestsRef = collection(db, "users", user?.id || "", "tenantRequests");
      const q = query(requestsRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      const requestsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as TenantRequest[];
      
      setRequests(requestsData);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  // AI Categorization Function
  const categorizeRequest = (description: string, subject: string): { category: string; confidence: number } => {
    const text = (description + " " + subject).toLowerCase();
    
    // Maintenance keywords
    const maintenanceKeywords = ["leak", "broken", "repair", "fix", "maintenance", "plumbing", "electrical", "heating", "cooling", "appliance", "door", "window", "floor", "wall", "ceiling", "faucet", "toilet", "shower", "sink", "light", "outlet", "switch"];
    const maintenanceScore = maintenanceKeywords.filter(keyword => text.includes(keyword)).length;
    
    // Payment keywords
    const paymentKeywords = ["rent", "payment", "bill", "invoice", "due", "overdue", "late", "fee", "charge", "deposit", "refund", "money", "cost", "price", "amount"];
    const paymentScore = paymentKeywords.filter(keyword => text.includes(keyword)).length;
    
    // Emergency keywords
    const emergencyKeywords = ["emergency", "urgent", "flood", "fire", "gas", "smoke", "danger", "unsafe", "immediate", "asap", "critical"];
    const emergencyScore = emergencyKeywords.filter(keyword => text.includes(keyword)).length;
    
    const scores = {
      maintenance: maintenanceScore,
      payment: paymentScore,
      emergency: emergencyScore,
      general: 0
    };
    
    const maxScore = Math.max(...Object.values(scores));
    const category = Object.keys(scores).find(key => scores[key as keyof typeof scores] === maxScore) || "general";
    const confidence = Math.min(maxScore * 0.2, 1); // Scale confidence to 0-1
    
    return { category, confidence };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      const { category, confidence } = categorizeRequest(formData.description, formData.subject);
      
      const requestData = {
        ...formData,
        category: category as "maintenance" | "payment" | "general" | "emergency",
        aiConfidence: confidence,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (editingRequest) {
        const db = getClientDb();
        if (!db) throw new Error("Firestore not available");
        const requestRef = doc(db, "users", user.id, "tenantRequests", editingRequest.id);
        await updateDoc(requestRef, { ...requestData, updatedAt: new Date() });
        setRequests(prev => prev.map(r => r.id === editingRequest.id ? { ...r, ...requestData } : r));
      } else {
        const db = getClientDb();
        if (!db) throw new Error("Firestore not available");
        const docRef = await addDoc(collection(db, "users", user.id, "tenantRequests"), requestData);
        setRequests(prev => [{ id: docRef.id, ...requestData }, ...prev]);
      }

      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving request:", error);
    }
  };

  const handleEdit = (request: TenantRequest) => {
    setEditingRequest(request);
    setFormData({
      tenantName: request.tenantName,
      tenantEmail: request.tenantEmail,
      propertyName: request.propertyName,
      unit: request.unit,
      subject: request.subject,
      description: request.description,
      category: request.category,
      priority: request.priority,
      status: request.status
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      tenantName: "",
      tenantEmail: "",
      propertyName: "",
      unit: "",
      subject: "",
      description: "",
      category: "general",
      priority: "medium",
      status: "pending"
    });
    setEditingRequest(null);
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || request.category === filterCategory;
    const matchesStatus = filterStatus === "all" || request.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "maintenance":
        return "bg-blue-100 text-blue-800";
      case "payment":
        return "bg-green-100 text-green-800";
      case "emergency":
        return "bg-red-100 text-red-800";
      case "general":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Tenant Requests</h1>
            <p className="text-gray-600 text-lg">Manage and categorize tenant requests with AI assistance.</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => window.open('/form', '_blank')}
              variant="outline"
              icon={<FileText className="w-5 h-5" />}
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              Manage Form
            </Button>
            <Button
              onClick={() => setIsModalOpen(true)}
              icon={<FileText className="w-5 h-5" />}
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
            >
              Add Request
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* AI Categorization Info */}
      <FadeIn direction="up" delay={0.1}>
        <Card variant="elevated" className="bg-gradient-to-r from-green-50 to-blue-50 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Bot className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AI-Powered Categorization</h3>
                <p className="text-gray-600">Requests are automatically categorized using intelligent keyword analysis for faster processing.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Search and Filters */}
      <FadeIn direction="up" delay={0.2}>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search requests by tenant, subject, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white/50 backdrop-blur-sm text-gray-800 placeholder-gray-400"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as "all" | "maintenance" | "payment" | "general" | "emergency")}
              className="px-4 py-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
            >
              <option value="all">All Categories</option>
              <option value="maintenance">Maintenance</option>
              <option value="payment">Payment</option>
              <option value="general">General</option>
              <option value="emergency">Emergency</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as "all" | "pending" | "in_progress" | "completed" | "cancelled")}
              className="px-4 py-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </FadeIn>

      {/* Requests List */}
      <div ref={requestsRef} className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : filteredRequests.length > 0 ? (
          filteredRequests.map((request, index) => (
            <FadeIn key={request.id} direction="up" delay={0.1 * index} className="group">
              <Card variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <User className="w-8 h-8 text-green-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{request.tenantName}</h3>
                        <p className="text-sm text-gray-600">{request.propertyName} - {request.unit}</p>
                        <p className="text-xs text-gray-500">{request.tenantEmail}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(request.category)}`}>
                        {request.category}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(request.priority)}`}>
                        {request.priority}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">{request.subject}</h4>
                    <p className="text-gray-600 line-clamp-3">{request.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{request.createdAt.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Bot className="w-4 h-4" />
                        <span>AI Confidence: {Math.round(request.aiConfidence * 100)}%</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Eye className="w-4 h-4" />}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Edit className="w-4 h-4" />}
                        onClick={() => handleEdit(request)}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          ))
        ) : (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No requests found</h3>
            <p className="text-gray-500 mb-6">No tenant requests match your current filters.</p>
            <Button
              onClick={() => setIsModalOpen(true)}
              icon={<FileText className="w-5 h-5" />}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Add First Request
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Request Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-gray-900">
                    {editingRequest ? "Edit Request" : "Add New Request"}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<X className="w-5 h-5" />}
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                  >
                    Close
                  </Button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tenant Name</label>
                      <input
                        type="text"
                        required
                        value={formData.tenantName}
                        onChange={(e) => setFormData(prev => ({ ...prev, tenantName: e.target.value }))}
                        className="w-full px-4 py-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                        placeholder="John Doe"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tenant Email</label>
                      <input
                        type="email"
                        required
                        value={formData.tenantEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, tenantEmail: e.target.value }))}
                        className="w-full px-4 py-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                        placeholder="john@example.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Property Name</label>
                      <input
                        type="text"
                        required
                        value={formData.propertyName}
                        onChange={(e) => setFormData(prev => ({ ...prev, propertyName: e.target.value }))}
                        className="w-full px-4 py-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                        placeholder="Sunset Apartments"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                      <input
                        type="text"
                        required
                        value={formData.unit}
                        onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                        className="w-full px-4 py-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                        placeholder="Apt 101"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-4 py-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="Brief description of the issue"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="Detailed description of the request..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as "maintenance" | "payment" | "general" | "emergency" }))}
                        className="w-full px-4 py-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      >
                        <option value="general">General</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="payment">Payment</option>
                        <option value="emergency">Emergency</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as "low" | "medium" | "high" }))}
                        className="w-full px-4 py-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as "pending" | "in_progress" | "completed" | "cancelled" }))}
                        className="w-full px-4 py-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsModalOpen(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      icon={<Save className="w-4 h-4" />}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {editingRequest ? "Update Request" : "Add Request"}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
