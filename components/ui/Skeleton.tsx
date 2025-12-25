import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  animate?: boolean
}

export function Skeleton({ 
  className = '', 
  width, 
  height, 
  rounded = 'md',
  animate = true 
}: SkeletonProps) {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  }

  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <motion.div
      className={`bg-slate-800 ${roundedClasses[rounded]} ${className}`}
      style={style}
      animate={animate ? {
        opacity: [0.5, 0.8, 0.5],
      } : {}}
      transition={animate ? {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      } : {}}
    />
  )
}

// Pre-built skeleton components
export function SkeletonCard() {
  return (
    <div className="glass-card p-6 rounded-2xl space-y-4">
      <Skeleton height={24} width="60%" />
      <Skeleton height={16} width="100%" />
      <Skeleton height={16} width="80%" />
    </div>
  )
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          height={16} 
          width={i === lines - 1 ? '60%' : '100%'} 
        />
      ))}
    </div>
  )
}

export function SkeletonButton() {
  return <Skeleton height={40} width={120} rounded="lg" />
}

export function SkeletonAvatar() {
  return <Skeleton width={48} height={48} rounded="full" />
}




