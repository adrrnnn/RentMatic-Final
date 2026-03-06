"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { 
  Building2, 
  Users, 
  Target, 
  Award, 
  Heart, 
  Lightbulb, 
  Shield, 
  Zap,
  ArrowRight,
  Star,
  CheckCircle,
  Globe,
  Clock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/Animations/FadeIn";
import Link from "next/link";

export default function AboutPage() {
  const missionRef = useRef(null);
  const storyRef = useRef(null);
  const valuesRef = useRef(null);

  const missionInView = useInView(missionRef, { once: true });
  const storyInView = useInView(storyRef, { once: true });
  const valuesInView = useInView(valuesRef, { once: true });

  const values = [
    {
      icon: Heart,
      title: "Simplicity",
      description: "We believe property management should be straightforward and easy to use, without unnecessary complexity.",
      color: "from-red-500 to-red-600"
    },
    {
      icon: Shield,
      title: "Transparency",
      description: "Clear pricing, honest communication, and transparent processes in everything we do.",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Zap,
      title: "Reliability",
      description: "Dependable service, secure infrastructure, and consistent performance you can count on.",
      color: "from-green-500 to-green-600"
    }
  ];

  const stats = [
    { number: "500+", label: "Properties Managed", icon: Building2 },
    { number: "1,200+", label: "Happy Landlords", icon: Users },
    { number: "99.9%", label: "Uptime Guarantee", icon: Shield },
    { number: "24/7", label: "Customer Support", icon: Clock }
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-green-50" />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-20 w-64 h-64 bg-green-100/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, -5, 0]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
          }}
          className="absolute bottom-20 right-20 w-80 h-80 bg-blue-100/30 rounded-full blur-3xl"
        />
      </div>

      {/* Hero Section */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <FadeIn direction="up" className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-green-200 rounded-full px-6 py-3 mb-8 shadow-lg">
            <Award className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-semibold">About RentMatic</span>
          </FadeIn>

          <FadeIn direction="up" delay={0.2}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8">
              <span className="block text-gray-900">Built for Modern</span>
              <span className="block bg-gradient-to-r from-green-600 via-green-500 to-green-700 bg-clip-text text-transparent">
                Landlords
              </span>
            </h1>
          </FadeIn>

          <FadeIn direction="up" delay={0.4}>
            <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              RentMatic helps you manage properties efficiently with automation, insights, and secure technology.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Mission Section */}
      <section ref={missionRef} className="relative py-32 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeIn direction="up" className="lg:order-2">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                To simplify property management through intelligent tools that help landlords 
                focus on what matters most: growing their business and serving their tenants.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-lg text-gray-700">Streamline property operations</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-lg text-gray-700">Provide valuable insights and analytics</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-lg text-gray-700">Ensure secure and reliable service</span>
                </div>
              </div>
            </FadeIn>

            <FadeIn direction="up" delay={0.2} className="lg:order-1">
              <div className="grid grid-cols-2 gap-6">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={missionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="text-center group"
                  >
                    <Card variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <stat.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                        <div className="text-gray-600 font-medium">{stat.label}</div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section ref={storyRef} className="relative py-32 bg-gradient-to-r from-green-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn direction="up" className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Our Story
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built by developers and landlords who wanted a single, efficient platform.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <FadeIn direction="up" delay={0.1}>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">The Problem</h3>
                    <p className="text-gray-600">Property management was fragmented across multiple tools, making it difficult to track tenants, finances, and maintenance efficiently.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">The Solution</h3>
                    <p className="text-gray-600">We created RentMatic as a unified platform that brings together all property management needs in one intelligent dashboard.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">The Impact</h3>
                    <p className="text-gray-600">Today, RentMatic helps hundreds of landlords across the Philippines manage their properties more efficiently and profitably.</p>
                  </div>
                </div>
              </div>
            </FadeIn>

            <FadeIn direction="up" delay={0.2}>
              <Card variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Building2 className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Built for Real Landlords</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Our team includes experienced property managers and software developers who understand 
                      the challenges of rental property management. We built RentMatic to solve real problems 
                      with practical, user-friendly solutions.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section ref={valuesRef} className="relative py-32 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn direction="up" className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The principles that guide everything we do and shape our company culture.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <FadeIn
                key={index}
                direction="up"
                delay={0.1 * index}
                className="group"
              >
                <Card variant="elevated" className="h-full bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                  <CardHeader className="text-center">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`w-16 h-16 bg-gradient-to-br ${value.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-2xl transition-all duration-300`}
                    >
                      <value.icon className="w-8 h-8 text-white" />
                    </motion.div>
                    <CardTitle className="text-2xl font-semibold text-gray-900 mb-4">
                      {value.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-lg leading-relaxed text-gray-600 text-center">
                      {value.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-green-700 to-green-800" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
        
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <FadeIn direction="up" className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 mb-8 border border-white/30">
            <Star className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">Join Our Mission</span>
          </FadeIn>

          <FadeIn direction="up" delay={0.2}>
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-8">
              Ready to Transform Your Property Management?
            </h2>
          </FadeIn>
          
          <FadeIn direction="up" delay={0.4}>
            <p className="text-xl text-green-100 mb-12 max-w-2xl mx-auto">
              Join hundreds of landlords who are already using RentMatic to streamline their business.
            </p>
          </FadeIn>

          <FadeIn direction="up" delay={0.6}>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/register">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="bg-white text-green-600 hover:bg-green-50 border-white shadow-2xl hover:shadow-white/25"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/pricing">
                  <Button 
                    size="lg" 
                    variant="ghost" 
                    className="text-white border-2 border-white/30 hover:bg-white/10 backdrop-blur-sm"
                  >
                    View Pricing
                  </Button>
                </Link>
              </motion.div>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}