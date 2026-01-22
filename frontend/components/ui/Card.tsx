import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    hover?: boolean;
    glass?: boolean;
    noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    hover = false,
    glass = false,
    noPadding = false,
    ...props
}) => {
    const baseStyles = 'bg-surface rounded-xl border border-gray-100/50 shadow-md transition-all duration-300 overflow-hidden';
    const hoverStyles = hover ? 'hover:-translate-y-1 hover:shadow-lg' : '';
    const glassStyles = glass ? 'backdrop-blur-md bg-opacity-80' : '';
    const paddingStyles = noPadding ? '' : 'p-6';

    return (
        <div
            className={`${baseStyles} ${hoverStyles} ${glassStyles} ${paddingStyles} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
    <div className={`mb-4 ${className}`} {...props}>{children}</div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className = '', ...props }) => (
    <h3 className={`text-lg font-semibold text-gray-800 ${className}`} {...props}>{children}</h3>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
    <div className={`${className}`} {...props}>{children}</div>
);
