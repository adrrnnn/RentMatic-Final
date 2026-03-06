"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  variant?: "light" | "dark";
}

export function Breadcrumbs({ items, variant = "light" }: BreadcrumbsProps) {
  const isDark = variant === "dark";
  
  return (
    <nav className={`flex items-center space-x-2 text-sm mb-4 ${isDark ? "text-white" : "text-gray-600"}`}>
      <Link
        href="/dashboard"
        className={`flex items-center transition-colors ${isDark ? "hover:text-green-200" : "hover:text-green-600"}`}
      >
        <Home className="w-4 h-4" />
      </Link>

      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className={`w-4 h-4 ${isDark ? "text-green-200" : "text-gray-400"}`} />
          {item.href ? (
            <Link
              href={item.href}
              className={`transition-colors ${isDark ? "hover:text-green-200" : "hover:text-green-600"}`}
            >
              {item.label}
            </Link>
          ) : (
            <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

