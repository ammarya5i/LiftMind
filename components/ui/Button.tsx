import { ButtonHTMLAttributes, ReactNode } from 'react'
import { motion, MotionProps } from 'framer-motion'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof MotionProps> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '', 
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyles = 'font-medium rounded-xl transition-all duration-200 flex items-center justify-center'
  
  const variants = {
    primary: 'btn-power disabled:opacity-50 disabled:cursor-not-allowed',
    secondary: 'bg-dark-700 text-electric-400 border border-dark-600 hover:border-electric-500 hover:text-electric-300 disabled:opacity-50',
    ghost: 'text-slate-400 hover:text-slate-200 hover:bg-dark-800/50 disabled:opacity-50',
    danger: 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-50'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3',
    lg: 'px-8 py-4 text-lg'
  }

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...(props as any)}
    >
      {children}
    </motion.button>
  )
}
