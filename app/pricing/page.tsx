"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { 
  CheckCircle, 
  Star, 
  ArrowRight,
  Building2,
  Users,
  BarChart3,
  Shield,
  Zap,
  CreditCard,
  Bot,
  FileText,
  Clock,
  Lock,
  Target
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { PricingCard } from "@/components/PricingCard";
import { FadeIn } from "@/components/Animations/FadeIn";
import Link from "next/link";

export default function PricingPage() {
  const heroRef = useRef(null);
  const pricingRef = useRef(null);
  const featuresRef = useRef(null);

  const heroInView = useInView(heroRef, { once: true });
  const pricingInView = useInView(pricingRef, { once: true });
  const featuresInView = useInView(featuresRef, { once: true });

  const plans = [
    {
      name: "Free",
      price: "₱0",
      period: "month",
      description: "Perfect for getting started with property management",
      features: [
        "Up to 2 properties",
        "Manage tenants and maintenance",
        "Basic financial tracking",
        "Community support"
      ],
      color: "from-gray-500 to-gray-600",
      glow: "shadow-gray-500/25",
      popular: false
    },
    {
      name: "Standard",
      price: "₱499",
      period: "month",
      description: "Ideal for growing property portfolios with advanced features",
      features: [
        "Unlimited properties",
        "Financial dashboard and reports",
        "Tenant request portal",
        "Secure payment sandbox"
      ],
      color: "from-green-500 to-green-600",
      glow: "shadow-green-500/25",
      popular: true
    },
    {
      name: "Premium",
      price: "₱999",
      period: "month",
      description: "For professional property managers with team features",
      features: [
        "Everything in Standard",
        "AI-powered request categorization",
        "Team collaboration",
        "Priority support"
      ],
      color: "from-purple-500 to-purple-600",
      glow: "shadow-purple-500/25",
      popular: false
    }
  ];

  const features = [
    {
      icon: Building2,
      title: "Property Management",
      description: "Manage unlimited properties with ease"
    },
    {
      icon: Bot,
      title: "AI Assistant",
      description: "Smart automation for routine tasks"
    },
    {
      icon: BarChart3,
      title: "Analytics & Reporting",
      description: "Comprehensive insights and reports"
    },
    {
      icon: Shield,
      title: "Bank-Level Security",
      description: "Your data is protected with enterprise security"
    },
    {
      icon: CreditCard,
      title: "Secure Payments",
      description: "Integrated payment processing with Xendit"
    },
    {
      icon: FileText,
      title: "Document Management",
      description: "Store and organize all property documents"
    }
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
      <section ref={heroRef} className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <FadeIn direction="up" className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-green-200 rounded-full px-6 py-3 mb-8 shadow-lg">
            <Star className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-semibold">Simple, Transparent Pricing</span>
          </FadeIn>

          <FadeIn direction="up" delay={0.2}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8">
              <span className="block text-gray-900">Choose Your</span>
              <span className="block bg-gradient-to-r from-green-600 via-green-500 to-green-700 bg-clip-text text-transparent">
                Perfect Plan
              </span>
            </h1>
          </FadeIn>

          <FadeIn direction="up" delay={0.4}>
            <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Choose a plan that fits your property management needs. All plans include core features with no hidden fees.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Pricing Section */}
      <section ref={pricingRef} className="relative py-32 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16">
            {plans.map((plan, index) => (
              <PricingCard
                key={index}
                name={plan.name}
                price={plan.price}
                period={plan.period}
                description={plan.description}
                features={plan.features}
                popular={plan.popular}
                color={plan.color}
                glow={plan.glow}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="relative py-32 bg-gradient-to-r from-green-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn direction="up" className="mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to
              <span className="block bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                Manage Properties
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              All plans include our core features. Upgrade to unlock advanced capabilities.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
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
                      className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-2xl transition-all duration-300"
                    >
                      <feature.icon className="w-8 h-8 text-white" />
                    </motion.div>
                    <CardTitle className="text-2xl font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-lg leading-relaxed text-gray-600 text-center">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-32 bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn direction="up" className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about RentMatic pricing and features.
            </p>
          </FadeIn>

          <div className="space-y-8">
            {[
              {
                question: "Can I change my plan anytime?",
                answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences."
              },
              {
                question: "Is there a free trial?",
                answer: "Yes, our Starter plan is completely free for up to 2 properties. You can also try our Pro plan with a 14-day free trial."
              },
              {
                question: "What payment methods do you accept?",
                answer: "We accept all major credit cards, bank transfers, and digital wallets through our secure Xendit payment integration."
              },
              {
                question: "Do you offer discounts for annual billing?",
                answer: "Yes, we offer a 15% discount for annual billing on all paid plans. This is automatically applied when you select annual billing."
              }
            ].map((faq, index) => (
              <FadeIn key={index} direction="up" delay={0.1 * index}>
                <Card variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
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
            <Zap className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">Start Your Free Trial</span>
          </FadeIn>

          <FadeIn direction="up" delay={0.2}>
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-8">
              Ready to Get Started?
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
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/about">
                  <Button 
                    size="lg" 
                    variant="ghost" 
                    className="text-white border-2 border-white/30 hover:bg-white/10 backdrop-blur-sm"
                  >
                    Learn More
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