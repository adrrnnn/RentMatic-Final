"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Building2,
  ArrowRight,
  CreditCard,
  BarChart3,
  FileText,
  Zap,
  TrendingUp,
  Star,
  Bot,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { AboutSection } from "@/components/AboutSection";
import { PricingCard } from "@/components/PricingCard";
import { FadeIn } from "@/components/Animations/FadeIn";
import Link from "next/link";

export function HomeLanding() {
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const pricingRef = useRef(null);
  const ctaRef = useRef(null);

  const features = [
    { icon: Building2, title: "Smart Property Management", description: "Manage units, tenants, and maintenance in one place with comprehensive property management tools.", color: "from-green-500 to-green-600", glow: "shadow-green-500/25" },
    { icon: BarChart3, title: "Automated Financial Tracking", description: "Visualize income, expenses, and rent collections with comprehensive financial reporting and analytics.", color: "from-blue-500 to-blue-600", glow: "shadow-blue-500/25" },
    { icon: FileText, title: "Tenant Request Portal", description: "Tenants can submit and track requests easily with streamlined request management system.", color: "from-purple-500 to-purple-600", glow: "shadow-purple-500/25" },
    { icon: Bot, title: "AI-Powered Categorization", description: "Automatically classifies tenant requests for faster response and improved efficiency.", color: "from-emerald-500 to-emerald-600", glow: "shadow-emerald-500/25" },
    { icon: CreditCard, title: "Secure Payments (Demo Sandbox)", description: "Xendit integration with secure payment simulation for rent collection and financial transactions.", color: "from-orange-500 to-orange-600", glow: "shadow-orange-500/25" },
  ];

  const pricingPlans = [
    { name: "Free", price: "₱0", period: "month", description: "Perfect for getting started with property management", features: ["Up to 2 properties","Manage tenants and maintenance","Basic financial tracking","Community support"], color: "from-gray-500 to-gray-600", glow: "shadow-gray-500/25", popular: false },
    { name: "Standard", price: "₱499", period: "month", description: "Ideal for growing property portfolios with advanced features", features: ["Unlimited properties","Financial dashboard and reports","Tenant request portal","Secure payment sandbox"], color: "from-green-500 to-green-600", glow: "shadow-green-500/25", popular: true },
    { name: "Premium", price: "₱999", period: "month", description: "For professional property managers with team features", features: ["Everything in Standard","AI-powered request categorization","Team collaboration","Priority support"], color: "from-purple-500 to-purple-600", glow: "shadow-purple-500/25", popular: false },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-green-50" />
        <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} className="absolute top-20 left-20 w-64 h-64 bg-green-100/30 rounded-full blur-3xl" />
        <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 5 }} className="absolute bottom-20 right-20 w-80 h-80 bg-blue-100/30 rounded-full blur-3xl" />
      </div>

      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <FadeIn direction="up" className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-green-200 rounded-full px-6 py-3 mb-8 shadow-lg">
            <Zap className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-semibold">Professional Property Management</span>
          </FadeIn>

          <FadeIn direction="up" delay={0.2}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8">
              <span className="block text-gray-900">Simplify Property Management</span>
              <span className="block bg-gradient-to-r from-green-600 via-green-500 to-green-700 bg-clip-text text-transparent">with Smart Automation</span>
            </h1>
          </FadeIn>

          <FadeIn direction="up" delay={0.6}>
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                <Link href="/register">
                  <Button size="lg" className="relative overflow-hidden group bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-2xl shadow-green-500/25">
                    <span className="relative z-10 flex items-center">Get Started<ArrowRight className="w-5 h-5 ml-2" /></span>
                  </Button>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="bg-white/80 backdrop-blur-sm border-2 border-green-600 text-green-600 hover:bg-green-50 shadow-lg">View Demo</Button>
                </Link>
              </motion.div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section ref={featuresRef} className="relative py-32 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn direction="up" className="text-center mb-20">
            <div className="inline-flex items-center space-x-2 bg-green-100 rounded-full px-6 py-3 mb-8">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-green-700 font-semibold">Powerful Tools for Modern Landlords</span>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FadeIn key={index} direction="up" delay={0.1 * index} className="group">
                <Card variant="elevated" className="h-full relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:scale-105">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  <CardHeader className="relative">
                    <motion.div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg ${feature.glow} group-hover:shadow-2xl transition-all duration-300`}>
                      <feature.icon className="w-8 h-8 text-white" />
                    </motion.div>
                    <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <CardDescription className="text-lg leading-relaxed text-gray-600">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <AboutSection />

      <section ref={pricingRef} className="relative py-32 bg-gradient-to-r from-green-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16">
            {pricingPlans.map((plan, index) => (
              <PricingCard key={index} name={plan.name} price={plan.price} period={plan.period} description={plan.description} features={plan.features} popular={plan.popular} color={plan.color} glow={plan.glow} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section ref={ctaRef} className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-green-700 to-green-800" />
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <Link href="/register">
            <Button size="lg" variant="outline" className="bg-white text-green-600 hover:bg-green-50 border-white shadow-2xl">Sign Up Free</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}












