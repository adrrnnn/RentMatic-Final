"use client";

import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Building2, Zap, Crown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/Animations/FadeIn";

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  color: string;
  glow: string;
  index: number;
}

export function PricingCard({ 
  name, 
  price, 
  period, 
  description, 
  features, 
  popular = false, 
  color, 
  glow, 
  index 
}: PricingCardProps) {
  const handleCheckout = () => {
    // Simulate Xendit sandbox checkout
    alert(`Redirecting to Xendit Sandbox for ${name} plan checkout...`);
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free':
        return Building2;
      case 'standard':
        return Zap;
      case 'premium':
        return Crown;
      default:
        return Building2;
    }
  };

  const PlanIcon = getPlanIcon(name);

  return (
    <FadeIn
      direction="up"
      delay={0.1 * index}
      className="group"
    >
      <div className="relative">
        {popular && (
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg z-20"
          >
            Most Popular
          </motion.div>
        )}
        <Card variant="elevated" className={`h-full relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 ${
          popular ? 'ring-2 ring-green-500 scale-105' : ''
        }`}>
        
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
        
        <CardHeader className="relative text-center">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`w-16 h-16 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg ${glow} group-hover:shadow-2xl transition-all duration-300`}
                  >
                    <PlanIcon className="w-8 h-8 text-white" />
                  </motion.div>
          
          <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
            {name}
          </CardTitle>
          
          <div className="mb-4">
            <span className="text-5xl font-bold text-gray-900">{price}</span>
            <span className="text-gray-600 ml-2">/{period}</span>
          </div>
          
          <CardDescription className="text-lg text-gray-600">
            {description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="relative">
          <ul className="space-y-4 mb-8">
            {features.map((feature, featureIndex) => (
              <motion.li
                key={featureIndex}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index + 0.1 * featureIndex }}
                className="flex items-center space-x-3"
              >
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </motion.li>
            ))}
          </ul>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleCheckout}
              className={`w-full ${
                popular 
                  ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/25' 
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
              size="lg"
            >
              {name === 'Free' ? 'Get Started Free' : `Start ${name} Plan`}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </CardContent>
        </Card>
      </div>
    </FadeIn>
  );
}
