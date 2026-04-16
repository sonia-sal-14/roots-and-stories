import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[#D95D39] text-white hover:bg-[#B84A2A] focus-visible:ring-[#D95D39] shadow-[0_4px_16px_rgba(217,93,57,0.3)]',
        accent: 'bg-[#D95D39] text-white hover:bg-[#B84A2A] focus-visible:ring-[#D95D39]',
        outline: 'border-2 border-[#F5E9E0]/30 text-[#F5E9E0] bg-transparent hover:bg-[#F5E9E0]/10 hover:text-[#F5E9E0]',
        ghost: 'text-[#F5E9E0] hover:bg-[#F5E9E0]/10',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
      },
      size: {
        default: 'h-12 px-6 py-3 text-base',
        sm: 'h-9 px-4 text-sm',
        lg: 'h-14 px-8 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
