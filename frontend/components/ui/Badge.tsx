import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'gray';
    outline?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    className = '',
    variant = 'primary',
    outline = false,
    ...props
}) => {
    // Using specific colors based on the design system
    // Primary: #7367F0, Success: #28C76F, Danger: #EA5455, Warning: #FF9F43, Info: #00CFE8

    const variants = {
        primary: outline ? 'border border-primary text-primary bg-primary/10' : 'bg-primary/15 text-primary',
        success: outline ? 'border border-success text-success bg-success/10' : 'bg-success/15 text-success',
        danger: outline ? 'border border-danger text-danger bg-danger/10' : 'bg-danger/15 text-danger',
        warning: outline ? 'border border-warning text-warning bg-warning/10' : 'bg-warning/15 text-warning',
        info: outline ? 'border border-info text-info bg-info/10' : 'bg-info/15 text-info',
        gray: outline ? 'border border-gray-400 text-gray-600 bg-gray-100' : 'bg-gray-100 text-gray-600'
    };

    return (
        <span
            className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </span>
    );
};
