"use client";

import { useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
  MoreHorizontal,
  Plus,
  SortAsc,
  SortDesc
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";

export default function RequestsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  
  const requestsRef = useRef(null);
  const requestsInView = useInView(requestsRef, { once: true });

  const requests = [
    {
      id: 1,
      title: "Leaky Faucet in Kitchen",
      description: "The kitchen faucet in unit 2A has been dripping continuously for 3 days. Water is pooling under the sink.",
      tenant: "John Doe",
      property: "Greenwood Apartments",
      unit: "2A",
      status: "pending",
      priority: "medium",
      date: "2024-10-03",
      time: "2:30 PM",
      contact: "+63 912 345 6789"
    },
    {
      id: 2,
      title: "Broken Air Conditioning",
      description: "The AC unit in the living room is not cooling properly. It's making strange noises and only blowing warm air.",
      tenant: "Sarah Wilson",
      property: "Sunset Villa",
      unit: "1B",
      status: "in_progress",
      priority: "high",
      date: "2024-10-02",
      time: "10:15 AM",
      contact: "+63 923 456 7890"
    },
    {
      id: 3,
      title: "Door Lock Replacement",
      description: "The front door lock is jammed and won't turn with the key. Need immediate attention for security.",
      tenant: "Mike Johnson",
      property: "Riverside Complex",
      unit: "5C",
      status: "completed",
      priority: "high",
      date: "2024-10-01",
      time: "4:45 PM",
      contact: "+63 934 567 8901"
    },
    {
      id: 4,
      title: "Electrical Outlet Not Working",
      description: "The outlet in the bedroom stopped working. Tried different devices, none are getting power.",
      tenant: "Lisa Chen",
      property: "Greenwood Apartments",
      unit: "3B",
      status: "pending",
      priority: "low",
      date: "2024-09-30",
      time: "8:20 AM",
      contact: "+63 945 678 9012"
    },
    {
      id: 5,
      title: "Water Heater Issues",
      description: "No hot water in the bathroom. The water heater seems to be malfunctioning.",
      tenant: "David Kim",
      property: "Garden Heights",
      unit: "2D",
      status: "in_progress",
      priority: "medium",
      date: "2024-09-29",
      time: "6:30 PM",
      contact: "+63 956 789 0123"
    },
    {
      id: 6,
      title: "Window Screen Repair",
      description: "The window screen in the living room has a large tear. Need to replace it to keep insects out.",
      tenant: "Emma Rodriguez",
      property: "Riverside Complex",
      unit: "7A",
      status: "completed",
      priority: "low",
      date: "2024-09-28",
      time: "1:15 PM",
      contact: "+63 967 890 1234"
    }
  ];

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.tenant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.property.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || request.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return Clock;
      case "in_progress":
        return AlertCircle;
      case "completed":
        return CheckCircle;
      default:
        return Clock;
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
          <h1 className="text-3xl font-bold text-gray-900">Maintenance Requests</h1>
          <p className="text-gray-600">Track and manage tenant maintenance requests</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{requests.length}</span> total requests
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/50 backdrop-blur-sm border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-white/50 backdrop-blur-sm border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-white/50 backdrop-blur-sm border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priority">Priority</option>
          </select>
          
          <Button variant="outline" className="px-4">
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </Button>
        </div>
      </motion.div>

      {/* Requests List */}
      <section ref={requestsRef} className="space-y-4">
        {filteredRequests.map((request, index) => {
          const StatusIcon = getStatusIcon(request.status);
          
          return (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={requestsInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.95 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              whileHover={{ 
                scale: 1.02, 
                y: -2,
                rotateY: 1
              }}
              className="group"
            >
              <Card variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                          {request.title}
                        </h3>
                        
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {request.status.replace('_', ' ').toUpperCase()}
                        </div>
                        
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                          {request.priority.toUpperCase()}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">{request.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="w-4 h-4 mr-2" />
                          <span>{request.tenant}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{request.property} - {request.unit}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2" />
                          <span>{request.contact}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{request.date} at {request.time}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                      >
                        <Mail className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                  
                  {request.status === "pending" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="mt-4 pt-4 border-t border-gray-100"
                    >
                      <div className="flex space-x-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl transition-colors font-medium"
                        >
                          Accept Request
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors font-medium"
                        >
                          Request More Info
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </section>

      {/* Empty State */}
      {filteredRequests.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center py-12"
        >
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No requests found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
          <Button variant="outline">
            Clear Filters
          </Button>
        </motion.div>
      )}
    </div>
  );
}
