"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Building2, 
  Home, 
  Users, 
  DollarSign, 
  BarChart3, 
  Settings, 
  Menu, 
  X,
  Bot
} from "lucide-react";
import { Button } from "./Button";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  const sidebarItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "AI Assistant", href: "/assistant", icon: Bot },
    { name: "Manage Properties", href: "/properties", icon: Building2 },
    { name: "Tenants", href: "/properties", icon: Users },
    { name: "Payments", href: "/payments", icon: DollarSign },
    { name: "Reports", href: "/finance", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden cursor-pointer"
            onClick={() => setIsOpen(false)}
            title="Click to close menu"
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside 
        className="flex flex-col bg-gradient-to-br from-green-600 to-green-700 text-white shadow-xl fixed left-0 top-16 h-[calc(100vh-4rem)] z-30"
        animate={{ width: isHovered ? 256 : 80 }}
        onMouseEnter={() => {
          console.log("Sidebar hover ENTER detected!");
          setIsHovered(true);
        }}
        onMouseLeave={() => {
          console.log("Sidebar hover LEAVE detected!");
          setIsHovered(false);
        }}
        style={{ 
          width: isHovered ? 256 : 80,
          transition: 'width 0.3s ease-in-out'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Debug Info */}
          <div className="p-2 text-xs bg-red-500 text-white font-bold">
            DEBUG: Hover = {isHovered ? "YES" : "NO"} | Width = {isHovered ? "256px" : "80px"}
          </div>
          
          {/* Logo */}
          <div 
            className="flex items-center justify-center p-4 border-b border-green-500/30"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <motion.span 
              className="ml-3 font-bold text-lg"
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.2, delay: isHovered ? 0.15 : 0 }}
            >
              RentMatic
            </motion.span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link href={item.href} key={item.name}>
                  <motion.div
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className={`flex items-center p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-white text-green-700 shadow-md"
                        : "text-white hover:bg-green-500/50"
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isHovered ? "mr-3" : "mr-0"} ${isActive ? "text-green-600" : "text-white"}`} />
                    <motion.span 
                      className={`${isActive ? "font-semibold" : ""}`}
                      animate={{ opacity: isHovered ? 1 : 0 }}
                      transition={{ duration: 0.2, delay: isHovered ? 0.15 : 0 }}
                    >
                      {item.name}
                    </motion.span>
                  </motion.div>
                </Link>
              );
            })}
          </nav>
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -250 }}
            animate={{ x: 0 }}
            exit={{ x: -250 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-y-0 left-0 w-64 bg-gradient-to-br from-green-600 to-green-700 text-white shadow-2xl z-50 lg:hidden"
          >
            <div className="flex flex-col h-full">
              {/* Mobile Header */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.25 }}
                className="flex items-center justify-between p-4 border-b border-green-500/30"
              >
                <div className="flex items-center space-x-3">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"
                  >
                    <Building2 className="w-5 h-5 text-white" />
                  </motion.div>
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="text-lg font-bold"
                  >
                    RentMatic
                  </motion.span>
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </motion.div>
              </motion.div>

              {/* Mobile Navigation */}
              <nav className="flex-1 p-4 space-y-2">
                {sidebarItems.map((item, index) => {
                  const isActive = pathname === item.href;
                  return (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + (index * 0.02), duration: 0.2 }}
                    >
                      <Link href={item.href}>
                        <div
                          className={`flex items-center p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                            isActive
                              ? "bg-white text-green-700 shadow-md"
                              : "text-white hover:bg-green-500/50"
                          }`}
                          onClick={() => setIsOpen(false)}
                        >
                          <item.icon className={`w-5 h-5 mr-3 ${isActive ? "text-green-600" : "text-white"}`} />
                          <span className={`${isActive ? "font-semibold" : ""}`}>{item.name}</span>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
