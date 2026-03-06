"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useUserStore } from "@/store/useUserStore";
import { Building2, Menu, X, User, LogOut } from "lucide-react";
import { Button } from "./Button";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, authLoading, initializeAuth } = useUserStore();
  
  // Initialize auth when navbar mounts
  React.useEffect(() => {
    console.log("Navbar: Initializing auth, current user:", user);
    initializeAuth();
    
    // Fallback timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log("Navbar: Auth timeout - forcing loading to false");
      try {
        const { setAuthLoading } = useUserStore.getState();
        if (setAuthLoading) {
          setAuthLoading(false);
        }
      } catch (error) {
        console.log("Navbar: Could not set loading to false:", error);
      }
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, [initializeAuth]);
  
  // Debug user state changes
  React.useEffect(() => {
    console.log("Navbar: User state changed:", { user, authLoading });
  }, [user, authLoading]);
  
  const handleLogout = async () => {
    try {
      console.log("Navbar: Logging out user...");
      
      // Immediately clear the user state for instant UI update
      const { setUser, setAuthLoading } = useUserStore.getState();
      setUser(null);
      setAuthLoading(false);
      
      // Then perform the actual logout
      const { logout } = useUserStore.getState();
      await logout();
      
      console.log("Navbar: Logout successful, redirecting to login");
      window.location.href = "/login";
    } catch (error) {
      console.error("Navbar: Logout error:", error);
      // Fallback: just redirect to login
      window.location.href = "/login";
    }
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-green-100 bg-white/80 backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-3"
          >
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-lg">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                RentMatic
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-gray-600 hover:text-green-600 transition-colors font-medium"
            >
              Home
            </Link>
            <Link
              href="/pricing"
              className="text-gray-600 hover:text-green-600 transition-colors font-medium"
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="text-gray-600 hover:text-green-600 transition-colors font-medium"
            >
              About
            </Link>
          </nav>

                  {/* Desktop Auth Buttons */}
                  <div className="hidden md:flex items-center space-x-4">
                    {authLoading ? (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
                <span>Loading...</span>
              </div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>Welcome, {user.name || "User"}</span>
                </div>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  icon={<LogOut className="w-4 h-4" />}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-green-50 transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.button>
        </div>

        {/* Mobile Navigation */}
        <motion.div
          initial={false}
          animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden overflow-hidden"
        >
          <div className="py-4 space-y-4 border-t border-green-100">
            <Link
              href="/"
              className="block text-gray-600 hover:text-green-600 transition-colors font-medium"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/pricing"
              className="block text-gray-600 hover:text-green-600 transition-colors font-medium"
              onClick={() => setIsOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="block text-gray-600 hover:text-green-600 transition-colors font-medium"
              onClick={() => setIsOpen(false)}
            >
              About
            </Link>
            
                    {authLoading ? (
              <div className="pt-4 border-t border-green-100">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </div>
              </div>
            ) : user ? (
              <div className="pt-4 border-t border-green-100">
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                  <User className="w-4 h-4" />
                  <span>Welcome, {user?.name || "User"}</span>
                </div>
                <div className="space-y-3">
                  <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    icon={<LogOut className="w-4 h-4" />}
                    className="w-full"
                  >
                    Logout
                  </Button>
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t border-green-100 space-y-3">
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setIsOpen(false)}>
                  <Button size="sm" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.header>
  );
}
