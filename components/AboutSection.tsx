"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { 
  Zap, 
  Shield, 
  BarChart3 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card";
import { FadeIn } from "@/components/Animations/FadeIn";

export function AboutSection() {
  const aboutRef = useRef(null);
  const aboutInView = useInView(aboutRef, { once: true });

  const features = [
    {
      icon: Zap,
      title: "Saves Time Through Automation",
      description: "Streamline routine property management tasks with intelligent automation, reducing manual work and increasing efficiency for landlords across the Philippines."
    },
    {
      icon: Shield,
      title: "Simplifies Property Operations",
      description: "Bank-level security with Firebase authentication and Xendit payment integration, ensuring your property data and financial transactions are protected."
    },
    {
      icon: BarChart3,
      title: "Secure and Reliable Infrastructure",
      description: "Comprehensive analytics and reporting tools that provide valuable insights into property performance, tenant satisfaction, and financial trends."
    }
  ];

  return (
    <section ref={aboutRef} className="py-24 bg-white/70 backdrop-blur-md border-t border-b border-green-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <FadeIn direction="up" className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-4">
            Why Choose RentMatic?
          </h2>
          <p className="text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
            RentMatic simplifies property management for landlords in the Philippines through 
            intelligent automation, robust security, and comprehensive analytics.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FadeIn
              key={index}
              direction="up"
              delay={0.1 * index}
              className="group"
            >
              <Card variant="elevated" className="h-full bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:scale-105">
                <CardHeader className="text-center">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25 group-hover:shadow-2xl transition-all duration-300"
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <CardTitle className="text-2xl font-semibold text-gray-900 mb-4">
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
  );
}
