import { motion } from 'framer-motion';
import type { HTMLMotionProps, Variants } from 'framer-motion';
import type { ReactNode } from 'react';

interface MotionProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (custom = {}) => ({
    opacity: 1,
    transition: {
      duration: custom.duration || 0.5,
      delay: custom.delay || 0,
      ease: "easeOut"
    }
  }),
};

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom = {}) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: custom.duration || 0.5,
      delay: custom.delay || 0,
      ease: "easeOut"
    }
  }),
};

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (custom = {}) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: custom.duration || 0.4,
      delay: custom.delay || 0,
      ease: "easeOut"
    }
  }),
};

export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: (custom = {}) => ({
    transition: {
      staggerChildren: custom.staggerDelay || 0.1,
      delayChildren: custom.delay || 0,
    },
  }),
};

export function FadeIn({ children, delay = 0, duration = 0.5, className, ...props }: MotionProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInVariants}
      custom={{ delay, duration }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function SlideUp({ children, delay = 0, duration = 0.5, className, ...props }: MotionProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideUpVariants}
      custom={{ delay, duration }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({ children, delay = 0, duration = 0.4, className, ...props }: MotionProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={scaleInVariants}
      custom={{ delay, duration }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface StaggerContainerProps extends MotionProps {
  staggerDelay?: number;
}

export function StaggerContainer({ children, delay = 0, staggerDelay = 0.1, className, ...props }: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainerVariants}
      custom={{ delay, staggerDelay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Higher-order component for page transitions
export function withPageTransition<P extends object>(Component: React.ComponentType<P>) {
  return function PageTransition(props: P) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full h-full"
      >
        <Component {...props} />
      </motion.div>
    );
  };
}
