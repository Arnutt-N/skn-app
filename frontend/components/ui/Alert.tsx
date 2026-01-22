import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'primary' | 'success' | 'danger' | 'warning' | 'info';
    title?: string;
    closable?: boolean;
    onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
    children,
    className = '',
    variant = 'primary',
    title,
    closable = false,
    onClose,
    ...props
}) => {
    const variants = {
        primary: 'bg-primary/10 text-primary border-l-4 border-l-primary',
        success: 'bg-success/10 text-success border-l-4 border-l-success',
        danger: 'bg-danger/10 text-danger border-l-4 border-l-danger',
        warning: 'bg-warning/10 text-warning border-l-4 border-l-warning',
        info: 'bg-info/10 text-info border-l-4 border-l-info',
    };

    const icons = {
        primary: <Info className="w-5 h-5" />,
        success: <CheckCircle className="w-5 h-5" />,
        danger: <XCircle className="w-5 h-5" />,
        warning: <AlertCircle className="w-5 h-5" />,
        info: <Info className="w-5 h-5" />,
    };

    return (
        <div
            className={`relative p-4 rounded-r-md flex items-start gap-3 shadow-sm ${variants[variant]} ${className}`}
            role="alert"
            {...props}
        >
            <div className="flex-shrink-0 mt-0.5">{icons[variant]}</div>
            <div className="flex-1 pr-6">
                {title && <h5 className="font-semibold mb-1 leading-tight">{title}</h5>}
                <div className="text-sm opacity-90">{children}</div>
            </div>
            {closable && (
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/5 transition-colors"
                    aria-label="Close"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};
