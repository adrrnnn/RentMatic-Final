"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import React from "react";

interface SlideUpProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
}

export function SlideUp({ 
  children, 
  delay = 0, 
  duration = 0.6, 
  distance = 50,
  ...props 
}: SlideUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: distance }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

