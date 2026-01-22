import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    className = '',
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    disabled,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed rounded-[6px] cursor-pointer active:scale-95';

    const variants = {
        primary: 'bg-primary text-white hover:bg-[#5e50ee] shadow-primary hover:shadow-lg',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
        success: 'bg-success text-white hover:bg-[#20A059] hover:shadow-lg',
        danger: 'bg-danger text-white hover:bg-[#E42728] shadow-lg hover:shadow-xl',
        warning: 'bg-warning text-white hover:bg-[#FF8D1F]',
        info: 'bg-info text-white hover:bg-[#00B9D1]',
        ghost: 'bg-transparent text-primary hover:bg-primary/10',
        outline: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50'
    };

    const sizes = {
        sm: 'text-xs px-3 py-1.5 h-8 gap-1.5',
        md: 'text-sm px-5 py-2.5 h-10 gap-2',
        lg: 'text-base px-6 py-3 h-12 gap-2.5'
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </button>
    );
};
