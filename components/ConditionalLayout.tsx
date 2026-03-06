"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageTransition } from "@/components/PageTransition";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Check if we're in the dashboard (flattened routes from (dashboard) group)
  const dashboardRoutes = [
    '/dashboard',
    '/properties',
    '/assistant',
    '/finance',
    '/financial',
    '/form',
    '/payments',
    '/requests',
    '/settings',
    '/tenant-requests',
    '/tenants'
  ];
  
  const isDashboard = dashboardRoutes.some(route => pathname.startsWith(route));
  
  if (isDashboard) {
    // Dashboard pages don't need the marketing navbar/footer
    return (
      <div className="min-h-screen">
        {children}
      </div>
    );
  }
  
  // Marketing pages get the full layout with navbar and footer
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      <Footer />
    </div>
  );
}

