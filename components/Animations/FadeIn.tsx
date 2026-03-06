"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import React from "react";

interface FadeInProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none" | "scale" | "bounce";
  stagger?: boolean;
}

export function FadeIn({ 
  children, 
  delay = 0, 
  duration = 0.6, 
  direction = "up",
  stagger = false,
  ...props 
}: FadeInProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case "up":
        return { opacity: 0, y: 40, scale: 0.95 };
      case "down":
        return { opacity: 0, y: -40, scale: 0.95 };
      case "left":
        return { opacity: 0, x: 40, scale: 0.95 };
      case "right":
        return { opacity: 0, x: -40, scale: 0.95 };
      case "scale":
        return { opacity: 0, scale: 0.8 };
      case "bounce":
        return { opacity: 0, y: 60, scale: 0.9 };
      case "none":
        return { opacity: 0 };
      default:
        return { opacity: 0, y: 40, scale: 0.95 };
    }
  };

  const getAnimatePosition = () => {
    switch (direction) {
      case "up":
        return { opacity: 1, y: 0, scale: 1 };
      case "down":
        return { opacity: 1, y: 0, scale: 1 };
      case "left":
        return { opacity: 1, x: 0, scale: 1 };
      case "right":
        return { opacity: 1, x: 0, scale: 1 };
      case "scale":
        return { opacity: 1, scale: 1 };
      case "bounce":
        return { 
          opacity: 1, 
          y: 0, 
          scale: 1
        };
      case "none":
        return { opacity: 1 };
      default:
        return { opacity: 1, y: 0, scale: 1 };
    }
  };

  return (
    <motion.div
      initial={getInitialPosition()}
      animate={getAnimatePosition()}
      transition={
        direction === "bounce" 
          ? { type: "spring", stiffness: 300, damping: 20, delay, duration }
          : { duration, delay, ease: "easeOut" }
      }
      whileHover={direction !== "none" ? { scale: 1.02, y: -2 } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
}
