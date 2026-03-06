"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  Home, 
  FileText, 
  Settings, 
  Bot,
  BarChart3,
  Menu,
  X,
  User,
  Users,
  LogOut,
  ChevronDown
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  
  // Auth state from Zustand store
  const { user, authLoading, initializeAuth } = useUserStore();

  // Initialize auth on mount
  useEffect(() => {
    setMounted(true);
    initializeAuth();
  }, [initializeAuth]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (mounted && !authLoading && !user) {
      console.log("Dashboard: No user found, redirecting to login");
      router.push('/login');
    }
  }, [mounted, authLoading, user, router]);

  // Show loading state while checking auth or mounting
  if (!mounted || authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if no user (will redirect via useEffect)
  if (!user) {
    return null;
  }

  // Note: Route group (dashboard) is flattened in static export
  // So /dashboard/properties becomes /properties
  const sidebarItems = [
    { name: "Dashboard Overview", href: "/dashboard", icon: Home },
    { name: "Manage Properties", href: "/properties", icon: Building2 },
    { name: "AI Assistant", href: "/assistant", icon: Bot },
    { name: "Financial Summary", href: "/finance", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    }>
      <div className="flex h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: (sidebarOpen || isHovered) ? 280 : 80 }}
        className="bg-white shadow-lg border-r border-green-100 flex flex-col transition-all duration-300"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo */}
        <div className="p-4 border-b border-green-100">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <AnimatePresence>
              {(sidebarOpen || isHovered) && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 0.15, 
                    delay: (sidebarOpen || isHovered) ? 0.25 : 0 
                  }}
                  className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent whitespace-nowrap"
                >
                  RentMatic
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center space-x-3 p-3 rounded-xl transition-colors cursor-pointer ${
                    isActive
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "text-gray-600 hover:bg-green-50 hover:text-green-600"
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <AnimatePresence>
                    {(sidebarOpen || isHovered) && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ 
                          duration: 0.2, 
                          delay: (sidebarOpen || isHovered) ? 0.25 : 0 
                        }}
                        className="font-medium whitespace-nowrap"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Profile Section */}
        <div className="p-4 border-t border-green-100">
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center space-x-3 p-3 rounded-xl bg-green-50 text-green-700 w-full transition-colors hover:bg-green-100"
            >
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex-1 flex items-center justify-between"
                  >
                    <div className="text-left">
                      <p className="font-medium text-sm">{user?.name || 'Landlord'}</p>
                      <p className="text-xs text-green-600 capitalize">{user?.role || 'Property Manager'}</p>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            <AnimatePresence>
              {profileOpen && sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-lg border border-green-100 p-2"
                >
                  <button 
                    onClick={async () => {
                      const { logout } = useUserStore.getState();
                      await logout();
                      router.push('/login');
                    }}
                    className="flex items-center space-x-2 w-full p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm border-b border-green-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-green-50 transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome back, <span className="font-medium text-green-600">{user?.name || 'Landlord'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
      </div>
    </Suspense>
  );
}
