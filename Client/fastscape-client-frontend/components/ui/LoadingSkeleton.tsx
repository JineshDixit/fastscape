'use client';

import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
  variant?: 'default' | 'card' | 'avatar' | 'button';
}

export const LoadingSkeleton = ({ 
  className, 
  lines = 3, 
  variant = 'default' 
}: LoadingSkeletonProps) => {
  const baseClasses = "animate-pulse bg-gray-200 dark:bg-gray-700 rounded";

  const variants = {
    default: "h-4 w-full mb-2",
    card: "h-48 w-full mb-4",
    avatar: "h-12 w-12 rounded-full",
    button: "h-10 w-24"
  };

  if (variant === 'card') {
    return (
      <div className={cn("space-y-4", className)}>
        <div className={cn(baseClasses, "h-48 w-full")} />
        <div className="space-y-2">
          <div className={cn(baseClasses, "h-4 w-3/4")} />
          <div className={cn(baseClasses, "h-4 w-1/2")} />
        </div>
      </div>
    );
  }

  if (variant === 'avatar') {
    return <div className={cn(baseClasses, variants.avatar, className)} />;
  }

  if (variant === 'button') {
    return <div className={cn(baseClasses, variants.button, className)} />;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div 
          key={index}
          className={cn(
            baseClasses, 
            variants.default,
            index === lines - 1 ? "w-3/4" : "w-full"
          )} 
        />
      ))}
    </div>
  );
};

export default LoadingSkeleton;